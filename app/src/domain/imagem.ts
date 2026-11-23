/** Regras das fotos de batedeira e de produto (DEC-013, DEC-038, arquitetura §8). */
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024
export const PIXELS_MAXIMOS = 25_000_000
export const FORMATOS_PERMITIDOS = ['jpeg', 'png', 'webp'] as const
export const LADO_PRINCIPAL_PX = 1280
export const LADO_MINIATURA_PX = 480

export const PREFIXO_URL_LOCAL = '/api/imagens/'
/** Nome gerado pelo servidor: 32 hex aleatórios, e `-m` para a miniatura. Nunca vem do usuário. */
export const NOME_ARQUIVO = /^[a-f0-9]{32}(-m)?\.webp$/

export class ErroImagem extends Error {
  override readonly name = 'ErroImagem'
}

/** Identificador-base de uma URL servida por este sistema, ou null para qualquer outra (ex.: URL externa). */
export function idDaUrlLocal(url: string | null | undefined): string | null {
  if (!url?.startsWith(PREFIXO_URL_LOCAL)) return null
  const nome = url.slice(PREFIXO_URL_LOCAL.length)
  return /^[a-f0-9]{32}\.webp$/.test(nome) ? nome.slice(0, 32) : null
}

export const urlPrincipal = (id: string) => `${PREFIXO_URL_LOCAL}${id}.webp`

/** Miniatura da mesma foto, quando ela é nossa; URLs de outra origem ficam como estão. */
export function urlMiniatura(url: string): string {
  const id = idDaUrlLocal(url)
  return id ? `${PREFIXO_URL_LOCAL}${id}-m.webp` : url
}

export function validarTamanho(bytes: number): void {
  if (bytes <= 0) throw new ErroImagem('Escolha um arquivo de imagem.')
  if (bytes > TAMANHO_MAXIMO_BYTES) throw new ErroImagem(`A imagem deve ter no máximo ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB.`)
}
