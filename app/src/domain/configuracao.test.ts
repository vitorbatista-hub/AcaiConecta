import { describe, expect, it } from 'vitest'
import { ErroConfiguracao, validarEstimativa, validarHorarioDia, validarTelefone } from './configuracao'

describe('configuração da batedeira', () => {
  it('valida horário do dia', () => {
    expect(validarHorarioDia({ diaSemana: 1, abertura: '09:00', fechamento: '20:30', ativo: true }).fechamento).toBe('20:30')
    for (const ruim of [
      { diaSemana: 7, abertura: '09:00', fechamento: '10:00' },
      { diaSemana: 1, abertura: '9:00', fechamento: '10:00' },
      { diaSemana: 1, abertura: '10:00', fechamento: '10:00' },
      { diaSemana: 1, abertura: '22:00', fechamento: '02:00' },
    ]) expect(() => validarHorarioDia({ ...ruim, ativo: true })).toThrow(ErroConfiguracao)
  })
  it('valida estimativa', () => {
    expect(validarEstimativa(25, 35)).toEqual({ min: 25, max: 35 })
    expect(() => validarEstimativa(40, 30)).toThrow(ErroConfiguracao)
    expect(() => validarEstimativa(0, 30)).toThrow(ErroConfiguracao)
    expect(() => validarEstimativa(10, 241)).toThrow(ErroConfiguracao)
  })
  it('valida telefone opcional', () => {
    expect(validarTelefone('')).toBeNull()
    expect(validarTelefone('(91) 99999-0000')).toBe('91999990000')
    expect(() => validarTelefone('123')).toThrow(ErroConfiguracao)
  })
})
