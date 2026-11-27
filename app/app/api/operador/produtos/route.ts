import { NextResponse } from 'next/server'
import { saveProductFor } from '@/lib/catalog'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// Cria ou edita um produto da própria batedeira (sem id numérico = novo). Produtos são arquivados, nunca apagados.
export async function POST(request: Request) {
  const auth = await apiSession(request, ['operador'], true)
  if ('error' in auth) return auth.error
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400, headers }) }
  try {
    const result = await saveProductFor(auth.session.userId, body)
    return result.ok ? NextResponse.json({ product: result.product }, { headers }) : NextResponse.json({ error: result.error }, { status: result.status, headers })
  } catch (error) { console.error('Falha ao salvar o produto.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
