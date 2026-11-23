import { expurgarAutenticacao } from './auth'
import { expirarPedidosVencidos } from './pedidos'

/** Tarefas periódicas do processo (backlog 4.3 e 7.3). Rodam dentro do servidor Node persistente (ADR-002/003). */
export type Tarefa = { nome: string; intervaloMs: number; executar: () => Promise<unknown> }

export type Agendador = { parar: () => void }

/**
 * Executa cada tarefa no seu intervalo, sem sobreposição (uma execução lenta não empilha outras) e sem derrubar
 * o processo em caso de erro. Seguro com várias instâncias: as tarefas são idempotentes e usam bloqueio de linha.
 */
export function criarAgendador(tarefas: readonly Tarefa[], aoFalhar: (nome: string, erro: unknown) => void = () => {}): Agendador {
  const timers = tarefas.map(t => {
    let rodando = false
    const ciclo = async () => {
      if (rodando) return
      rodando = true
      try {
        await t.executar()
      } catch (e) {
        aoFalhar(t.nome, e)
      } finally {
        rodando = false
      }
    }
    void ciclo()
    const timer = setInterval(() => void ciclo(), t.intervaloMs)
    timer.unref?.()
    return timer
  })
  return { parar: () => timers.forEach(clearInterval) }
}

export const INTERVALO_EXPIRACAO_MS = 10_000
export const INTERVALO_EXPURGO_MS = 60 * 60_000

const global = globalThis as unknown as { agendadorAcai?: Agendador }

/** Inicia uma única vez por processo (o modo de desenvolvimento recarrega módulos). */
export function iniciarAgendador(): Agendador | null {
  if (process.env.AGENDADOR_DESLIGADO === '1') return null
  global.agendadorAcai ??= criarAgendador(
    [
      { nome: 'expiracao-de-pedidos', intervaloMs: INTERVALO_EXPIRACAO_MS, executar: () => expirarPedidosVencidos() },
      { nome: 'expurgo-de-autenticacao', intervaloMs: INTERVALO_EXPURGO_MS, executar: () => expurgarAutenticacao() },
    ],
    // Só o nome da tarefa e o tipo do erro: nunca o conteúdo, que pode conter dados de pedidos ou credenciais.
    (nome, erro) => console.error(`[agendador] falha em ${nome}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`),
  )
  return global.agendadorAcai
}
