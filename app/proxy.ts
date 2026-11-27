import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

// Checagem otimista: sem o cookie de sessão, as áreas privadas redirecionam para a entrada.
// A validação real (sessão no banco, papel e conta ativa) é feita no servidor em cada layout de área e em cada rota de API.
const areas = ['/admin', '/operador', '/cliente']

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (!areas.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return NextResponse.next()
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*', '/operador/:path*', '/cliente/:path*'] }
