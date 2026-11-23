import { describe, expect, it } from 'vitest'
import { type EventoSSE, fluxoSSE, formatarEventoSSE } from './sse'

const ev = (id: number): EventoSSE => ({ id: BigInt(id), nome: 'pedido', dados: { codigo: 'AC-AAAAAAAA', tipo: 'STATUS_ALTERADO', status: 'ACEITO' } })

/** Relógio e espera simulados: cada `dormir` avança o relógio, então o teste é instantâneo e determinístico. */
function ambiente(extra: Partial<Parameters<typeof fluxoSSE>[0]> = {}) {
  let t = 0
  const ctrl = new AbortController()
  return {
    ctrl,
    base: {
      ultimoId: 0n,
      consultar: async () => [] as EventoSSE[],
      sessaoValida: async () => true,
      sinal: ctrl.signal,
      agora: () => t,
      dormir: async (ms: number) => { t += ms },
      ...extra,
    },
  }
}
async function coletar(g: AsyncGenerator<string>, max = 50) {
  const saida: string[] = []
  for await (const parte of g) { saida.push(parte); if (saida.length >= max) break }
  return saida
}

describe('formatarEventoSSE', () => {
  it('inclui id, nome e dados em JSON', () => {
    expect(formatarEventoSSE(ev(7))).toBe('id: 7\nevent: pedido\ndata: {"codigo":"AC-AAAAAAAA","tipo":"STATUS_ALTERADO","status":"ACEITO"}\n\n')
  })
})

describe('fluxoSSE', () => {
  it('envia só eventos novos, em ordem, sem repetir e sem pular', async () => {
    const todos = [ev(1), ev(2), ev(3)]
    const { base } = ambiente({ ultimoId: 1n, consultar: async apos => todos.filter(e => e.id > apos), duracaoMaxMs: 3000 })
    const saida = (await coletar(fluxoSSE(base))).filter(s => s.startsWith('id:'))
    expect(saida.map(s => s.split('\n')[0])).toEqual(['id: 2', 'id: 3'])
  })

  it('ignora evento que o consultar devolva com id já enviado', async () => {
    const { base } = ambiente({ consultar: async () => [ev(5), ev(5), ev(4)], duracaoMaxMs: 2000 })
    const ids = (await coletar(fluxoSSE(base))).filter(s => s.startsWith('id:')).map(s => s.split('\n')[0])
    expect(ids).toEqual(['id: 5'])
  })

  it('envia keep-alive quando não há eventos', async () => {
    const { base } = ambiente({ heartbeatMs: 3000, intervaloMs: 1000, duracaoMaxMs: 10_000 })
    expect((await coletar(fluxoSSE(base))).some(s => s.startsWith(': keep-alive'))).toBe(true)
  })

  it('fecha a conexão quando a sessão deixa de ser válida', async () => {
    const { base } = ambiente({ sessaoValida: async () => false, revalidarMs: 2000, intervaloMs: 1000, duracaoMaxMs: 60_000 })
    const saida = await coletar(fluxoSSE(base))
    expect(saida.at(-1)).toContain('event: encerrado')
  })

  it('renova a conexão depois da duração máxima, para o navegador retomar pelo Last-Event-ID', async () => {
    const { base } = ambiente({ duracaoMaxMs: 5000, intervaloMs: 1000 })
    expect((await coletar(fluxoSSE(base))).at(-1)).toContain('event: renovar')
  })

  it('encerra sem erro quando a consulta falha', async () => {
    const { base } = ambiente({ consultar: async () => { throw new Error('banco fora') } })
    const saida = await coletar(fluxoSSE(base))
    expect(saida).toEqual(['retry: 3000\n\n'])
  })

  it('para quando o cliente desconecta', async () => {
    const { ctrl, base } = ambiente({ dormir: async () => { ctrl.abort() } })
    const saida = await coletar(fluxoSSE(base))
    expect(saida).toEqual(['retry: 3000\n\n'])
  })
})
