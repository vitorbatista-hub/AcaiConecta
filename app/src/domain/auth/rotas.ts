import type { PapelSessao } from './sessao'

/** Áreas protegidas e o papel exigido por cada uma (PRD §16.1). */
const AREAS: ReadonlyArray<{ prefixo: string; papel: PapelSessao }> = [
  { prefixo: '/admin', papel: 'ADMINISTRADOR' },
  { prefixo: '/operador', papel: 'OPERADOR' },
  { prefixo: '/conta', papel: 'CLIENTE' },
  { prefixo: '/pedidos', papel: 'CLIENTE' },
]

export function papelExigido(caminho: string): PapelSessao | null {
  const area = AREAS.find(a => caminho === a.prefixo || caminho.startsWith(`${a.prefixo}/`))
  return area?.papel ?? null
}

export function paginaInicialDoPapel(papel: PapelSessao): string {
  return papel === 'ADMINISTRADOR' ? '/admin' : papel === 'OPERADOR' ? '/operador' : '/conta'
}

/** Aceita só caminho interno do próprio site; qualquer outra coisa vira o destino padrão (evita redirecionamento aberto). */
export function destinoSeguro(proximo: string | null | undefined, papel: PapelSessao): string {
  const padrao = paginaInicialDoPapel(papel)
  if (!proximo || !proximo.startsWith('/') || proximo.startsWith('//') || proximo.includes('\\') || /[\u0000-\u001f]/.test(proximo)) {
    return padrao
  }
  const exigido = papelExigido(proximo.split(/[?#]/)[0] ?? '')
  return exigido && exigido !== papel ? padrao : proximo
}
