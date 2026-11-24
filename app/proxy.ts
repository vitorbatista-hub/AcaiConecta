import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, sessionSecret, verifySession } from '@/lib/staff-auth'

// Cada área exige sessão assinada com o papel correspondente; sem ela, redireciona para a entrada.
const areas = [['/admin', 'admin'], ['/operador', 'operador'], ['/cliente', 'cliente']] as const

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const role = areas.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1]
  if (!role) return NextResponse.next()
  let session = null
  try { session = verifySession(request.cookies.get(SESSION_COOKIE)?.value, sessionSecret()) } catch { /* sem segredo: bloqueia */ }
  if (session?.role === role) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*', '/operador/:path*', '/cliente/:path*'] }
