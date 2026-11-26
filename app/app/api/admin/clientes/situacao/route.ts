import { NextResponse } from 'next/server'
import { setCustomerStatus } from '@/lib/customers'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// O administrador bloqueia ou reativa a conta de um cliente, com motivo e trilha de auditoria.
export async function POST(request: Request) {
  const auth = await apiSession(request, ['admin'], true)
  if ('error' in auth) return auth.error
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400, headers }) }
  try {
    const result = await setCustomerStatus(auth.session.userId, body)
    return result.ok ? NextResponse.json({ ok: true }, { headers }) : NextResponse.json({ error: result.error }, { status: result.status, headers })
  } catch (error) { console.error('Falha ao alterar a conta.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
