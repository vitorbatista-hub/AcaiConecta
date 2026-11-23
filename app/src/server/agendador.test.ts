import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarAgendador } from './agendador'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('criarAgendador', () => {
  it('executa na partida e a cada intervalo, e para quando pedido', async () => {
    const executar = vi.fn(async () => {})
    const ag = criarAgendador([{ nome: 't', intervaloMs: 1000, executar }])
    await vi.advanceTimersByTimeAsync(3000)
    expect(executar).toHaveBeenCalledTimes(4)
    ag.parar()
    await vi.advanceTimersByTimeAsync(5000)
    expect(executar).toHaveBeenCalledTimes(4)
  })

  it('não sobrepõe execuções lentas', async () => {
    let simultaneas = 0, maxima = 0
    const executar = async () => { simultaneas++; maxima = Math.max(maxima, simultaneas); await new Promise(r => setTimeout(r, 2500)); simultaneas-- }
    const ag = criarAgendador([{ nome: 'lenta', intervaloMs: 1000, executar }])
    await vi.advanceTimersByTimeAsync(10_000)
    ag.parar()
    expect(maxima).toBe(1)
  })

  it('um erro é reportado e a tarefa continua sendo agendada', async () => {
    const falhas: string[] = []
    let chamadas = 0
    const ag = criarAgendador([{ nome: 'quebra', intervaloMs: 1000, executar: async () => { chamadas++; throw new Error('x') } }], nome => falhas.push(nome))
    await vi.advanceTimersByTimeAsync(2000)
    ag.parar()
    expect(chamadas).toBe(3)
    expect(falhas).toEqual(['quebra', 'quebra', 'quebra'])
  })
})
