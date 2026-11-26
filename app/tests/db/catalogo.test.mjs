import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

// Requer o MySQL local migrado e semeado (pnpm db:subir && pnpm db:migrar && pnpm db:semear).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }
process.env.SESSION_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres!'
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { validateRegistration } = await import('../../lib/auth.ts')
const { createAccount, createAdmin } = await import('../../lib/accounts.ts')
const { catalogFor, saveStoreSettings, saveProductFor, setStoreStatus } = await import('../../lib/catalog.ts')

const run = Math.random().toString(36).slice(2, 8)
const mail = n => `teste-${run}-${n}@exemplo.com`
const base = { tipo: 'batedeira', name: 'João', phone: '91988880000', password: 'senha-segura-1', street: 'Rua A', number: '1', neighborhood: 'Aldeia', storeName: 'Açaí do João', address: 'Rua das Flores, 42', document: '529.982.247-25' }
const registro = extra => { const r = validateRegistration({ ...base, ...extra }); assert.equal(r.ok, true); return r.data }
const schedule = Array.from({ length: 7 }, (_, day) => ({ day, opens: '08:00', closes: '20:00', active: day !== 0 }))
const settings = (extra = {}) => ({ isOpen: true, deliveryAvailable: true, estimate: { min: 25, max: 35 }, coverage: [{ neighborhood: 'Centro', feeCents: 300, min: 20, max: 30 }, { neighborhood: 'Aldeia', feeCents: 0, min: 25, max: 40 }], schedule, ...extra })
const product = (extra = {}) => ({ name: 'Açaí de 15', description: 'Batido na hora', volumeMl: 1000, priceCents: 1500, active: true, available: true, showUnavailable: false, ...extra })

let a, b, adminId, client
const limpar = () => cleanTestData(db)
before(async () => {
  await limpar()
  a = await createAccount(registro({ email: mail('a') }), 'h')
  b = await createAccount(registro({ email: mail('b'), storeName: 'Outra Batedeira' }), 'h')
  client = await createAccount(validateRegistration({ tipo: 'cliente', name: 'Ana', phone: '91988880000', email: mail('c'), password: 'senha-segura-1', street: 'Rua', number: '1', neighborhood: 'Aldeia' }).data, 'h')
  adminId = (await createAdmin({ email: mail('adm'), name: 'Adm', passwordHash: 'h' })).id
})
after(async () => { await limpar(); await db.$disconnect() })

test('operador salva bairros, taxas, faixa e horários; a leitura devolve o mesmo', async () => {
  assert.deepEqual(await saveStoreSettings(a.id, settings()), { ok: true })
  const { stores } = await catalogFor(a.id, 'operador')
  assert.equal(stores.length, 1)
  const s = stores[0]
  assert.deepEqual([s.isOpen, s.deliveryAvailable, s.estimatedRange, s.adminStatus], [true, true, '25–35 min', 'EM_ANALISE'])
  assert.deepEqual(s.coverage.map(c => [c.neighborhood, c.feeCents, c.estimatedRange]), [['Aldeia', 0, '25–40 min'], ['Centro', 300, '20–30 min']])
  assert.deepEqual(s.schedule.map(h => [h.opens, h.closes, h.active]), schedule.map(h => [h.opens, h.closes, h.active]))
  assert.equal(s.document, undefined, 'documento não vai para o operador')
  assert.equal((await saveStoreSettings(a.id, settings({ coverage: [{ neighborhood: 'Centro', feeCents: 100, min: 10, max: 20 }] }))).ok, true)
  assert.equal((await catalogFor(a.id, 'operador')).stores[0].coverage.length, 1, 'salvar substitui os bairros')
})

test('configuração inválida é recusada sem alterar nada; cliente e administrador não editam a loja', async () => {
  const antes = (await catalogFor(a.id, 'operador')).stores[0]
  const r = await saveStoreSettings(a.id, settings({ coverage: [{ neighborhood: 'Zona rural', feeCents: 0, min: 1, max: 2 }] }))
  assert.equal(r.ok, false)
  assert.deepEqual((await catalogFor(a.id, 'operador')).stores[0].coverage, antes.coverage)
  assert.equal((await saveStoreSettings(client.id, settings())).status, 403)
  assert.equal((await saveStoreSettings(adminId, settings())).status, 403)
})

test('produtos: cria, edita e arquiva só na própria batedeira', async () => {
  const created = await saveProductFor(a.id, product())
  assert.equal(created.ok, true)
  const id = created.product.id
  assert.match(id, /^\d+$/)
  const edited = await saveProductFor(a.id, { ...product({ priceCents: 1700 }), id })
  assert.equal(edited.product.priceCents, 1700)
  assert.equal((await saveProductFor(b.id, { ...product(), id })).status, 404, 'produto de outra batedeira')
  assert.equal((await saveProductFor(a.id, { ...product(), id: 'novo-uuid' })).ok, true, 'id não numérico cria produto novo')
  assert.equal((await saveProductFor(a.id, product({ volumeMl: 750 }))).ok, false)
  await saveProductFor(a.id, { ...product({ active: false }), id })
  assert.equal((await catalogFor(a.id, 'operador')).products.find(p => p.id === id).active, false, 'arquivado continua visível ao operador')
})

test('administrador: ativar exige bairro, elegibilidade e motivo; registra auditoria; suspender some do cliente', async () => {
  const storeA = (await catalogFor(a.id, 'operador')).stores[0].id
  const storeB = (await catalogFor(b.id, 'operador')).stores[0].id
  assert.match((await setStoreStatus(adminId, { id: storeB, status: 'ATIVA', reason: 'ok', eligibilityConfirmed: true })).error, /bairro/, 'B ainda não tem bairro')
  assert.equal((await setStoreStatus(adminId, { id: storeA, status: 'ATIVA', reason: 'ok', eligibilityConfirmed: false })).ok, false)
  assert.equal((await setStoreStatus(adminId, { id: storeA, status: 'ATIVA', reason: '', eligibilityConfirmed: true })).ok, false)
  assert.deepEqual(await setStoreStatus(adminId, { id: storeA, status: 'ATIVA', reason: 'Conferida fora do sistema', eligibilityConfirmed: true }), { ok: true })
  assert.equal((await setStoreStatus(adminId, { id: storeA, status: 'ATIVA', reason: 'de novo', eligibilityConfirmed: true })).ok, false, 'mesma situação')
  const visible = await catalogFor(client.id, 'cliente')
  assert.deepEqual(visible.stores.map(s => s.name).filter(n => n === 'Açaí do João' || n === 'Outra Batedeira'), ['Açaí do João'])
  const mine = visible.products.filter(p => p.storeId === storeA)
  assert.ok(mine.length >= 1 && mine.every(p => p.active), 'cliente não vê produto arquivado')
  const audit = (await catalogFor(adminId, 'admin')).audit.filter(e => e.entityId === storeA)
  assert.equal(audit.length, 1)
  assert.deepEqual([audit[0].author, audit[0].reason], ['Adm', 'Conferida fora do sistema'])
  await setStoreStatus(adminId, { id: storeA, status: 'SUSPENSA', reason: 'Pausa', eligibilityConfirmed: false })
  assert.equal((await catalogFor(client.id, 'cliente')).stores.some(s => s.id === storeA), false)
  assert.equal((await saveStoreSettings(a.id, settings({ coverage: [] }))).ok, true, 'suspensa pode esvaziar bairros')
})

test('administrador vê todas com documento mascarado; operador de outra batedeira não vê a minha', async () => {
  const all = (await catalogFor(adminId, 'admin')).stores.filter(s => s.name === 'Açaí do João' || s.name === 'Outra Batedeira')
  assert.equal(all.length, 2)
  assert.ok(all.every(s => s.document === 'CPF ***.982.247-**'))
  assert.equal(JSON.stringify(all).includes('52998224725'), false)
  const onlyB = (await catalogFor(b.id, 'operador')).stores
  assert.deepEqual(onlyB.map(s => s.name), ['Outra Batedeira'])
})
