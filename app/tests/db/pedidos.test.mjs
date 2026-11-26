import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

// Requer o MySQL local migrado e semeado (pnpm db:subir && pnpm db:migrar && pnpm db:semear).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }
process.env.SESSION_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres!'
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { validateRegistration } = await import('../../lib/auth.ts')
const { createAccount, createAdmin } = await import('../../lib/accounts.ts')
const { saveStoreSettings, saveProductFor, setStoreStatus, catalogFor } = await import('../../lib/catalog.ts')
const { createOrder, listOrders, transitionOrder, chooseOrderPayment, messageOrder, expireDueOrders, parseCreateInput, HttpError } = await import('../../lib/orders.ts')

const run = Math.random().toString(36).slice(2, 8)
const mail = n => `teste-${run}-${n}@exemplo.com`
const reg = extra => { const r = validateRegistration({ phone: '91988880000', password: 'senha-segura-1', street: 'Rua A', number: '1', neighborhood: 'Aldeia', ...extra }); assert.equal(r.ok, true); return r.data }
const allDay = Array.from({ length: 7 }, (_, day) => ({ day, opens: '00:00', closes: '23:59', active: true }))
const address = { street: 'Rua Nova', number: '120', complement: 'Casa azul', reference: 'Perto da praça', neighborhood: 'Centro' }
const input = (extra = {}) => ({ storeId: S.store, requestId: `req-${Math.random().toString(36).slice(2)}-${run}`, phone: '(91) 98888-0000', address, feeCents: 300, items: [{ productId: S.liter, quantity: 1, unitPriceCents: 1500 }], ...extra })
const S = {}; let client, other, op, op2, admin

const limpar = () => cleanTestData(db)
const as = (user, role, name) => ({ userId: user.id, role, name })
before(async () => {
  await limpar()
  const a = await createAccount(reg({ tipo: 'batedeira', name: 'João Operador', email: mail('op'), storeName: 'Açaí A', address: 'Rua das Flores, 42', document: '529.982.247-25' }), 'h')
  const b = await createAccount(reg({ tipo: 'batedeira', name: 'Maria Operadora', email: mail('op2'), storeName: 'Açaí B', address: 'Rua B, 2', document: '529.982.247-25' }), 'h')
  op = as(a, 'operador', 'João Operador'); op2 = as(b, 'operador', 'Maria Operadora')
  client = as(await createAccount(reg({ tipo: 'cliente', name: 'Ana Cliente', email: mail('c') }), 'h'), 'cliente', 'Ana Cliente')
  other = as(await createAccount(reg({ tipo: 'cliente', name: 'Beto Cliente', email: mail('c2') }), 'h'), 'cliente', 'Beto Cliente')
  admin = as(await createAdmin({ email: mail('adm'), name: 'Adm Teste', passwordHash: 'h' }), 'admin', 'Adm Teste')
  assert.deepEqual(await saveStoreSettings(a.id, { isOpen: true, deliveryAvailable: true, estimate: { min: 25, max: 35 }, coverage: [{ neighborhood: 'Centro', feeCents: 300, min: 20, max: 30 }], schedule: allDay }), { ok: true })
  S.liter = (await saveProductFor(a.id, { name: 'Açaí de 15', description: '', volumeMl: 1000, priceCents: 1500, active: true, available: true, showUnavailable: false })).product.id
  S.half = (await saveProductFor(a.id, { name: 'Açaí de 15', description: '', volumeMl: 500, priceCents: 800, active: true, available: true, showUnavailable: false })).product.id
  S.store = (await catalogFor(a.id, 'operador')).stores[0].id
  assert.equal((await setStoreStatus(admin.userId, { id: S.store, status: 'ATIVA', reason: 'ok', eligibilityConfirmed: true })).ok, true)
})
after(async () => { await limpar(); await db.$disconnect() })
const fails = async (promise, status, pattern) => { await assert.rejects(promise, e => e instanceof HttpError && e.status === status && (!pattern || pattern.test(e.message)), `esperava HttpError ${status}`) }

test('pedido: preço, taxa e total vêm do banco; snapshot, itens e linha do tempo são gravados', async () => {
  const order = await createOrder(client, input({ items: [{ productId: S.liter, quantity: 1, unitPriceCents: 1500 }, { productId: S.half, quantity: 2, note: 'Sem açúcar' }] }))
  assert.match(order.id, /^AC-[0-9A-F]{20}$/)
  assert.deepEqual([order.subtotalCents, order.deliveryFeeCents, order.totalCents, order.status], [3100, 300, 3400, 'AGUARDANDO_ACEITE'])
  assert.deepEqual(order.items.map(i => [i.name, i.quantity, i.unitPriceCents, i.note ?? null]), [['Açaí de 15', 1, 1500, null], ['Açaí de 15', 2, 800, 'Sem açúcar']])
  assert.equal(order.address.neighborhood, 'Centro')
  assert.match(order.address.street, /Rua Nova, 120 · Casa azul/)
  assert.equal(order.phone, '91988880000')
  assert.equal(order.estimatedRange, '20–30 min')
  assert.deepEqual(order.timeline.map(e => [e.to, e.author]), [['AGUARDANDO_ACEITE', 'Ana Cliente']])
  assert.ok(Date.parse(order.acceptedDeadline) - Date.parse(order.createdAt) === 300000, 'prazo de aceite de 5 minutos')
})

test('idempotência: repetir (e enviar em paralelo) o mesmo requestId não duplica o pedido', async () => {
  const one = input()
  const first = await createOrder(client, one)
  assert.equal((await createOrder(client, one)).id, first.id)
  const par = input()
  const results = await Promise.all(Array.from({ length: 6 }, () => createOrder(client, par).catch(e => e)))
  assert.ok(results.every(r => r.id === results[0].id), JSON.stringify(results.map(r => r.message ?? r.id)))
  assert.equal(await db.pedidos.count({ where: { chave_idempotencia: par.requestId } }), 1)
  assert.notEqual((await createOrder(other, par)).id, results[0].id, 'a chave é por cliente')
})

test('validação no servidor: catálogo mudou, taxa mudou, volume mínimo, bairro sem cobertura, loja inexistente e papel', async () => {
  await fails(createOrder(client, input({ items: [{ productId: S.liter, quantity: 1, unitPriceCents: 1 }] })), 409, /catálogo mudou/)
  await fails(createOrder(client, input({ feeCents: 0 })), 409, /taxa/)
  await fails(createOrder(client, input({ items: [{ productId: S.half, quantity: 1 }] })), 400, /1\.000 ml/)
  await fails(createOrder(client, input({ address: { ...address, neighborhood: 'Aldeia' }, feeCents: undefined })), 400, /não entrega/)
  await fails(createOrder(client, input({ items: [{ productId: '999999', quantity: 1 }] })), 409, /removido/)
  await fails(createOrder(client, input({ storeId: '999999' })), 404)
  await fails(createOrder(client, input({ items: [{ productId: S.liter, quantity: 0 }] })), 400)
  await fails(createOrder(op, input()), 403)
  assert.throws(() => parseCreateInput({ storeId: 'x' }), HttpError)
})

test('visibilidade: cliente vê só os seus; batedeira só os dela; administrador todos; terceiros recebem 404', async () => {
  const mine = await createOrder(client, input())
  const theirs = await createOrder(other, input())
  const ids = async s => (await listOrders(s)).map(o => o.id)
  assert.ok((await ids(client)).includes(mine.id) && !(await ids(client)).includes(theirs.id))
  assert.ok((await ids(op)).includes(mine.id) && (await ids(op)).includes(theirs.id))
  assert.deepEqual(await ids(op2), [])
  assert.ok((await ids(admin)).includes(mine.id) && (await ids(admin)).includes(theirs.id))
  await fails(transitionOrder(other, mine.id, 'CANCELADO'), 404)
  await fails(transitionOrder(op2, mine.id, 'ACEITO'), 404)
})

test('fluxo completo em dinheiro: aceitar, escolher pagamento, preparar, entregar; estados inválidos e motivos', async () => {
  const order = await createOrder(client, input())
  await fails(transitionOrder(op, order.id, 'ENTREGUE'), 400)
  await fails(transitionOrder(op, order.id, 'RECUSADO'), 400, /motivo/)
  await fails(transitionOrder(client, order.id, 'ACEITO'), 400)
  const accepted = await transitionOrder(op, order.id, 'ACEITO')
  assert.equal(accepted.status, 'ACEITO')
  assert.ok(accepted.paymentDeadline && Date.parse(accepted.paymentDeadline) > Date.now(), '10 minutos para escolher a forma')
  const row = await db.pedidos.findUnique({ where: { codigo: order.id } })
  assert.ok(row.aceito_em && row.escolha_pagamento_expira_em)
  await fails(chooseOrderPayment(client, order.id, 'PIX'), 400, /Pix/)
  await fails(chooseOrderPayment(client, order.id, 'DINHEIRO', 100), 400, /troco/)
  await fails(chooseOrderPayment(other, order.id, 'DINHEIRO'), 404)
  await fails(chooseOrderPayment(op, order.id, 'DINHEIRO'), 403)
  const paid = await chooseOrderPayment(client, order.id, 'DINHEIRO', 5000)
  assert.deepEqual([paid.status, paid.payment, paid.changeForCents], ['EM_PREPARO', 'DINHEIRO', 5000])
  await fails(chooseOrderPayment(client, order.id, 'DINHEIRO'), 400)
  for (const to of ['PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']) assert.equal((await transitionOrder(op, order.id, to)).status, to)
  const done = (await listOrders(client)).find(o => o.id === order.id)
  assert.deepEqual(done.timeline.map(e => e.to), ['AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'])
  assert.ok((await db.pedidos.findUnique({ where: { codigo: order.id } })).finalizado_em)
})

test('recusa e cancelamento exigem motivo; cliente cancela só antes do aceite; administrador cancela depois com auditoria', async () => {
  const a = await createOrder(client, input())
  assert.equal((await transitionOrder(op, a.id, 'RECUSADO', 'Sem insumo')).timeline.at(-1).reason, 'Sem insumo')
  const b = await createOrder(client, input())
  assert.equal((await transitionOrder(client, b.id, 'CANCELADO')).status, 'CANCELADO')
  const c = await createOrder(client, input())
  await transitionOrder(op, c.id, 'ACEITO')
  await fails(transitionOrder(client, c.id, 'CANCELADO'), 400, /perfil/)
  await fails(transitionOrder(admin, c.id, 'CANCELADO'), 400, /motivo/)
  assert.equal((await transitionOrder(admin, c.id, 'CANCELADO', 'Pedido do cliente por telefone')).status, 'CANCELADO')
  const audit = (await catalogFor(admin.userId, 'admin')).audit.filter(e => e.entityId === c.id)
  assert.deepEqual([audit.length, audit[0].action, audit[0].reason, audit[0].author], [1, 'Cancelamento operacional', 'Pedido do cliente por telefone', 'Adm Teste'])
})

test('mensagens: batedeira só predefinidas; administrador livre e auditada; cliente não envia', async () => {
  const order = await createOrder(client, input())
  await transitionOrder(op, order.id, 'ACEITO')
  assert.equal((await messageOrder(op, order.id, 'O entregador chegou.')).timeline.at(-1).message, 'O entregador chegou.')
  await fails(messageOrder(op, order.id, 'texto livre'), 400, /predefinida/)
  await fails(messageOrder(client, order.id, 'O entregador chegou.'), 403)
  await fails(messageOrder(op2, order.id, 'O entregador chegou.'), 404)
  const done = await messageOrder(admin, order.id, 'Contato feito com o cliente.')
  assert.equal(done.timeline.at(-1).author, 'Adm Teste')
  assert.equal(done.status, 'ACEITO')
  assert.equal((await catalogFor(admin.userId, 'admin')).audit.filter(e => e.entityId === order.id && e.action === 'Intervenção administrativa').length, 1)
})

test('expiração: sem resposta em 5 min vira EXPIRADO; sem escolher pagamento em 10 min vira CANCELADO; repetir não altera', async () => {
  const noReply = await createOrder(client, input())
  const accepted = await createOrder(client, input())
  await transitionOrder(op, accepted.id, 'ACEITO')
  assert.equal(await expireDueOrders(Date.now() + 60_000), 0, 'ainda dentro do prazo')
  const changed = await expireDueOrders(Date.now() + 6 * 60_000)
  assert.ok(changed >= 1)
  const find = async id => (await listOrders(client)).find(o => o.id === id)
  const expired = await find(noReply.id)
  assert.deepEqual([expired.status, expired.timeline.at(-1).author], ['EXPIRADO', 'Expiração automática'])
  assert.equal((await find(accepted.id)).status, 'ACEITO', 'a escolha do pagamento tem 10 min')
  await expireDueOrders(Date.now() + 11 * 60_000)
  const cancelled = await find(accepted.id)
  assert.deepEqual([cancelled.status, cancelled.timeline.at(-1).reason], ['CANCELADO', 'Forma de pagamento não escolhida'])
  assert.equal(await expireDueOrders(Date.now() + 20 * 60_000), 0, 'idempotente')
  const events = await db.eventos_pedido.findMany({ where: { pedidos: { codigo: noReply.id } } })
  assert.deepEqual(events.map(e => e.tipo), ['PEDIDO_CRIADO', 'STATUS_ALTERADO'])
  assert.equal(events[1].origem_processo, 'expiracao_automatica')
  await fails(transitionOrder(op, noReply.id, 'ACEITO'), 400)
})

test('corrida: aceite do operador e expiração do sistema ao mesmo tempo deixam um único desfecho consistente', async () => {
  for (let i = 0; i < 5; i++) {
    const order = await createOrder(client, input())
    const [expiry, accept] = await Promise.allSettled([expireDueOrders(Date.now() + 6 * 60_000), transitionOrder(op, order.id, 'ACEITO')])
    const final = (await listOrders(client)).find(o => o.id === order.id)
    assert.equal(expiry.status, 'fulfilled')
    assert.ok(['ACEITO', 'EXPIRADO'].includes(final.status), final.status)
    assert.equal(final.timeline.length, 2, JSON.stringify(final.timeline.map(e => e.to)))
    assert.equal(accept.status === 'fulfilled', final.status === 'ACEITO')
  }
})
