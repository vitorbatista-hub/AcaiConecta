import type { Horario } from './disponibilidade'

/** Validação das configurações da batedeira (PRD §8.2, §10.2, §10.3). */
export class ErroConfiguracao extends Error {
  override readonly name = 'ErroConfiguracao'
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/
const minutos = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))

export function validarHorarioDia(h: Horario): Horario {
  if (!Number.isInteger(h.diaSemana) || h.diaSemana < 0 || h.diaSemana > 6) throw new ErroConfiguracao('Dia da semana inválido.')
  if (!HHMM.test(h.abertura) || !HHMM.test(h.fechamento)) throw new ErroConfiguracao('Informe os horários no formato HH:MM.')
  if (minutos(h.abertura) >= minutos(h.fechamento)) {
    throw new ErroConfiguracao('O horário de fechamento deve ser depois do de abertura, no mesmo dia.')
  }
  return h
}

export function validarEstimativa(min: number, max: number): { min: number; max: number } {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 240 || min > max) {
    throw new ErroConfiguracao('A estimativa deve ter mínimo e máximo entre 1 e 240 minutos, com o mínimo não maior que o máximo.')
  }
  return { min, max }
}

export function validarTelefone(texto: string): string | null {
  const digitos = texto.replace(/\D/g, '')
  if (!digitos) return null
  if (!/^\d{10,11}$/.test(digitos)) throw new ErroConfiguracao('Informe o telefone com DDD.')
  return digitos
}
