import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findAccount, hashPassword, parseStaffAccounts, registerFailure, safeNext, signSession, tooManyAttempts, verifyPassword, verifySession } from '../lib/staff-auth.ts'

const secret = 'segredo-de-teste-com-mais-de-32-caracteres!'
const session = { email: 'a@b.co', role: 'admin', name: 'Admin', exp: Date.now() + 60_000 }

test('senha: hash com sal, verificação correta e recusa de senha errada ou hash inválido', () => {
  const hash = hashPassword('uma-senha-longa-123')
  assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/)
  assert.notEqual(hash, hashPassword('uma-senha-longa-123'))
  assert.equal(verifyPassword('uma-senha-longa-123', hash), true)
  assert.equal(verifyPassword('outra-senha', hash), false)
  assert.equal(verifyPassword('qualquer', undefined), false)
  assert.equal(verifyPassword('qualquer', 'texto-solto'), false)
})

test('sessão assinada: aceita o original e recusa adulteração, expiração e outro segredo', () => {
  const token = signSession(session, secret)
  assert.equal(verifySession(token, secret)?.email, 'a@b.co')
  const [body, sig] = token.split('.')
  const forged = Buffer.from(JSON.stringify({ ...session, role: 'operador', email: 'x@y.co' })).toString('base64url')
  assert.equal(verifySession(`${forged}.${sig}`, secret), null)
  assert.equal(verifySession(`${body}.${sig}x`, secret), null)
  assert.equal(verifySession(token, 'outro-segredo-de-teste-com-mais-de-32-caracteres'), null)
  assert.equal(verifySession(token, secret, session.exp + 1), null)
  assert.equal(verifySession(undefined, secret), null)
  assert.equal(verifySession('a.b.c', secret), null)
})

test('contas da equipe: ignora entradas inválidas e normaliza o e-mail', () => {
  const raw = JSON.stringify([{ email: ' Admin@X.com ', role: 'admin', hash: 'h' }, { email: 'op@x.com', role: 'operador', hash: 'h' }, { email: 'op2@x.com', role: 'operador', storeId: 'store-1', hash: 'h' }, { role: 'admin' }, 'lixo'])
  const accounts = parseStaffAccounts(raw)
  assert.deepEqual(accounts.map(a => a.email), ['admin@x.com', 'op2@x.com'])
  assert.equal(findAccount(accounts, 'ADMIN@x.com')?.role, 'admin')
  assert.deepEqual(parseStaffAccounts('{quebrado'), [])
  assert.deepEqual(parseStaffAccounts(undefined), [])
})

test('limitação de tentativas bloqueia após cinco falhas e libera depois da janela', () => {
  const key = `teste-${Math.random()}`
  const t0 = 1_000_000
  for (let i = 0; i < 5; i++) { assert.equal(tooManyAttempts(key, t0 + i), false); registerFailure(key, t0 + i) }
  assert.equal(tooManyAttempts(key, t0 + 10), true)
  assert.equal(tooManyAttempts(key, t0 + 16 * 60_000), false)
})

test('destino após o login fica restrito à área do próprio papel', () => {
  assert.equal(safeNext('/admin?view=pedidos', 'admin'), '/admin?view=pedidos')
  assert.equal(safeNext('/operador', 'admin'), '/admin')
  assert.equal(safeNext('//evil.com', 'operador'), '/operador')
  assert.equal(safeNext('https://evil.com', 'admin'), '/admin')
  assert.equal(safeNext(undefined, 'operador'), '/operador')
})
