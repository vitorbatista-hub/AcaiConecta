import { NextResponse } from 'next/server'
import { SESSION_COOKIE, clientIp, hashPassword, homePathForRole, sameOrigin, serverSecret, sessionCookieOptions, validateRegistration } from '@/lib/auth'
import { createAccount } from '@/lib/accounts'
import { registerFailure, tooManyAttempts } from '@/lib/rate-limit'
import { createSession } from '@/lib/sessions'

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
  try { serverSecret() } catch { console.error('Cadastro indisponível: SESSION_SECRET inválido.'); return json({ error: 'Cadastro indisponível no momento.' }, 503) }

  try {
    const created = await createAccount(parsed.data, hashPassword(parsed.data.password))
    if (!created) return json({ error: 'Não foi possível cadastrar com este e-mail. Se você já tem conta, entre.' }, 409)
    const { token, expiresAt } = await createSession(created.id, created.role)
    const response = json({ role: created.role, redirect: homePathForRole(created.role) }, 201)
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt.getTime()))
    return response
  } catch (error) {
    console.error('Falha no cadastro.', error instanceof Error ? error.name : 'erro')
    return json({ error: 'Cadastro indisponível no momento.' }, 503)
  }
}
