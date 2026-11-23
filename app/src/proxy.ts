import { NextResponse, type NextRequest } from 'next/server'
import { papelExigido } from '@/domain/auth/rotas'
import { idRequisicaoValido } from '@/domain/log'

/**
 * 1) Dá a cada requisição um identificador (x-request-id), repassado ao servidor e devolvido na resposta, para correlacionar logs.
 *    Um identificador recebido só é aceito se for simples, evitando injeção em linhas de log.
 * 2) Verificação otimista: sem cookie de sessão, áreas protegidas redirecionam ao login. Não valida o token (o proxy não acessa
 *    o banco); a autorização real é feita no servidor por `exigirPapelNaPagina` e `exigirPapel`.
 */
export function proxy(req: NextRequest) {
  const recebido = req.headers.get('x-request-id')
  const id = idRequisicaoValido(recebido) ? recebido : crypto.randomUUID()
  const cabecalhos = new Headers(req.headers)
  cabecalhos.set('x-request-id', id)

  const caminho = req.nextUrl.pathname
  let resposta: NextResponse
  if (!papelExigido(caminho)) {
    resposta = NextResponse.next({ request: { headers: cabecalhos } })
  } else {
    const nome = process.env.NODE_ENV === 'production' ? '__Host-acai_sessao' : 'acai_sessao'
    if (req.cookies.get(nome)?.value) {
      resposta = NextResponse.next({ request: { headers: cabecalhos } })
    } else {
      const url = req.nextUrl.clone()
      url.pathname = '/entrar'
      url.search = `?proximo=${encodeURIComponent(caminho + req.nextUrl.search)}`
      resposta = NextResponse.redirect(url)
    }
  }
  resposta.headers.set('x-request-id', id)
  return resposta
}

// Tudo, menos arquivos estáticos do Next e arquivos com extensão (imagens, ícones).
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'] }
