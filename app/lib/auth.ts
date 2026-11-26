// Regras de autenticação sem acesso a banco (senha, papéis, cadastro, cookie). Roda somente no servidor.
// Contas e sessões ficam no MySQL (ADR-001, ADR-006); este arquivo não guarda estado.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { parseDocumento } from './documento.ts'
import { isOfficialNeighborhood } from './neighborhoods.ts'

const production = process.env.NODE_ENV === 'production'
export const SESSION_COOKIE = production ? '__Host-acai_sessao' : 'acai_sessao'
// ADR-001: cliente 30 dias, renovados a cada uso; equipe 12 horas, sem renovação.
export const CLIENT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const STAFF_SESSION_TTL_MS = 12 * 60 * 60 * 1000

export function serverSecret(): string {
  const secret = process.env.SESSION_SECRET ?? ''
  if (secret.length < 32) throw new Error('SESSION_SECRET ausente ou com menos de 32 caracteres.')
  return secret
}

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
export const newToken = () => randomBytes(32).toString('base64url')
/** Origem guardada só como HMAC-SHA-256 do IP (ADR-001, item 7): o IP em texto nunca vai ao banco. */
export const hashOrigin = (ip: string) => createHmac('sha256', serverSecret()).update(ip).digest('hex')

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

export type Role = 'admin' | 'operador' | 'cliente'
export const homePathForRole = (role: Role) => (role === 'admin' ? '/admin' : role === 'operador' ? '/operador' : '/cliente')
export function safeNextForRole(next: unknown, role: Role): string {
  const home = homePathForRole(role)
  return typeof next === 'string' && (next === home || next.startsWith(`${home}?`) || next.startsWith(`${home}/`)) ? next : home
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '')

export type CustomerAddress = { street: string; number: string; complement: string; reference: string; neighborhood: string }
export type Registration =
  | { tipo: 'cliente'; name: string; phone: string; email: string; password: string; address: CustomerAddress }
  | { tipo: 'batedeira'; name: string; phone: string; email: string; password: string; storeName: string; address: string; neighborhood: string; document: string; documentKind: 'CPF' | 'CNPJ' }

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
    const neighborhood = clean(raw.neighborhood, 100)
    if (street.length < 2 || !number) return { ok: false, error: 'Informe a rua e o número do seu endereço de entrega.' }
    if (!isOfficialNeighborhood(neighborhood)) return { ok: false, error: 'Escolha o bairro do endereço na lista de bairros da zona urbana de Cametá.' }
    return { ok: true, data: { tipo, name, phone, email, password, address: { street, number, complement, reference, neighborhood } } }
  }
  const storeName = clean(raw.storeName, 150)
  const address = clean(raw.address, 180)
  const document = parseDocumento(typeof raw.document === 'string' ? raw.document : '')
  if (storeName.length < 2) return { ok: false, error: 'Informe o nome da batedeira.' }
  const neighborhood = clean(raw.neighborhood, 100)
  if (address.length < 5) return { ok: false, error: 'Informe o endereço da batedeira (rua e número).' }
  if (!isOfficialNeighborhood(neighborhood)) return { ok: false, error: 'Escolha o bairro da batedeira na lista de bairros da zona urbana de Cametá.' }
  if (!document) return { ok: false, error: 'Informe um CPF ou CNPJ válido.' }
  return { ok: true, data: { tipo, name, phone, email, password, storeName, address, neighborhood, document: document.digits, documentKind: document.kind } }
}


export const sessionCookieOptions = (exp: number) => ({ httpOnly: true, secure: production, sameSite: 'lax' as const, path: '/', expires: new Date(exp) })
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).host === request.headers.get('host') } catch { return false }
}
export const clientIp = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
