import { NextResponse } from 'next/server'
import { getAccountView } from '@/lib/accounts'
import { listAddresses } from '@/lib/profile'
import { currentSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  let session = null
  try { session = await currentSession() } catch { /* banco indisponível: ninguém autenticado */ }
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401, headers })
  const account = await getAccountView(session.userId)
  if (!account) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401, headers })
  // O documento (CPF/CNPJ) nunca sai por aqui: só o administrador o consulta, em /api/admin/batedeiras.
  const { email, role, name, phone, address, store } = account
  const addresses = role === 'cliente' ? await listAddresses(session.userId) : undefined
  return NextResponse.json({ email, role, storeId: store?.id, name, phone, address, addresses, store }, { headers })
}
