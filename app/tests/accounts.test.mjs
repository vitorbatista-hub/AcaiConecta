import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { isValidCnpj, isValidCpf, maskDocumento, parseDocumento } from '../lib/documento.ts'
import { validateRegistration, homePathForRole, safeNextForRole } from '../lib/staff-auth.ts'

process.env.ACCOUNTS_FILE = path.join(mkdtempSync(path.join(tmpdir(), 'acai-')), 'accounts.json')
const { createUser, findUser, listOperators, createResetToken, consumeResetToken } = await import('../lib/accounts-store.ts')

const cliente = { tipo: 'cliente', name: ' Ana  Souza ', phone: '(91) 98888-0000', email: 'Ana@Exemplo.com', password: 'senha-segura-1', street: 'Rua Nova', number: '120', complement: 'Casa azul' }
const batedeira = { ...cliente, tipo: 'batedeira', name: 'João', storeName: 'Açaí do João', address: 'Rua das Flores, 42', document: '529.982.247-25' }

test('cadastro de cliente: normaliza campos e exige nome, telefone com DDD, e-mail e senha de 8+ caracteres', () => {
  const ok = validateRegistration(cliente)
  assert.equal(ok.ok, true)
  assert.deepEqual([ok.data.name, ok.data.phone, ok.data.email], ['Ana Souza', '91988880000', 'ana@exemplo.com'])
  for (const patch of [{ street: '' }, { number: '' }, { name: 'A' }, { phone: '1234' }, { email: 'sem-arroba' }, { password: '1234567' }, { tipo: 'admin' }]) {
    assert.equal(validateRegistration({ ...cliente, ...patch }).ok, false, JSON.stringify(patch))
  }
})

test('cadastro de batedeira: exige também nome da batedeira e endereço', () => {
  assert.equal(validateRegistration(batedeira).ok, true)
  assert.equal(validateRegistration({ ...batedeira, storeName: '' }).ok, false)
  assert.equal(validateRegistration({ ...batedeira, address: 'Rua' }).ok, false)
  const cnpj = validateRegistration({ ...batedeira, document: '11.222.333/0001-81' })
  assert.deepEqual([cnpj.ok, cnpj.data.documentKind, cnpj.data.document], [true, 'CNPJ', '11222333000181'])
  for (const document of ['', '123', '111.111.111-11', '529.982.247-24', '11.222.333/0001-82']) assert.equal(validateRegistration({ ...batedeira, document }).ok, false, document)
})

test('contas: e-mail único (sem diferenciar maiúsculas) e e-mails reservados recusados', async () => {
  const base = { role: 'cliente', name: 'Ana', phone: '91988880000', hash: 'h' }
  assert.ok(await createUser({ ...base, email: 'Ana@Exemplo.com' }))
  assert.equal(await createUser({ ...base, email: 'ana@exemplo.com' }), null)
  assert.equal(await createUser({ ...base, email: 'admin@x.com' }, ['admin@x.com']), null)
  assert.equal((await findUser('ANA@exemplo.com'))?.name, 'Ana')
  const op = await createUser({ role: 'operador', name: 'João', phone: '91988880000', email: 'joao@x.com', hash: 'h', store: { id: 'store-1', name: 'Açaí', address: 'Rua A, 1', neighborhood: 'Centro' } })
  assert.equal((await listOperators()).length, 1)
  assert.equal(op.store.id, 'store-1')
})

test('cadastros simultâneos não perdem contas', async () => {
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => createUser({ role: 'cliente', name: 'N', phone: '91988880000', email: `c${i}@x.com`, hash: 'h' })))
  assert.equal(results.filter(Boolean).length, 20)
  assert.ok(await findUser('c19@x.com'))
})

test('cada perfil volta para o próprio painel', () => {
  assert.deepEqual(['cliente', 'operador', 'admin'].map(homePathForRole), ['/cliente', '/operador', '/admin'])
  assert.equal(safeNextForRole('/admin', 'cliente'), '/cliente')
  assert.equal(safeNextForRole('/cliente?view=pedidos', 'cliente'), '/cliente?view=pedidos')
})

test('cadastro de cliente guarda o endereço de entrega no Centro, com complemento e referência opcionais', () => {
  const { data } = validateRegistration({ ...cliente, reference: ' Perto da praça ' })
  assert.deepEqual(data.address, { street: 'Rua Nova', number: '120', complement: 'Casa azul', reference: 'Perto da praça', neighborhood: 'Centro' })
})

test('CPF e CNPJ: dígitos verificadores, máscara e sequências repetidas', () => {
  assert.equal(isValidCpf('529.982.247-25'), true)
  assert.equal(isValidCpf('52998224724'), false)
  assert.equal(isValidCnpj('11.222.333/0001-81'), true)
  assert.equal(isValidCnpj('00000000000000'), false)
  assert.equal(parseDocumento('529.982.247-25').kind, 'CPF')
  assert.equal(parseDocumento('1234'), null)
  assert.equal(maskDocumento('52998224725'), '***.982.247-**')
  assert.equal(maskDocumento('11222333000181'), '**.222.333/0001-**')
})

test('redefinição de senha: token de uso único, expira em 30 min e não existe para e-mail desconhecido', async () => {
  const base = { role: 'cliente', name: 'Rita', phone: '91988880000', email: 'rita@x.com', hash: 'antigo' }
  await createUser(base)
  assert.equal(await createResetToken('ninguem@x.com'), null)
  const t0 = 5_000_000
  const { token } = await createResetToken('RITA@x.com', t0)
  assert.equal(await consumeResetToken('token-errado', 'novo', t0 + 1), false)
  assert.equal(await consumeResetToken(token, 'novo', t0 + 31 * 60_000), false)
  const again = await createResetToken('rita@x.com', t0)
  assert.equal(await consumeResetToken(token, 'novo', t0 + 1), false, 'novo pedido invalida o token anterior')
  assert.equal(await consumeResetToken(again.token, 'hash-novo', t0 + 60_000), true)
  assert.equal((await findUser('rita@x.com')).hash, 'hash-novo')
  assert.equal(await consumeResetToken(again.token, 'outro', t0 + 61_000), false, 'uso único')
})
