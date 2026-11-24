// Autenticação da equipe (administrador e operadores). Roda somente no servidor: nada deste arquivo vai ao navegador.
// As contas ficam na variável de ambiente STAFF_ACCOUNTS (JSON) com hash scrypt; a sessão é um cookie httpOnly assinado.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { parseDocumento } from './documento.ts'

export type StaffRole = 'admin' | 'operador'
export type StaffAccount = { email: string; role: StaffRole; storeId?: string; name: string; hash: string }
export type StaffSession = { email: string; role: Role; storeId?: string; name: string; exp: number }

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const production = process.env.NODE_ENV === 'production'
export const SESSION_COOKIE = production ? '__Host-acai_sessao' : 'acai_sessao'

const SCRYPT = { N: 16384, r: 8, p: 1 }

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 64, SCRYPT)
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

// Compara em tempo constante e sempre gasta o custo do scrypt, mesmo com hash ausente ou malformado.
const DUMMY_HASH = hashPassword(randomBytes(8).toString('hex'))
export function verifyPassword(password: string, stored: string | undefined): boolean {
  const parts = (stored ?? '').split(':')
  const valid = parts.length === 3 && parts[0] === 'scrypt' && /^[0-9a-f]+$/.test(parts[1]) && /^[0-9a-f]+$/.test(parts[2])
  const [, saltHex, keyHex] = valid ? parts : DUMMY_HASH.split(':')
  const expected = Buffer.from(keyHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT)
  return timingSafeEqual(actual, expected) && valid
}

export function parseStaffAccounts(raw: string | undefined): StaffAccount[] {
  if (!raw?.trim()) return []
  let data: unknown
  try { data = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(data)) return []
  const accounts: StaffAccount[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const { email, role, storeId, name, hash } = item as Record<string, unknown>
    if (typeof email !== 'string' || typeof hash !== 'string' || (role !== 'admin' && role !== 'operador')) continue
    if (role === 'operador' && typeof storeId !== 'string') continue
    accounts.push({ email: email.trim().toLowerCase(), role, storeId: typeof storeId === 'string' ? storeId : undefined, name: typeof name === 'string' && name.trim() ? name.trim() : email, hash })
  }
  return accounts
}

export const findAccount = (accounts: StaffAccount[], email: string) => accounts.find(account => account.email === email.trim().toLowerCase())

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? ''
  if (secret.length < 32) throw new Error('SESSION_SECRET ausente ou com menos de 32 caracteres.')
  return secret
}

const b64 = (value: string) => Buffer.from(value).toString('base64url')
const sign = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest('base64url')

export function signSession(session: StaffSession, secret: string): string {
  const body = b64(JSON.stringify(session))
  return `${body}.${sign(body, secret)}`
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): StaffSession | null {
  if (!token) return null
  const [body, signature, extra] = token.split('.')
  if (!body || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(body, secret))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString()) as StaffSession
    if ((session.role !== 'admin' && session.role !== 'operador' && session.role !== 'cliente') || typeof session.email !== 'string' || !(session.exp > now)) return null
    return session
  } catch { return null }
}

// Limitação de tentativas por e-mail e por origem, em memória (suficiente para uma instância; use armazenamento compartilhado ao escalar).
const attempts = new Map<string, number[]>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
export function tooManyAttempts(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter(time => now - time < WINDOW_MS)
  attempts.set(key, recent)
  return recent.length >= MAX_ATTEMPTS
}
export function registerFailure(key: string, now = Date.now()) {
  attempts.set(key, [...(attempts.get(key) ?? []).filter(time => now - time < WINDOW_MS), now])
  if (attempts.size > 5000) attempts.clear()
}
export const clearFailures = (key: string) => { attempts.delete(key) }

export const homePathFor = (role: StaffRole) => (role === 'admin' ? '/admin' : '/operador')
export function safeNext(next: unknown, role: StaffRole): string {
  const home = homePathFor(role)
  return typeof next === 'string' && (next === home || next.startsWith(`${home}?`) || next.startsWith(`${home}/`)) ? next : home
}

// ---- Perfis e validação de cadastro (compartilhados pelo login e pelo cadastro) ----
export type Role = StaffRole | 'cliente'
export const homePathForRole = (role: Role) => (role === 'admin' ? '/admin' : role === 'operador' ? '/operador' : '/cliente')
export function safeNextForRole(next: unknown, role: Role): string {
  const home = homePathForRole(role)
  return typeof next === 'string' && (next === home || next.startsWith(`${home}?`) || next.startsWith(`${home}/`)) ? next : home
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '')

export type CustomerAddress = { street: string; number: string; complement: string; reference: string; neighborhood: 'Centro' }
export type Registration =
  | { tipo: 'cliente'; name: string; phone: string; email: string; password: string; address: CustomerAddress }
  | { tipo: 'batedeira'; name: string; phone: string; email: string; password: string; storeName: string; address: string; document: string; documentKind: 'CPF' | 'CNPJ' }

export function validateRegistration(raw: Record<string, unknown>): { ok: true; data: Registration } | { ok: false; error: string } {
  const tipo = raw.tipo === 'batedeira' ? 'batedeira' : raw.tipo === 'cliente' ? 'cliente' : null
  if (!tipo) return { ok: false, error: 'Escolha o tipo de cadastro.' }
  const name = clean(raw.name, 150)
  const email = clean(raw.email, 254).toLowerCase()
  const phone = clean(raw.phone, 20).replace(/\D/g, '')
  const password = typeof raw.password === 'string' ? raw.password : ''
  if (name.length < 2) return { ok: false, error: tipo === 'batedeira' ? 'Informe o nome do responsável.' : 'Informe seu nome.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Informe um e-mail válido.' }
  if (!/^\d{10,11}$/.test(phone)) return { ok: false, error: 'Informe o telefone com DDD.' }
  if (password.length < 8 || password.length > 200) return { ok: false, error: 'A senha deve ter de 8 a 200 caracteres.' }
  if (tipo === 'cliente') {
    const street = clean(raw.street, 180)
    const number = clean(raw.number, 20)
    const complement = clean(raw.complement, 100)
    const reference = clean(raw.reference, 255)
    if (street.length < 2 || !number) return { ok: false, error: 'Informe a rua e o número do seu endereço de entrega.' }
    return { ok: true, data: { tipo, name, phone, email, password, address: { street, number, complement, reference, neighborhood: 'Centro' } } }
  }
  const storeName = clean(raw.storeName, 150)
  const address = clean(raw.address, 180)
  const document = parseDocumento(typeof raw.document === 'string' ? raw.document : '')
  if (storeName.length < 2) return { ok: false, error: 'Informe o nome da batedeira.' }
  if (address.length < 5) return { ok: false, error: 'Informe o endereço da batedeira (rua e número).' }
  if (!document) return { ok: false, error: 'Informe um CPF ou CNPJ válido.' }
  return { ok: true, data: { tipo, name, phone, email, password, storeName, address, document: document.digits, documentKind: document.kind } }
}

export const sessionCookieOptions = (exp: number) => ({ httpOnly: true, secure: production, sameSite: 'lax' as const, path: '/', expires: new Date(exp) })
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).host === request.headers.get('host') } catch { return false }
}
export const clientIp = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
