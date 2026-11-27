import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidCnpj, isValidCpf, maskDocumento, parseDocumento } from '../lib/documento.ts'
import { validateRegistration, homePathForRole, safeNextForRole } from '../lib/auth.ts'


const cliente = { tipo: 'cliente', name: ' Ana  Souza ', phone: '(91) 98888-0000', email: 'Ana@Exemplo.com', password: 'senha-segura-1', street: 'Rua Nova', number: '120', neighborhood: 'Aldeia', complement: 'Casa azul' }
const batedeira = { ...cliente, tipo: 'batedeira', name: 'João', storeName: 'Açaí do João', address: 'Rua das Flores, 42', document: '529.982.247-25' }

test('cadastro de cliente: normaliza campos e exige nome, telefone com DDD, e-mail e senha de 8+ caracteres', () => {
  const ok = validateRegistration(cliente)
  assert.equal(ok.ok, true)
  assert.deepEqual([ok.data.name, ok.data.phone, ok.data.email], ['Ana Souza', '91988880000', 'ana@exemplo.com'])
  for (const patch of [{ street: '' }, { number: '' }, { neighborhood: '' }, { neighborhood: 'Zona rural' }, { neighborhood: 'centro' }, { name: 'A' }, { phone: '1234' }, { email: 'sem-arroba' }, { password: '1234567' }, { tipo: 'admin' }]) {
    assert.equal(validateRegistration({ ...cliente, ...patch }).ok, false, JSON.stringify(patch))
  }
})

test('cadastro de batedeira: exige também nome da batedeira e endereço', () => {
  assert.equal(validateRegistration(batedeira).ok, true)
  assert.equal(validateRegistration({ ...batedeira, storeName: '' }).ok, false)
  assert.equal(validateRegistration({ ...batedeira, address: 'Rua' }).ok, false)
  assert.equal(validateRegistration({ ...batedeira, neighborhood: '' }).ok, false)
  assert.equal(validateRegistration({ ...batedeira, neighborhood: 'Outro' }).ok, false)
  assert.equal(validateRegistration(batedeira).data.neighborhood, 'Aldeia')
  const cnpj = validateRegistration({ ...batedeira, document: '11.222.333/0001-81' })
  assert.deepEqual([cnpj.ok, cnpj.data.documentKind, cnpj.data.document], [true, 'CNPJ', '11222333000181'])
  for (const document of ['', '123', '111.111.111-11', '529.982.247-24', '11.222.333/0001-82']) assert.equal(validateRegistration({ ...batedeira, document }).ok, false, document)
})

test('cada perfil volta para o próprio painel', () => {
  assert.deepEqual(['cliente', 'operador', 'admin'].map(homePathForRole), ['/cliente', '/operador', '/admin'])
  assert.equal(safeNextForRole('/admin', 'cliente'), '/cliente')
  assert.equal(safeNextForRole('/cliente?view=pedidos', 'cliente'), '/cliente?view=pedidos')
})

test('cadastro de cliente guarda o endereço de entrega em um bairro da lista oficial, com complemento e referência opcionais', () => {
  const { data } = validateRegistration({ ...cliente, reference: ' Perto da praça ' })
  assert.deepEqual(data.address, { street: 'Rua Nova', number: '120', complement: 'Casa azul', reference: 'Perto da praça', neighborhood: 'Aldeia' })
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
