/**
 * Fluxo de Server-Sent Events (ADR-002). Funções puras e geradores, sem dependência de Next ou do banco,
 * para poderem ser testadas com relógio e consulta simulados.
 */
export type EventoSSE = { id: bigint; nome: string; dados: Record<string, string> }

export function formatarEventoSSE(e: EventoSSE): string {
  // `id` permite ao navegador retomar de onde parou (cabeçalho Last-Event-ID).
  return `id: ${e.id}\nevent: ${e.nome}\ndata: ${JSON.stringify(e.dados)}\n\n`
}

export type OpcoesFluxo = {
  ultimoId: bigint
  consultar: (apos: bigint) => Promise<EventoSSE[]>
  sessaoValida: () => Promise<boolean>
  sinal: AbortSignal
  intervaloMs?: number
  heartbeatMs?: number
  revalidarMs?: number
  duracaoMaxMs?: number
  agora?: () => number
  dormir?: (ms: number, sinal: AbortSignal) => Promise<void>
}

export const dormirAteAbortar = (ms: number, sinal: AbortSignal) =>
  new Promise<void>(resolve => {
    if (sinal.aborted) return resolve()
    const t = setTimeout(() => { sinal.removeEventListener('abort', fim); resolve() }, ms)
    const fim = () => { clearTimeout(t); resolve() }
    sinal.addEventListener('abort', fim, { once: true })
  })

/**
 * Gera os pedaços do fluxo: novos eventos a cada ciclo, comentário de keep-alive, revalidação da sessão
 * (conta bloqueada ou sessão encerrada fecha a conexão) e renovação periódica da conexão.
 * O navegador reconecta sozinho e informa o último `id`, então nada se perde nem se duplica.
 */
export async function* fluxoSSE(o: OpcoesFluxo): AsyncGenerator<string> {
  const intervalo = o.intervaloMs ?? 1500
  const heartbeat = o.heartbeatMs ?? 15_000
  const revalidar = o.revalidarMs ?? 30_000
  const duracaoMax = o.duracaoMaxMs ?? 15 * 60_000
  const agora = o.agora ?? Date.now
  const dormir = o.dormir ?? dormirAteAbortar
  const inicio = agora()
  let ultimo = o.ultimoId
  let ultimaSaida = inicio
  let ultimaValidacao = inicio

  yield 'retry: 3000\n\n'
  while (!o.sinal.aborted) {
    let novos: EventoSSE[]
    try {
      novos = await o.consultar(ultimo)
    } catch {
      // Falha transitória do banco: encerra; o navegador reconecta e retoma pelo Last-Event-ID.
      return
    }
    for (const e of novos) {
      if (e.id <= ultimo) continue
      yield formatarEventoSSE(e)
      ultimo = e.id
      ultimaSaida = agora()
    }
    const t = agora()
    if (t - ultimaValidacao >= revalidar) {
      ultimaValidacao = t
      let valida = false
      try {
        valida = await o.sessaoValida()
      } catch {
        return
      }
      if (!valida) {
        yield 'event: encerrado\ndata: {}\n\n'
        return
      }
    }
    if (t - inicio >= duracaoMax) {
      yield 'event: renovar\ndata: {}\n\n'
      return
    }
    if (t - ultimaSaida >= heartbeat) {
      yield ': keep-alive\n\n'
      ultimaSaida = t
    }
    await dormir(intervalo, o.sinal)
  }
}

export function respostaDoFluxo(iter: AsyncGenerator<string>): Response {
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iter.next()
      if (done) controller.close()
      else controller.enqueue(enc.encode(value))
    },
    cancel() {
      void iter.return(undefined)
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
