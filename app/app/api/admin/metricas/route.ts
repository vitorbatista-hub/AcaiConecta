import { NextResponse } from 'next/server'
import { apiSession } from '@/lib/session-server'
import { adminMetrics } from '@/lib/metrics'
import { expireDueOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// Métricas do piloto, calculadas no servidor sobre todos os pedidos (PRD §5). Só o administrador.
export async function GET(request: Request) {
  const auth = await apiSession(request, ['admin'])
  if ('error' in auth) return auth.error
  try { await expireDueOrders(); return NextResponse.json(await adminMetrics(), { headers }) }
  catch (error) { console.error('Falha ao calcular as métricas.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
