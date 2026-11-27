import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }

// Requer o MySQL local migrado e semeado (pnpm db:subir && pnpm db:migrar && pnpm db:semear) e DATABASE_URL.
process.env.SESSION_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres!'
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { hashPassword, verifyPassword, validateRegistration } = await import('../../lib/auth.ts')
const { createAccount, createAdmin, getAccountView, listStoreRegistrations, createResetToken, consumeResetToken, findUserByEmail } = await import('../../lib/accounts.ts')
const { createSession, getActiveSession, endSession, endAllSessions, purgeAuthData } = await import('../../lib/sessions.ts')
const { isThrottled, recordAttempt } = await import('../../lib/login-throttle.ts')

const run = Math.random().toString(36).slice(2, 8)
const mail = (nome) => `teste-${run}-${nome}@exemplo.com`
const base = { tipo: 'cliente', name: 'Ana Souza', phone: '(91) 98888-0000', password: 'senha-segura-1', street: 'Rua Nova', number: '120', neighborhood: 'Aldeia', complement: 'Casa azul', reference: 'Perto da praça' }
const registro = (extra) => { const r = validateRegistration({ ...base, ...extra }); assert.equal(r.ok, true, JSON.stringify(r)); return r.data }

const limpar = () => cleanTestData(db)
before(async () => { await limpar(); await db.bairros.upsert({ where: { nome: 'Aldeia' }, create: { nome: 'Aldeia' }, update: {} }) })
after(async () => { await limpar(); await db.$disconnect() })

test('cliente: cria conta e endereço principal; a visão não traz hash nem documento', async () => {
  const created = await createAccount(registro({ email: mail('ana') }), hashPassword('senha-segura-1'))
  assert.equal(created.role, 'cliente')
  const view = await getAccountView(created.id)
  assert.deepEqual(view.address, { street: 'Rua Nova', number: '120', complement: 'Casa azul', reference: 'Perto da praça', neighborhood: 'Aldeia' })
  assert.equal(view.role, 'cliente')
  assert.equal(JSON.stringify(view).includes('scrypt'), false)
  const user = await findUserByEmail(mail('ana').toUpperCase())
  assert.equal(verifyPassword('senha-segura-1', user.senha_hash), true)
})

test('batedeira: nasce EM_ANALISE, fechada e sem entrega; documento só na listagem do administrador', async () => {
  const created = await createAccount(registro({ tipo: 'batedeira', email: mail('joao'), name: 'João', storeName: 'Açaí do João', address: 'Rua das Flores, 42', document: '529.982.247-25' }), hashPassword('senha-segura-1'))
  assert.equal(created.role, 'operador')
  const view = await getAccountView(created.id)
  assert.equal(view.store.name, 'Açaí do João')
  assert.equal(view.store.status, 'EM_ANALISE')
  assert.equal(JSON.stringify(view).includes('52998224725'), false)
  const row = (await listStoreRegistrations()).find(r => r.responsavel_id === created.id)
  assert.equal(row.documento, '52998224725')
  assert.deepEqual([row.aberta, row.entrega_disponivel, row.status], [false, false, 'EM_ANALISE'])
})

test('e-mail único sem diferenciar maiúsculas; cadastros simultâneos não perdem nem duplicam contas', async () => {
  assert.ok(await createAccount(registro({ email: mail('dup') }), 'h'))
  assert.equal(await createAccount(registro({ email: mail('dup').toUpperCase() }), 'h'), null)
  const results = await Promise.all(Array.from({ length: 15 }, (_, i) => createAccount(registro({ email: mail(`c${i}`) }), 'h')))
  assert.equal(results.filter(Boolean).length, 15)
  const same = await Promise.all(Array.from({ length: 5 }, () => createAccount(registro({ email: mail('mesmo') }), 'h')))
  assert.equal(same.filter(Boolean).length, 1)
})

test('administrador: criado por função de servidor, e-mail único', async () => {
  assert.ok(await createAdmin({ email: mail('admin'), name: 'Adm', passwordHash: hashPassword('x1y2z3w4') }))
  assert.equal(await createAdmin({ email: mail('admin'), name: 'Adm', passwordHash: 'h' }), null)
  assert.equal((await getAccountView((await findUserByEmail(mail('admin'))).id)).role, 'admin')
})

test('sessão: o banco guarda só o hash; cliente 30 dias e equipe 12 horas; encerrar invalida', async () => {
  const t0 = Date.now()
  const user = await findUserByEmail(mail('ana'))
  const { token, expiresAt } = await createSession(user.id, 'cliente', t0)
  assert.ok(Math.abs(expiresAt.getTime() - (t0 + 30 * 86_400_000)) < 2000)
  assert.equal((await db.sessoes.findMany({ where: { usuario_id: user.id } })).some(s => s.token_hash === token), false)
  assert.equal((await getActiveSession(token, t0 + 1000)).email, mail('ana'))
  await endSession(token)
  assert.equal(await getActiveSession(token, t0 + 2000), null)
  const staff = await findUserByEmail(mail('admin'))
  const s = await createSession(staff.id, 'admin', t0)
  assert.ok(Math.abs(s.expiresAt.getTime() - (t0 + 12 * 3_600_000)) < 2000)
  assert.ok(await getActiveSession(s.token, t0 + 11 * 3_600_000))
  assert.equal(await getActiveSession(s.token, t0 + 13 * 3_600_000), null, 'equipe expira em 12 h')
  assert.equal(await getActiveSession('token-que-nao-existe'), null)
  assert.equal(await getActiveSession(undefined), null)
})

test('sessão do cliente é renovada a cada uso; a da equipe não', async () => {
  const t0 = Date.now()
  const user = await findUserByEmail(mail('ana'))
  const { token } = await createSession(user.id, 'cliente', t0)
  const depois = t0 + 10 * 86_400_000
  const ativa = await getActiveSession(token, depois)
  assert.ok(Math.abs(ativa.expiresAt.getTime() - (depois + 30 * 86_400_000)) < 2000)
})

test('conta bloqueada não autentica e encerrar tudo derruba as sessões', async () => {
  const user = await findUserByEmail(mail('c1'))
  const a = await createSession(user.id, 'cliente'); const b = await createSession(user.id, 'cliente')
  assert.ok(await getActiveSession(a.token))
  await endAllSessions(user.id)
  assert.equal(await getActiveSession(a.token), null)
  assert.equal(await getActiveSession(b.token), null)
  const c = await createSession(user.id, 'cliente')
  await db.usuarios.update({ where: { id: user.id }, data: { status: 'BLOQUEADO' } })
  assert.equal(await getActiveSession(c.token), null)
  assert.equal(await createResetToken(mail('c1')), null, 'conta bloqueada não recebe redefinição')
})

test('limitação de login por e-mail: espera crescente da ADR-001', async () => {
  const email = mail('limite'); const ip = '203.0.113.7'; const t0 = Date.now()
  for (let i = 0; i < 9; i++) await recordAttempt(email, ip, false, t0 - 1000 + i)
  assert.equal(await isThrottled(email, ip, t0), false, '9 falhas ainda passam')
  await recordAttempt(email, ip, false, t0 - 500)
  assert.equal(await isThrottled(email, ip, t0), true, '10 falhas: 1 min de espera')
  assert.equal(await isThrottled(email, ip, t0 + 61_000), false, 'a espera de 1 min termina')
  assert.equal(await isThrottled(mail('outro'), '198.51.100.9', t0), false, 'outro e-mail e outra origem não são afetados')
  const rows = await db.tentativas_login.findMany({ where: { email } })
  assert.equal(rows.some(r => r.origem_hash.includes('203')), false)
  assert.match(rows[0].origem_hash, /^[0-9a-f]{64}$/)
})

test('limitação por origem é alta de propósito (CGNAT): 50 falhas na janela', async () => {
  const ip = '192.0.2.50'; const t0 = Date.now()
  for (let i = 0; i < 49; i++) await recordAttempt(mail(`o${i}`), ip, false, t0 - 1000)
  assert.equal(await isThrottled(mail('novo'), ip, t0), false)
  await recordAttempt(mail('o49'), ip, false, t0 - 500)
  assert.equal(await isThrottled(mail('novo'), ip, t0), true)
})

test('redefinição: token de uso único, 30 min, hash no banco, novo pedido invalida o anterior e a troca encerra sessões', async () => {
  const user = await findUserByEmail(mail('dup'))
  assert.equal(await createResetToken('ninguem@exemplo.com'), null)
  const t0 = Date.now()
  const { token } = await createResetToken(mail('dup').toUpperCase(), t0)
  assert.equal((await db.redefinicoes_senha.findMany({ where: { usuario_id: user.id } })).some(r => r.token_hash === token), false)
  assert.equal(await consumeResetToken('token-errado', 'novo', t0 + 1), false)
  assert.equal(await consumeResetToken(token, 'novo', t0 + 31 * 60_000), false)
  const outro = await createResetToken(mail('dup'), t0)
  assert.equal(await consumeResetToken(token, 'novo', t0 + 1), false, 'novo pedido invalida o anterior')
  const sessao = await createSession(user.id, 'cliente', t0)
  assert.equal(await consumeResetToken(outro.token, 'hash-novo', t0 + 60_000), true)
  assert.equal((await findUserByEmail(mail('dup'))).senha_hash, 'hash-novo')
  assert.equal(await consumeResetToken(outro.token, 'de-novo', t0 + 61_000), false, 'uso único')
  assert.equal(await getActiveSession(sessao.token, t0 + 62_000), null, 'trocar a senha encerra as sessões')
})

test('expurgo remove sessões vencidas, tentativas antigas e redefinições usadas', async () => {
  const user = await findUserByEmail(mail('ana'))
  const t0 = Date.now()
  await createSession(user.id, 'cliente', t0 - 40 * 86_400_000)
  await recordAttempt(mail('velha'), '203.0.113.1', false, t0 - 2 * 86_400_000)
  await purgeAuthData(t0)
  assert.equal((await db.sessoes.findMany({ where: { usuario_id: user.id, expira_em: { lt: new Date(t0) } } })).length, 0)
  assert.equal(await db.tentativas_login.count({ where: { email: mail('velha') } }), 0)
})
