import { VOLUMES_PERMITIDOS_ML } from './pedido/calculo'

export type ProdutoEntrada = {
  nome: string
  descricao?: string | null
  volumeMl: number
  precoCentavos: number
}

export class ErroProduto extends Error {
  override readonly name = 'ErroProduto'
}

/** Regras do catálogo (PRD §11, DEC-042): volume de 500 ml ou 1 L, preço em centavos positivo. */
export function validarProduto(p: ProdutoEntrada): ProdutoEntrada {
  const nome = p.nome.trim()
  if (nome.length < 2 || nome.length > 150) throw new ErroProduto('O nome deve ter entre 2 e 150 caracteres.')
  const descricao = p.descricao?.trim() || null
  if (descricao && descricao.length > 500) throw new ErroProduto('A descrição deve ter no máximo 500 caracteres.')
  if (!(VOLUMES_PERMITIDOS_ML as readonly number[]).includes(p.volumeMl)) {
    throw new ErroProduto('O tamanho deve ser de 500 ml ou 1 litro.')
  }
  if (!Number.isSafeInteger(p.precoCentavos) || p.precoCentavos <= 0) {
    throw new ErroProduto('O preço deve ser maior que zero.')
  }
  return { nome, descricao, volumeMl: p.volumeMl, precoCentavos: p.precoCentavos }
}

export function unidadeDoVolume(volumeMl: number): string {
  return volumeMl >= 1000 ? `${volumeMl / 1000} L` : `${volumeMl} ml`
}
