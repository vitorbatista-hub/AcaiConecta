import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

// Requer o MySQL local migrado e semeado (pnpm db:subir && pnpm db:migrar && pnpm db:semear).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }
process.env.SESSION_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres!'
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { validateRegistration } = await import('../../lib/auth.ts')
const { createAccount, createAdmin, createResetToken } = await import('../../lib/accounts.ts')
const { createSession, getActiveSession } = await import('../../lib/sessions.ts')
const { updatePersonal } = await import('../../lib/profile.ts')
const { catalogFor } = await import('../../lib/catalog.ts')
const { listCustomers, setCustomerStatus } = await import('../../lib/customers.ts')

const run = Math.random().toString(36).slice(2, 8)
const mail = n => `teste-${run}-${n}@exemplo.com`
const register = n => createAccount(validateRegistration({ tipo: 'cliente', name: 'Ana', phone: '91988880000', email: mail(n), password: 'senha-segura-1', street: 'Rua', number: '1', neighborhood: 'Aldeia' }).data, 'h')
const find = async id => (await listCustomers()).find(c => c.id === String(id))
const auditsOf = id => db.eventos_auditoria.findMany({ where: { entidade_tipo: 'cliente', entidade_id: id } })

let a, b, adminId
before(async () => {
  await cleanTestData(db)
  a = await register('a'); b = await register('b')
  adminId = (await createAdmin({ email: mail('adm'), name: 'Adm', passwordHash: 'h' })).id
})
after(async () => { await cleanTestData(db); await db.$disconnect() })

test('a lista traz todos os clientes do banco, com o nome atual, e só clientes', async () => {
  await updatePersonal(a.id, 'cliente', { name: 'Ana Renomeada', phone: '91988880000' })
  assert.equal((await find(a.id)).name, 'Ana Renomeada')
  assert.equal((await find(b.id)).status, 'ATIVO')
  assert.equal(await find(adminId), undefined)
  assert.equal('senha_hash' in (await find(a.id)), false)
})

test('bloquear encerra sessões e links de redefinição, audita, e não afeta outro cliente', async () => {
  const sa = await createSession(a.id, 'cliente'); const sb = await createSession(b.id, 'cliente')
  assert.ok(await createResetToken(mail('a')))
  assert.deepEqual(await setCustomerStatus(adminId, { id: String(a.id), status: 'BLOQUEADO', reason: 'Teste de bloqueio' }), { ok: true })
  assert.equal(await getActiveSession(sa.token), null)
  assert.ok(await getActiveSession(sb.token))
  assert.equal(await createResetToken(mail('a')), null)
  assert.equal(await db.redefinicoes_senha.count({ where: { usuario_id: a.id, usada_em: null } }), 0)
  assert.equal((await find(a.id)).status, 'BLOQUEADO')
  const audits = await auditsOf(a.id)
  assert.equal(audits.length, 1)
  assert.equal(audits[0].detalhes.reason, 'Teste de bloqueio')
  const view = (await catalogFor(adminId, 'admin')).audit.find(e => e.id === `db-${audits[0].id}`)
  assert.deepEqual([view.action, view.entityId], ['Bloqueio de conta', 'Ana Renomeada'])
})

test('repetir a situação é recusado sem nova auditoria; reativar não ressuscita sessões', async () => {
  assert.equal((await setCustomerStatus(adminId, { id: String(a.id), status: 'BLOQUEADO', reason: 'De novo' })).status, 409)
  assert.equal((await auditsOf(a.id)).length, 1)
  assert.deepEqual(await setCustomerStatus(adminId, { id: String(a.id), status: 'ATIVO', reason: 'Resolvido' }), { ok: true })
  assert.equal(await db.sessoes.count({ where: { usuario_id: a.id, encerrada_em: null } }), 0)
  assert.equal((await auditsOf(a.id)).length, 2)
})

test('recusa motivo vazio, conta que não é de cliente e conta desativada', async () => {
  assert.equal((await setCustomerStatus(adminId, { id: String(b.id), status: 'BLOQUEADO', reason: '  ' })).ok, false)
  assert.equal((await setCustomerStatus(adminId, { id: String(b.id), status: 'DESATIVADO', reason: 'x' })).ok, false)
  assert.equal((await setCustomerStatus(adminId, { id: String(adminId), status: 'BLOQUEADO', reason: 'x' })).status, 404)
  await db.usuarios.update({ where: { id: b.id }, data: { status: 'DESATIVADO' } })
  assert.equal((await setCustomerStatus(adminId, { id: String(b.id), status: 'ATIVO', reason: 'x' })).status, 409)
})
