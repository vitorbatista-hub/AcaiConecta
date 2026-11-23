import type { Centavos } from '../dinheiro'

/** Regras de montagem do pedido (PRD §10.3, §11, §12.1, DEC-030, DEC-042). */
export const VOLUME_MINIMO_ML = 1000
export const VOLUMES_PERMITIDOS_ML = [500, 1000] as const
export const QUANTIDADE_MAXIMA = 65535
export const PRAZO_ACEITE_MS = 5 * 60 * 1000

export type ItemEntrada = {
  precoUnitarioCentavos: Centavos
  volumeUnitarioMl: number
  quantidade: number
}

export type FormaPagamento = 'DINHEIRO' | 'PIX_NA_ENTREGA'

export type CalculoPedido = {
  subtotalCentavos: Centavos
  taxaEntregaCentavos: Centavos
  totalCentavos: Centavos
  volumeTotalMl: number
}

export class ErroPedido extends Error {
  override readonly name = 'ErroPedido'
  constructor(
    readonly codigo:
      | 'SEM_ITENS'
      | 'QUANTIDADE_INVALIDA'
      | 'VALOR_INVALIDO'
      | 'VOLUME_MINIMO'
      | 'TROCO_INVALIDO',
    mensagem: string,
  ) {
    super(mensagem)
  }
}

const inteiroNaoNegativo = (n: number) => Number.isSafeInteger(n) && n >= 0

export function calcularPedido(itens: readonly ItemEntrada[], taxaEntregaCentavos: Centavos): CalculoPedido {
  if (itens.length === 0) throw new ErroPedido('SEM_ITENS', 'Adicione ao menos um produto ao pedido.')
  if (!inteiroNaoNegativo(taxaEntregaCentavos)) throw new ErroPedido('VALOR_INVALIDO', 'Taxa de entrega inválida.')
  let subtotal = 0
  let volume = 0
  for (const item of itens) {
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > QUANTIDADE_MAXIMA) {
      throw new ErroPedido('QUANTIDADE_INVALIDA', `A quantidade deve estar entre 1 e ${QUANTIDADE_MAXIMA}.`)
    }
    if (!inteiroNaoNegativo(item.precoUnitarioCentavos) || item.precoUnitarioCentavos <= 0) {
      throw new ErroPedido('VALOR_INVALIDO', 'Preço de produto inválido.')
    }
    if (!inteiroNaoNegativo(item.volumeUnitarioMl) || item.volumeUnitarioMl <= 0) {
      throw new ErroPedido('VALOR_INVALIDO', 'Volume de produto inválido.')
    }
    subtotal += item.precoUnitarioCentavos * item.quantidade
    volume += item.volumeUnitarioMl * item.quantidade
  }
  if (!Number.isSafeInteger(subtotal)) throw new ErroPedido('VALOR_INVALIDO', 'Valor do pedido fora do limite permitido.')
  // A validação é pelo volume dos itens, nunca pelo valor em reais (PRD §10.3).
  if (volume < VOLUME_MINIMO_ML) {
    throw new ErroPedido('VOLUME_MINIMO', `Faltam ${VOLUME_MINIMO_ML - volume} ml para o mínimo de 1 litro.`)
  }
  return {
    subtotalCentavos: subtotal,
    taxaEntregaCentavos,
    totalCentavos: subtotal + taxaEntregaCentavos,
    volumeTotalMl: volume,
  }
}

/** Troco só existe em dinheiro e precisa cobrir o total (schema: ck_pedidos_troco). */
export function validarTroco(
  forma: FormaPagamento,
  totalCentavos: Centavos,
  trocoParaCentavos: Centavos | null | undefined,
): Centavos | null {
  if (trocoParaCentavos === null || trocoParaCentavos === undefined) return null
  if (forma !== 'DINHEIRO') throw new ErroPedido('TROCO_INVALIDO', 'Troco só se aplica a pagamento em dinheiro.')
  if (!inteiroNaoNegativo(trocoParaCentavos) || trocoParaCentavos < totalCentavos) {
    throw new ErroPedido('TROCO_INVALIDO', 'O valor para troco deve ser igual ou maior que o total do pedido.')
  }
  return trocoParaCentavos
}

export function calcularPrazoAceite(criadoEm: Date): Date {
  return new Date(criadoEm.getTime() + PRAZO_ACEITE_MS)
}

export function prazoEncerrado(expiraAceiteEm: Date, agora: Date): boolean {
  return agora.getTime() >= expiraAceiteEm.getTime()
}

export function segundosRestantes(expiraAceiteEm: Date, agora: Date): number {
  return Math.max(0, Math.ceil((expiraAceiteEm.getTime() - agora.getTime()) / 1000))
}
