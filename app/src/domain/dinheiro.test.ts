import { describe, expect, it } from 'vitest'
import { formatarReais, parseReais } from './dinheiro'

describe('dinheiro', () => {
  it('converte texto em centavos sem ponto flutuante', () => {
    expect(parseReais('18')).toBe(1800)
    expect(parseReais('18,5')).toBe(1850)
    expect(parseReais('18,50')).toBe(1850)
    expect(parseReais('R$ 0,10')).toBe(10)
    expect(parseReais('0.07')).toBe(7)
  })
  it('rejeita negativos, exponencial, vazio e mais de duas casas', () => {
    for (const ruim of ['-1', '1e3', '', 'abc', '1,234', '1,', '99999999', 'NaN', '1 000']) {
      expect(() => parseReais(ruim), ruim).toThrow()
    }
  })
  it('formata centavos em reais', () => {
    expect(formatarReais(5)).toBe('R$ 0,05')
    expect(formatarReais(3850)).toBe('R$ 38,50')
    expect(() => formatarReais(-1)).toThrow()
    expect(() => formatarReais(1.5)).toThrow()
  })
})
