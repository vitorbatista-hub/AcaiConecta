// Leitura da sessão nas rotas e nas páginas do servidor. Só no servidor.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, homePathForRole, sameOrigin, type Role } from './auth.ts'
import { getActiveSession, type ActiveSession } from './sessions.ts'

export async function currentSession(): Promise<ActiveSession | null> {
  return getActiveSession((await cookies()).get(SESSION_COOKIE)?.value)
}

/** Exige sessão válida do papel indicado; senão leva à entrada (sem sessão) ou ao painel do próprio papel. */
export async function requireRole(role: Role): Promise<ActiveSession> {
  const session = await currentSession()
  if (!session) redirect('/entrar')
  if (session.role !== role) redirect(homePathForRole(session.role))
  return session
}

/** Sessão para rotas de API: devolve a sessão ou a resposta de erro (401 sem sessão, 403 papel errado, 403 origem externa em mutações). */
export async function apiSession(request: Request, roles: Role[], mutating = false): Promise<{ session: ActiveSession } | { error: Response }> {
  const reply = (message: string, status: number) => ({ error: Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }) })
  if (mutating && !sameOrigin(request)) return reply('Requisição recusada.', 403)
  let session: ActiveSession | null = null
  try { session = await currentSession() } catch { return reply('Serviço indisponível no momento.', 503) }
  if (!session) return reply('Não autenticado.', 401)
  if (!roles.includes(session.role)) return reply('Não autorizado.', 403)
  return { session }
}
