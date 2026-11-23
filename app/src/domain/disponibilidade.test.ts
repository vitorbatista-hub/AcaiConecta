import { describe, expect, it } from 'vitest'
import { aceitaPedidosAgora, type BatedeiraDisponibilidade, estaAbertaAgora, type Horario, momentoLocal, proximaAbertura } from './disponibilidade'

// 2026-11-23 é uma segunda-feira. Cametá usa UTC-3: 12:00Z = 09:00 local.
const segunda9h = new Date('2026-11-23T12:00:00Z')
const h = (dia: number, ab: string, fe: string, ativo = true): Horario => ({ diaSemana: dia, abertura: ab, fechamento: fe, ativo })
const base: BatedeiraDisponibilidade = { status: 'ATIVA', aberta: true, entregaDisponivel: true, horarios: [h(1, '08:00', '18:00')] }

describe('fuso e dia da semana', () => {
  it('usa o horário de Cametá, com domingo = 0', () => {
    expect(momentoLocal(segunda9h)).toEqual({ dia: 1, minutos: 540 })
    // 02:00Z de segunda ainda é domingo à noite em Cametá (23:00 de domingo)
    expect(momentoLocal(new Date('2026-11-23T02:00:00Z'))).toEqual({ dia: 0, minutos: 1380 })
  })
})

describe('disponibilidade', () => {
  it('está aberta quando ativa, com chave ligada e dentro do horário', () => {
    expect(estaAbertaAgora(base, segunda9h)).toBe(true)
    expect(aceitaPedidosAgora(base, segunda9h)).toBe(true)
  })
  it('o fechamento manual prevalece sobre o horário regular', () => {
    expect(estaAbertaAgora({ ...base, aberta: false }, segunda9h)).toBe(false)
  })
  it('fora do horário ou sem horário regular não está aberta', () => {
    expect(estaAbertaAgora(base, new Date('2026-11-23T21:00:00Z'))).toBe(false) // 18:00 local, limite excluído
    expect(estaAbertaAgora({ ...base, horarios: [] }, segunda9h)).toBe(false)
    expect(estaAbertaAgora({ ...base, horarios: [h(1, '08:00', '18:00', false)] }, segunda9h)).toBe(false)
  })
  it('aberta e entrega são independentes', () => {
    expect(aceitaPedidosAgora({ ...base, entregaDisponivel: false }, segunda9h)).toBe(false)
    expect(estaAbertaAgora({ ...base, entregaDisponivel: false }, segunda9h)).toBe(true)
  })
  it.each(['EM_ANALISE', 'SUSPENSA', 'DESATIVADA'] as const)('status %s nunca recebe pedidos', status => {
    expect(aceitaPedidosAgora({ ...base, status }, segunda9h)).toBe(false)
  })
})

describe('próxima abertura', () => {
  it('escolhe o próximo intervalo do mesmo dia, ordenado', () => {
    const hs = [h(1, '15:00', '18:00'), h(1, '10:00', '12:00')]
    expect(proximaAbertura(hs, segunda9h)).toEqual({ diasAFrente: 0, diaSemana: 1, abertura: '10:00' })
  })
  it('passa para o dia seguinte e para a semana seguinte', () => {
    expect(proximaAbertura([h(2, '08:00', '12:00')], segunda9h)).toEqual({ diasAFrente: 1, diaSemana: 2, abertura: '08:00' })
    expect(proximaAbertura([h(1, '08:00', '12:00')], segunda9h)).toEqual({ diasAFrente: 7, diaSemana: 1, abertura: '08:00' })
  })
  it('devolve nulo sem horários ativos', () => {
    expect(proximaAbertura([h(1, '08:00', '12:00', false)], segunda9h)).toBeNull()
  })
})
