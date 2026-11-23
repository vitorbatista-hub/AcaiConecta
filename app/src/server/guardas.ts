import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { PapelSessao } from '@/domain/auth/sessao'
import { usuarioDaSessao, type UsuarioAutenticado } from './auth'
import { lerCookieSessao } from './cookie-sessao'
import { ErroNegocio } from './erros'

/** Usuário da requisição atual (uma consulta por requisição). Autoridade final: o banco, não o cookie. */
export const usuarioAtual = cache(async (): Promise<UsuarioAutenticado | null> => usuarioDaSessao(await lerCookieSessao()))

/** Para páginas: sem sessão vai ao login (com retorno); papel errado vai a /entrar sem destino. */
export async function exigirPapelNaPagina(papel: PapelSessao, caminho: string): Promise<UsuarioAutenticado> {
  const usuario = await usuarioAtual()
  if (!usuario) redirect(`/entrar?proximo=${encodeURIComponent(caminho)}`)
  if (usuario.tipo !== papel) redirect('/entrar')
  return usuario
}

/** Para toda mutação (server actions): verifica o papel no servidor, sem confiar na página que a chamou. */
export async function exigirPapel(papel: PapelSessao): Promise<UsuarioAutenticado> {
  const usuario = await usuarioAtual()
  if (!usuario) throw new ErroNegocio('NAO_AUTENTICADO', 'Entre para continuar.')
  if (usuario.tipo !== papel) throw new ErroNegocio('NAO_AUTORIZADO', 'Você não tem permissão para esta ação.')
  return usuario
}
