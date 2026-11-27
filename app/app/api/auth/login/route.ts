import { NextResponse } from 'next/server'
import { SESSION_COOKIE, clientIp, safeNextForRole, sameOrigin, serverSecret, sessionCookieOptions, verifyPassword } from '@/lib/auth'
import { findUserByEmail } from '@/lib/accounts'
import { isThrottled, recordAttempt } from '@/lib/login-throttle'
import { createSession, purgeAuthDataSometimes, roleFromTipo } from '@/lib/sessions'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// Login único (ADR-001): o perfil vem da conta. A resposta é a mesma para e-mail inexistente, senha errada e conta bloqueada.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Requisição recusada.' }, 403)
  let body: { email?: unknown; password?: unknown; next?: unknown }
  try { body = await request.json() } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : ''
  if (!email || !password) return json({ error: 'Informe e-mail e senha.' }, 400)

  try { serverSecret() } catch { console.error('Login indisponível: SESSION_SECRET inválido.'); return json({ error: 'Acesso indisponível no momento.' }, 503) }
  const ip = clientIp(request)
  try {
    if (await isThrottled(email, ip)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, 429)
    const user = await findUserByEmail(email)
    const passwordOk = verifyPassword(password, user?.senha_hash) // sempre paga o custo do hash, mesmo sem conta
    if (!user || !passwordOk || user.status !== 'ATIVO') {
      await recordAttempt(email, ip, false)
      return json({ error: 'E-mail ou senha incorretos.' }, 401)
    }
    await recordAttempt(email, ip, true)
    const role = roleFromTipo(user.tipo)
    const { token, expiresAt } = await createSession(user.id, role)
    purgeAuthDataSometimes()
    const response = json({ role, redirect: safeNextForRole(body.next, role) })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt.getTime()))
    return response
  } catch (error) {
    console.error('Falha no login.', error instanceof Error ? error.name : 'erro')
    return json({ error: 'Acesso indisponível no momento.' }, 503)
  }
}
