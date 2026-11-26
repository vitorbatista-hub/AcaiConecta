// Ajudantes das rotas de pedido: sessão, leitura do corpo e tradução de erros. Só no servidor.
import { NextResponse } from 'next/server'
import { HttpError, type Session } from './orders.ts'
import { apiSession } from './session-server.ts'

const headers = { 'Cache-Control': 'no-store' }

export async function orderRoute(request: Request, roles: Session['role'][], mutating: boolean, task: (session: Session, body: Record<string, unknown>) => Promise<unknown>) {
  const auth = await apiSession(request, roles, mutating)
  if ('error' in auth) return auth.error
  let body: Record<string, unknown> = {}
  if (mutating) { try { body = ((await request.json()) ?? {}) as Record<string, unknown> } catch { return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400, headers }) } }
  const { userId, role, name } = auth.session
  try { return NextResponse.json(await task({ userId, role, name }, body), { headers }) }
  catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status, headers })
    console.error('Falha na operação do pedido.', error instanceof Error ? error.name : 'erro')
    return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers })
  }
}
