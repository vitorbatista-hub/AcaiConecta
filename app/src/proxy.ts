import { NextResponse, type NextRequest } from 'next/server'
import { papelExigido } from '@/domain/auth/rotas'

/**
 * Verificação otimista: sem cookie de sessão, áreas protegidas redirecionam ao login.
 * Não valida o token (o proxy não acessa o banco); a autorização real é feita no servidor por `exigirPapelNaPagina` e `exigirPapel`.
 */
export function proxy(req: NextRequest) {
  const caminho = req.nextUrl.pathname
  if (!papelExigido(caminho)) return NextResponse.next()
  const nome = process.env.NODE_ENV === 'production' ? '__Host-acai_sessao' : 'acai_sessao'
  if (req.cookies.get(nome)?.value) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = `?proximo=${encodeURIComponent(caminho + req.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*', '/operador/:path*', '/conta/:path*', '/pedidos/:path*'] }
