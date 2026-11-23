/**
 * Valores monetários trafegam sempre como inteiros em centavos (PRD §11.1).
 * Ponto flutuante nunca é usado em cálculos; a conversão a partir de texto é por regex.
 */
export type Centavos = number

const REAIS = /^(\d{1,7})(?:[.,](\d{1,2}))?$/

/** Converte "18", "18,5" ou "18,50" em centavos. Rejeita negativos, notação exponencial e lixo. */
export function parseReais(texto: string): Centavos {
  const limpo = texto.trim().replace(/^R\$\s*/, '')
  const m = REAIS.exec(limpo)
  if (!m) throw new ErroDinheiro('Informe um valor válido em reais, por exemplo 18,50.')
  const reais = Number(m[1])
  const frac = (m[2] ?? '').padEnd(2, '0')
  const centavos = reais * 100 + Number(frac)
  if (!Number.isSafeInteger(centavos)) throw new ErroDinheiro('Valor fora do limite permitido.')
  return centavos
}

export function formatarReais(centavos: Centavos): string {
  if (!Number.isInteger(centavos) || centavos < 0) throw new ErroDinheiro('Valor em centavos inválido.')
  const reais = Math.floor(centavos / 100)
  const resto = String(centavos % 100).padStart(2, '0')
  return `R$ ${reais.toLocaleString('pt-BR')},${resto}`
}

export class ErroDinheiro extends Error {
  override readonly name = 'ErroDinheiro'
}
