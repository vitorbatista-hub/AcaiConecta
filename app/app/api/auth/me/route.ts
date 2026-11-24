import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findUser } from '@/lib/accounts-store'
import { SESSION_COOKIE, sessionSecret, verifySession } from '@/lib/staff-auth'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  let session = null
  try { session = verifySession((await cookies()).get(SESSION_COOKIE)?.value, sessionSecret()) } catch { /* sem segredo configurado: ninguém autenticado */ }
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401, headers })
  const { email, role, storeId, name } = session
  const user = role === 'admin' ? undefined : await findUser(email)
  // O documento (CPF/CNPJ) nunca sai por aqui: só o administrador o consulta, em /api/admin/batedeiras.
  const store = user?.store ? { id: user.store.id, name: user.store.name, address: user.store.address } : undefined
  return NextResponse.json({ email, role, storeId, name, phone: user?.phone, address: user?.address, store }, { headers })
}
