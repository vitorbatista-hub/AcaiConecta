import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, safeNextForRole, verifyPassword } from '../lib/auth.ts'
import { registerFailure, tooManyAttempts } from '../lib/rate-limit.ts'


test('senha: hash com sal, verificação correta e recusa de senha errada ou hash inválido', () => {
  const hash = hashPassword('uma-senha-longa-123')
  assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/)
  assert.notEqual(hash, hashPassword('uma-senha-longa-123'))
  assert.equal(verifyPassword('uma-senha-longa-123', hash), true)
  assert.equal(verifyPassword('outra-senha', hash), false)
  assert.equal(verifyPassword('qualquer', undefined), false)
  assert.equal(verifyPassword('qualquer', 'texto-solto'), false)
})

test('limitação em memória (cadastro e redefinição) bloqueia após cinco falhas e libera depois da janela', () => {
  const key = `teste-${Math.random()}`
  const t0 = 1_000_000
  for (let i = 0; i < 5; i++) { assert.equal(tooManyAttempts(key, t0 + i), false); registerFailure(key, t0 + i) }
  assert.equal(tooManyAttempts(key, t0 + 10), true)
  assert.equal(tooManyAttempts(key, t0 + 16 * 60_000), false)
})

test('destino após o login fica restrito à área do próprio papel', () => {
  assert.equal(safeNextForRole('/admin?view=pedidos', 'admin'), '/admin?view=pedidos')
  assert.equal(safeNextForRole('/operador', 'admin'), '/admin')
  assert.equal(safeNextForRole('//evil.com', 'operador'), '/operador')
  assert.equal(safeNextForRole('https://evil.com', 'admin'), '/admin')
  assert.equal(safeNextForRole(undefined, 'operador'), '/operador')
})
