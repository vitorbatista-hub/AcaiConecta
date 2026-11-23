import type { UsuarioAutenticado } from './auth'
import { ErroNegocio } from './erros'
import { exigirPapel, exigirPapelNaPagina } from './guardas'

export type Operador = UsuarioAutenticado & { batedeiraId: bigint }

const comBatedeira = (u: UsuarioAutenticado): Operador => {
  if (u.batedeiraId === null) throw new ErroNegocio('SEM_BATEDEIRA', 'Sua conta ainda não está vinculada a uma batedeira. Procure o administrador.')
  return { ...u, batedeiraId: u.batedeiraId }
}

/** Mutações do operador: papel e batedeira vêm da sessão, nunca do formulário. */
export async function exigirOperador(): Promise<Operador> {
  return comBatedeira(await exigirPapel('OPERADOR'))
}

/** Páginas: devolve `null` quando o operador não tem batedeira vinculada, para a página explicar. */
export async function operadorDaPagina(caminho: string): Promise<Operador | null> {
  const u = await exigirPapelNaPagina('OPERADOR', caminho)
  return u.batedeiraId === null ? null : { ...u, batedeiraId: u.batedeiraId }
}
