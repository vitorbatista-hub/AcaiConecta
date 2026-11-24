import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listOperators } from '@/lib/accounts-store'
import { maskDocumento } from '@/lib/documento'
import { SESSION_COOKIE, sessionSecret, verifySession } from '@/lib/staff-auth'

export const dynamic = 'force-dynamic'

// Cadastros de batedeira feitos pelo site, para o administrador analisar.
export async function GET() {
  let session = null
  try { session = verifySession((await cookies()).get(SESSION_COOKIE)?.value, sessionSecret()) } catch { /* sem segredo: recusa */ }
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Não autorizado.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  const operators = (await listOperators()).filter(user => user.store).map(user => ({ operator: user.name, phone: user.phone, createdAt: user.createdAt, store: { id: user.store!.id, name: user.store!.name, address: user.store!.address, documentKind: user.store!.documentKind, documentMasked: maskDocumento(user.store!.document) } }))
  return NextResponse.json({ batedeiras: operators }, { headers: { 'Cache-Control': 'no-store' } })
}
