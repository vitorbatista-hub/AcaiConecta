import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }
process.env.SESSION_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres!'
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { hashPassword, verifyPassword, validateRegistration } = await import('../../lib/auth.ts')
const { createAccount } = await import('../../lib/accounts.ts')
const { createSession, getActiveSession } = await import('../../lib/sessions.ts')
const profile = await import('../../lib/profile.ts')

const run = Math.random().toString(36).slice(2, 8)
const mail = nome => `teste-${run}-${nome}@exemplo.com`
const base = { tipo: 'cliente', name: 'Ana Souza', phone: '91988880000', password: 'senha-segura-1', street: 'Rua Nova', number: '120', neighborhood: 'Aldeia' }
const criar = async extra => (await createAccount(validateRegistration({ ...base, ...extra }).data, hashPassword('senha-segura-1'))).id
let ana, bia, joao

before(async () => {
  await cleanTestData(db)
  await db.bairros.upsert({ where: { nome: 'Aldeia' }, create: { nome: 'Aldeia' }, update: {} })
  ana = await criar({ email: mail('ana') })
  bia = await criar({ email: mail('bia') })
  joao = await criar({ tipo: 'batedeira', email: mail('joao'), storeName: 'Batedeira do Perfil', address: 'Rua das Flores, 42', document: '529.982.247-25' })
})
after(async () => { await cleanTestData(db); await db.$disconnect() })

test('dados pessoais mudam só na própria conta', async () => {
  assert.deepEqual(await profile.updatePersonal(ana, 'cliente', { name: 'Ana Lima', phone: '91977770000' }), { ok: true })
  assert.equal((await profile.getProfile(ana)).name, 'Ana Lima')
  assert.equal((await profile.getProfile(bia)).name, 'Ana Souza')
})

test('endereços: limite de dois (inclusive em paralelo), principal único, remoção lógica e sem acesso a terceiros', async () => {
  const novo = n => ({ street: 'Rua Dois', number: n, neighborhood: 'Aldeia' })
  const results = await Promise.all(['1', '2', '3'].map(n => profile.saveAddressFor(ana, novo(n))))
  assert.equal(results.filter(r => r.ok).length, 1)
  let list = await profile.listAddresses(ana)
  assert.equal(list.length, 2)
  const second = list.find(a => !a.primary)
  assert.equal((await profile.saveAddressFor(ana, { ...second, primary: true })).ok, true)
  list = await profile.listAddresses(ana)
  assert.deepEqual(list.filter(a => a.primary).map(a => a.id), [second.id])
  assert.equal((await profile.saveAddressFor(ana, { ...list[0], primary: false })).ok, true)
  assert.equal((await profile.listAddresses(ana)).filter(a => a.primary).length, 1)
  assert.equal((await profile.saveAddressFor(bia, { ...second, street: 'Invasão' })).status, 404)
  assert.equal((await profile.removeAddressFor(bia, second.id)).status, 404)
  assert.equal((await profile.removeAddressFor(ana, second.id)).ok, true)
  list = await profile.listAddresses(ana)
  assert.deepEqual(list.map(a => a.primary), [true])
  assert.equal(await db.enderecos_clientes.count({ where: { cliente_id: ana, ativo: false } }), 1)
})

test('e-mail: exige senha atual e não aceita e-mail de outra conta', async () => {
  assert.equal((await profile.changeEmail(ana, { email: mail('ana2'), currentPassword: 'errada' }, 'teste')).ok, false)
  assert.equal((await profile.changeEmail(ana, { email: mail('bia'), currentPassword: 'senha-segura-1' }, 'teste')).status, 409)
  assert.equal((await profile.changeEmail(ana, { email: mail('ana2'), currentPassword: 'senha-segura-1' }, 'teste')).ok, true)
  assert.equal((await profile.getProfile(ana)).email, mail('ana2'))
})

test('senha: troca encerra as outras sessões e mantém a atual', async () => {
  const atual = await createSession(bia, 'cliente')
  const outra = await createSession(bia, 'cliente')
  assert.equal((await profile.changePassword(bia, { currentPassword: 'errada', newPassword: 'senha-nova-123' }, 'teste', atual.token)).ok, false)
  assert.equal((await profile.changePassword(bia, { currentPassword: 'senha-segura-1', newPassword: 'senha-nova-123' }, 'teste', atual.token)).ok, true)
  assert.ok(await getActiveSession(atual.token))
  assert.equal(await getActiveSession(outra.token), null)
  assert.equal(verifyPassword('senha-nova-123', (await db.usuarios.findUnique({ where: { id: bia } })).senha_hash), true)
})

test('batedeira: altera o cadastro, audita, não muda situação nem documento', async () => {
  const input = { name: 'Açaí Novo', description: 'Tradicional', phone: '91966660000', address: 'Rua das Flores, 43', neighborhood: 'Aldeia', reference: '', document: '00000000000' }
  assert.equal((await profile.updateStoreProfile(ana, input)).status, 403)
  assert.equal((await profile.updateStoreProfile(joao, input)).ok, true)
  assert.equal((await profile.updateStoreProfile(joao, input)).ok, true)
  const row = await db.batedeiras.findUnique({ where: { responsavel_id: joao } })
  assert.deepEqual([row.nome, row.documento, row.status], ['Açaí Novo', '52998224725', 'EM_ANALISE'])
  const events = await db.eventos_auditoria.findMany({ where: { usuario_id: joao } })
  assert.equal(events.length, 1, 'salvar sem mudança não gera evento')
  assert.match(events[0].detalhes.reason, /nome/)
  const view = await profile.getProfile(joao)
  assert.equal(view.store.document, 'CPF ***.982.247-**')
  assert.equal(JSON.stringify(view).includes('52998224725'), false)
})
