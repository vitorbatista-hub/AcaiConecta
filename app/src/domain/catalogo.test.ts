import { describe, expect, it } from 'vitest'
import { ErroProduto, unidadeDoVolume, validarProduto } from './catalogo'

describe('catálogo', () => {
  it('aceita 500 ml e 1 L e normaliza o texto', () => {
    expect(validarProduto({ nome: '  Açaí puro  ', descricao: ' ', volumeMl: 500, precoCentavos: 1800 })).toEqual({ nome: 'Açaí puro', descricao: null, volumeMl: 500, precoCentavos: 1800 })
    expect(validarProduto({ nome: 'Açaí 1 litro', volumeMl: 1000, precoCentavos: 3200 }).volumeMl).toBe(1000)
  })
  it('rejeita outros tamanhos, preço inválido e nome curto', () => {
    expect(() => validarProduto({ nome: 'Açaí', volumeMl: 750, precoCentavos: 100 })).toThrow(ErroProduto)
    expect(() => validarProduto({ nome: 'Açaí', volumeMl: 500, precoCentavos: 0 })).toThrow(ErroProduto)
    expect(() => validarProduto({ nome: 'Açaí', volumeMl: 500, precoCentavos: 10.5 })).toThrow(ErroProduto)
    expect(() => validarProduto({ nome: 'A', volumeMl: 500, precoCentavos: 100 })).toThrow(ErroProduto)
  })
  it('descreve o volume', () => {
    expect(unidadeDoVolume(500)).toBe('500 ml')
    expect(unidadeDoVolume(1000)).toBe('1 L')
  })
})
