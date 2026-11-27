import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, sameOrigin } from '@/lib/auth'
import { endSession } from '@/lib/sessions'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Requisição recusada.' }, { status: 403 })
  try { await endSession((await cookies()).get(SESSION_COOKIE)?.value) } catch { console.error('Falha ao encerrar a sessão no banco.') }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
