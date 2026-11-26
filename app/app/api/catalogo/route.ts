import { NextResponse } from 'next/server'
import { catalogFor } from '@/lib/catalog'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// Catálogo conforme o papel: cliente vê batedeiras ativas; operador, a própria; administrador, todas (documento mascarado).
export async function GET(request: Request) {
  const auth = await apiSession(request, ['cliente', 'operador', 'admin'])
  if ('error' in auth) return auth.error
  try { return NextResponse.json(await catalogFor(auth.session.userId, auth.session.role), { headers }) }
  catch (error) { console.error('Falha ao ler o catálogo.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
