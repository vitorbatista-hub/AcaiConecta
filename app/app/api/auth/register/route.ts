import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createUser } from '@/lib/accounts-store'
import { SESSION_COOKIE, SESSION_TTL_MS, clientIp, hashPassword, homePathForRole, parseStaffAccounts, registerFailure, sameOrigin, sessionCookieOptions, sessionSecret, signSession, tooManyAttempts, validateRegistration } from '@/lib/staff-auth'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// Cadastro público de cliente ou de batedeira. A batedeira nasce "em análise" e só recebe pedidos depois de ativada pelo administrador.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Requisição recusada.' }, 403)
  let body: Record<string, unknown>
  try { body = (await request.json()) as Record<string, unknown> } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const key = `r:${clientIp(request)}`
  if (tooManyAttempts(key)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, 429)
  registerFailure(key)

  const parsed = validateRegistration(body ?? {})
  if (!parsed.ok) return json({ error: parsed.error }, 400)
  let secret: string
  try { secret = sessionSecret() } catch { console.error('Cadastro indisponível: SESSION_SECRET inválido.'); return json({ error: 'Cadastro indisponível no momento.' }, 503) }

  const { data } = parsed
  const reserved = parseStaffAccounts(process.env.STAFF_ACCOUNTS).map(account => account.email)
  const storeId = data.tipo === 'batedeira' ? `store-${randomUUID().slice(0, 8)}` : undefined
  const user = await createUser({
    role: data.tipo === 'batedeira' ? 'operador' : 'cliente', email: data.email, name: data.name, phone: data.phone, hash: hashPassword(data.password),
    ...(data.tipo === 'cliente' ? { address: data.address } : {}),
    ...(data.tipo === 'batedeira' && storeId ? { store: { id: storeId, name: data.storeName, address: data.address, neighborhood: 'Centro' as const, document: data.document, documentKind: data.documentKind } } : {}),
  }, reserved)
  if (!user) return json({ error: 'Não foi possível cadastrar com este e-mail. Se você já tem conta, entre.' }, 409)

  const exp = Date.now() + SESSION_TTL_MS
  const token = signSession({ email: user.email, role: user.role, storeId, name: user.name, exp }, secret)
  const response = json({ role: user.role, redirect: homePathForRole(user.role) }, 201)
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(exp))
  return response
}
