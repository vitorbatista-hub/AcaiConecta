import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/staff-auth'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== request.headers.get('host')) return NextResponse.json({ error: 'Requisição recusada.' }, { status: 403 })
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
