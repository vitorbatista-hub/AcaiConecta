import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateSupportContact } from '../lib/support-rules.ts'

test('o contato de suporte é normalizado, pode ser removido e recusa valores inválidos', () => {
  assert.deepEqual(validateSupportContact({ email: ' Ajuda@Exemplo.com ' }), { ok: true, email: 'ajuda@exemplo.com' })
  assert.deepEqual(validateSupportContact({ email: '' }), { ok: true, email: null })
  for (const raw of [null, {}, { email: 1 }, { email: 'sem-arroba' }, { email: `${'a'.repeat(250)}@x.com` }]) assert.equal(validateSupportContact(raw).ok, false)
})
