import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateEmailChange, validatePasswordChange, validatePersonal, validateStoreProfile } from '../lib/profile-rules.ts'
import { emptyCustomerSession, sessionPatchFromProfile } from '../lib/customer-session.ts'

test('dados pessoais: telefone obrigatório, exceto para o administrador', () => {
  assert.deepEqual(validatePersonal({ name: '  Ana  Souza ', phone: '(91) 98888-0000' }, 'cliente').data, { name: 'Ana Souza', phone: '91988880000' })
  assert.equal(validatePersonal({ name: 'Ana', phone: '' }, 'cliente').ok, false)
  assert.equal(validatePersonal({ name: 'Ana', phone: '' }, 'operador').ok, false)
  assert.equal(validatePersonal({ name: 'Adm', phone: '' }, 'admin').ok, true)
  assert.equal(validatePersonal({ name: 'Adm', phone: 'abc' }, 'admin').ok, false)
  assert.equal(validatePersonal({ name: 'A', phone: '91988880000' }, 'cliente').ok, false)
})

test('e-mail e senha exigem a senha atual', () => {
  assert.equal(validateEmailChange({ email: 'NOVO@Exemplo.com', currentPassword: 'x' }).data.email, 'novo@exemplo.com')
  assert.equal(validateEmailChange({ email: 'novo@exemplo.com' }).ok, false)
  assert.equal(validateEmailChange({ email: 'invalido', currentPassword: 'x' }).ok, false)
  assert.equal(validatePasswordChange({ currentPassword: 'senha-antiga', newPassword: 'senha-nova-1' }).ok, true)
  assert.equal(validatePasswordChange({ newPassword: 'senha-nova-1' }).ok, false)
  assert.equal(validatePasswordChange({ currentPassword: 'senha-antiga', newPassword: 'curta' }).ok, false)
  assert.equal(validatePasswordChange({ currentPassword: 'senha-igual', newPassword: 'senha-igual' }).ok, false)
})

test('cadastro da batedeira: bairro da lista oficial e documento ignorado', () => {
  const ok = { name: 'Açaí do João', description: '', phone: '', address: 'Rua das Flores, 42', neighborhood: 'Aldeia', reference: '', document: '123' }
  const parsed = validateStoreProfile(ok)
  assert.equal(parsed.ok, true)
  assert.equal('document' in parsed.data, false)
  assert.equal(validateStoreProfile({ ...ok, neighborhood: 'Outro' }).ok, false)
  assert.equal(validateStoreProfile({ ...ok, phone: '123' }).ok, false)
  assert.equal(validateStoreProfile({ ...ok, name: '' }).ok, false)
})

test('sessão do cliente usa os endereços do servidor sem apagar o endereço em preenchimento', () => {
  const address = { id: '1', primary: true, street: 'Rua Nova', number: '1', neighborhood: 'Aldeia', complement: '', reference: '' }
  const profile = { name: 'Ana', email: 'ana@exemplo.com', addresses: [address] }
  const patch = sessionPatchFromProfile(profile, emptyCustomerSession())
  assert.deepEqual(patch.addresses, [address])
  assert.equal(patch.address.street, 'Rua Nova')
  const typing = { ...emptyCustomerSession(), address: { street: 'Outra', number: '2', neighborhood: 'Aldeia' } }
  assert.equal(sessionPatchFromProfile(profile, typing).address, undefined)
})
