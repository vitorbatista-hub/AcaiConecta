import { NextResponse } from 'next/server'
import { findUser } from '@/lib/accounts-store'
import { SESSION_COOKIE, SESSION_TTL_MS, clearFailures, clientIp, findAccount, parseStaffAccounts, registerFailure, safeNextForRole, sameOrigin, sessionCookieOptions, sessionSecret, signSession, tooManyAttempts, verifyPassword, type Role } from '@/lib/staff-auth'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// Login único: o perfil (cliente, batedeira ou administrador) vem da conta, não de uma escolha na tela.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Requisição recusada.' }, 403)
  let body: { email?: unknown; password?: unknown; next?: unknown }
  try { body = await request.json() } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : ''
  if (!email || !password) return json({ error: 'Informe e-mail e senha.' }, 400)

  const keys = [`e:${email}`, `i:${clientIp(request)}`]
  if (keys.some(key => tooManyAttempts(key))) return json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, 429)

  let secret: string
  try { secret = sessionSecret() } catch { console.error('Login indisponível: SESSION_SECRET inválido.'); return json({ error: 'Acesso indisponível no momento.' }, 503) }

  const fixed = findAccount(parseStaffAccounts(process.env.STAFF_ACCOUNTS), email)
  const user = fixed ? undefined : await findUser(email)
  const account = fixed
    ? { role: fixed.role as Role, storeId: fixed.storeId, name: fixed.name, hash: fixed.hash }
    : user ? { role: user.role as Role, storeId: user.store?.id, name: user.name, hash: user.hash } : undefined
  const ok = verifyPassword(password, account?.hash)
  if (!account || !ok) {
    keys.forEach(key => registerFailure(key))
    return json({ error: 'E-mail ou senha incorretos.' }, 401)
  }
  keys.forEach(clearFailures)
  const exp = Date.now() + SESSION_TTL_MS
  const token = signSession({ email, role: account.role, storeId: account.storeId, name: account.name, exp }, secret)
  const response = json({ role: account.role, redirect: safeNextForRole(body.next, account.role) })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(exp))
  return response
}
