import { NextResponse } from 'next/server'
import { saveStoreSettings } from '@/lib/catalog'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// A batedeira atualiza abertura, entrega, faixa estimada, bairros atendidos e horários. Sempre a própria, pela sessão.
export async function PUT(request: Request) {
  const auth = await apiSession(request, ['operador'], true)
  if ('error' in auth) return auth.error
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400, headers }) }
  try {
    const result = await saveStoreSettings(auth.session.userId, body)
    return result.ok ? NextResponse.json({ ok: true }, { headers }) : NextResponse.json({ error: result.error }, { status: result.status, headers })
  } catch (error) { console.error('Falha ao salvar a batedeira.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
