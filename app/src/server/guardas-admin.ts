import type { UsuarioAutenticado } from './auth'
import { exigirPapel, exigirPapelNaPagina } from './guardas'

export const exigirAdmin = (): Promise<UsuarioAutenticado> => exigirPapel('ADMINISTRADOR')
export const adminDaPagina = (caminho: string): Promise<UsuarioAutenticado> => exigirPapelNaPagina('ADMINISTRADOR', caminho)
