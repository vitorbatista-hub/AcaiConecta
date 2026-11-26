import { NextResponse } from 'next/server'
import { listCustomers } from '@/lib/customers'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

// Lista as contas de cliente para o administrador.
export async function GET(request: Request) {
  const auth = await apiSession(request, ['admin'])
  if ('error' in auth) return auth.error
  try { return NextResponse.json({ customers: await listCustomers() }, { headers }) }
  catch (error) { console.error('Falha ao listar clientes.', error instanceof Error ? error.name : 'erro'); return NextResponse.json({ error: 'Serviço indisponível no momento.' }, { status: 503, headers }) }
}
