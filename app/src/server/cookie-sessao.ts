import { cookies } from 'next/headers'

/** Prefixo __Host- só em produção: exige HTTPS, Path=/ e nenhum Domain. Em dev (http) o navegador o rejeitaria. */
const PRODUCAO = process.env.NODE_ENV === 'production'
export const NOME_COOKIE_SESSAO = PRODUCAO ? '__Host-acai_sessao' : 'acai_sessao'

export async function gravarCookieSessao(token: string, expiraEm: Date) {
  const jar = await cookies()
  jar.set(NOME_COOKIE_SESSAO, token, { httpOnly: true, secure: PRODUCAO, sameSite: 'lax', path: '/', expires: expiraEm })
}

export async function lerCookieSessao(): Promise<string> {
  return (await cookies()).get(NOME_COOKIE_SESSAO)?.value ?? ''
}

export async function apagarCookieSessao() {
  ;(await cookies()).delete(NOME_COOKIE_SESSAO)
}
