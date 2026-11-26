import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, clientIp } from '@/lib/auth'
import { changeEmail, changePassword, getProfile, updatePersonal, updateStoreProfile, type ProfileResult } from '@/lib/profile'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const unavailable = (error: unknown) => { console.error('Falha na área da conta.', error instanceof Error ? error.name : 'erro'); return json({ error: 'Serviço indisponível no momento.' }, 503) }

// Dados da própria conta, para os três perfis (DEC-063). O usuário vem sempre da sessão.
export async function GET(request: Request) {
  const auth = await apiSession(request, ['cliente', 'operador', 'admin'])
  if ('error' in auth) return auth.error
  try {
    const profile = await getProfile(auth.session.userId)
    return profile ? json({ profile }) : json({ error: 'Não autenticado.' }, 401)
  } catch (error) { return unavailable(error) }
}

export async function PATCH(request: Request) {
  const auth = await apiSession(request, ['cliente', 'operador', 'admin'], true)
  if ('error' in auth) return auth.error
  let body: Record<string, unknown>
  try { body = (await request.json()) ?? {} } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const { userId, role } = auth.session
  try {
    let result: ProfileResult
    if (body.section === 'pessoais') result = await updatePersonal(userId, role, body)
    else if (body.section === 'email') result = await changeEmail(userId, body, clientIp(request))
    else if (body.section === 'senha') result = await changePassword(userId, body, clientIp(request), (await cookies()).get(SESSION_COOKIE)?.value ?? '')
    else if (body.section === 'batedeira' && role === 'operador') result = await updateStoreProfile(userId, body)
    else return json({ error: 'Requisição inválida.' }, 400)
    return result.ok ? json({ ok: true }) : json({ error: result.error }, result.status)
  } catch (error) { return unavailable(error) }
}
