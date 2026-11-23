import { describe, expect, it } from 'vitest'
import { calcularPedido, calcularPrazoAceite, ErroPedido, prazoEncerrado, segundosRestantes, validarTroco } from './calculo'

const item = (preco: number, volume: number, quantidade: number) => ({ precoUnitarioCentavos: preco, volumeUnitarioMl: volume, quantidade })

describe('calcularPedido', () => {
  it('soma subtotal, taxa e volume exatamente', () => {
    const r = calcularPedido([item(1800, 500, 2)], 250)
    expect(r).toEqual({ subtotalCentavos: 3600, taxaEntregaCentavos: 250, totalCentavos: 3850, volumeTotalMl: 1000 })
  })
  it('exige 1 litro pelo volume, não pelo valor', () => {
    expect(() => calcularPedido([item(999999, 500, 1)], 0)).toThrowError(/Faltam 500 ml/)
    expect(calcularPedido([item(1, 500, 2)], 0).volumeTotalMl).toBe(1000)
  })
  it('combina 500 ml e 1 L', () => {
    expect(calcularPedido([item(1800, 500, 1), item(3200, 1000, 1)], 0).volumeTotalMl).toBe(1500)
  })
  it('aceita taxa zero (entrega gratuita)', () => {
    expect(calcularPedido([item(3200, 1000, 1)], 0).totalCentavos).toBe(3200)
  })
  it.each([
    ['sem itens', [] as ReturnType<typeof item>[], 0, 'SEM_ITENS'],
    ['quantidade zero', [item(100, 1000, 0)], 0, 'QUANTIDADE_INVALIDA'],
    ['quantidade fracionada', [item(100, 1000, 1.5)], 0, 'QUANTIDADE_INVALIDA'],
    ['quantidade acima do limite', [item(100, 1000, 65536)], 0, 'QUANTIDADE_INVALIDA'],
    ['preço zero', [item(0, 1000, 1)], 0, 'VALOR_INVALIDO'],
    ['preço negativo', [item(-5, 1000, 1)], 0, 'VALOR_INVALIDO'],
    ['taxa negativa', [item(100, 1000, 1)], -1, 'VALOR_INVALIDO'],
    ['preço fracionado', [item(10.5, 1000, 1)], 0, 'VALOR_INVALIDO'],
  ])('rejeita %s', (_nome, itens, taxa, codigo) => {
    try {
      calcularPedido(itens, taxa)
      throw new Error('deveria falhar')
    } catch (e) {
      expect(e).toBeInstanceOf(ErroPedido)
      expect((e as ErroPedido).codigo).toBe(codigo)
    }
  })
})

describe('validarTroco', () => {
  it('só aceita troco em dinheiro e a partir do total', () => {
    expect(validarTroco('DINHEIRO', 3850, 5000)).toBe(5000)
    expect(validarTroco('DINHEIRO', 3850, 3850)).toBe(3850)
    expect(validarTroco('DINHEIRO', 3850, null)).toBeNull()
    expect(() => validarTroco('DINHEIRO', 3850, 3849)).toThrow(ErroPedido)
    expect(() => validarTroco('PIX_NA_ENTREGA', 3850, 5000)).toThrow(ErroPedido)
  })
})

describe('prazo de aceite', () => {
  const criado = new Date('2026-11-23T15:00:00Z')
  it('dura exatamente 5 minutos e encerra no limite', () => {
    const exp = calcularPrazoAceite(criado)
    expect(exp.toISOString()).toBe('2026-11-23T15:05:00.000Z')
    expect(prazoEncerrado(exp, new Date('2026-11-23T15:04:59.999Z'))).toBe(false)
    expect(prazoEncerrado(exp, exp)).toBe(true)
    expect(segundosRestantes(exp, new Date('2026-11-23T15:04:00Z'))).toBe(60)
    expect(segundosRestantes(exp, new Date('2026-11-23T16:00:00Z'))).toBe(0)
  })
})
