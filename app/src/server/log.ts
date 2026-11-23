import { NIVEIS, redigir, type NivelLog } from '@/domain/log'

/**
 * Logs estruturados em JSON, uma linha por evento, na saída padrão (stdout) e de erro (stderr), para a plataforma
 * coletar (ADR-004). Cada linha leva o identificador da requisição quando há uma, para correlacionar um caso
 * relatado ao suporte com o pedido (campo `pedido`, o código AC-XXXXXXXX). Os campos passam por `redigir`.
 */
const ordem = (n: NivelLog) => NIVEIS.indexOf(n)

function nivelMinimo(): NivelLog | 'silent' {
  const configurado = process.env.LOG_LEVEL
  if (configurado === 'silent' || (NIVEIS as readonly string[]).includes(configurado ?? '')) return configurado as NivelLog | 'silent'
  return process.env.NODE_ENV === 'test' ? 'silent' : 'info'
}

/** Identificador da requisição atual, definido no `proxy`; indefinido fora de uma requisição (agendador, testes). */
export async function idDaRequisicao(): Promise<string | undefined> {
  try {
    const { headers } = await import('next/headers')
    return (await headers()).get('x-request-id') ?? undefined
  } catch {
    return undefined
  }
}

export async function registrar(nivel: NivelLog, evento: string, campos: Record<string, unknown> = {}): Promise<void> {
  const minimo = nivelMinimo()
  if (minimo === 'silent' || ordem(nivel) < ordem(minimo)) return
  try {
    const linha = JSON.stringify({
      ts: new Date().toISOString(),
      nivel,
      evento,
      requisicaoId: await idDaRequisicao(),
      ...(redigir(campos) as Record<string, unknown>),
    })
    ;(nivel === 'error' || nivel === 'warn' ? process.stderr : process.stdout).write(`${linha}\n`)
  } catch {
    // O log nunca pode derrubar a operação que o chamou.
  }
}

export const log = {
  debug: (evento: string, campos?: Record<string, unknown>) => registrar('debug', evento, campos),
  info: (evento: string, campos?: Record<string, unknown>) => registrar('info', evento, campos),
  warn: (evento: string, campos?: Record<string, unknown>) => registrar('warn', evento, campos),
  error: (evento: string, campos?: Record<string, unknown>) => registrar('error', evento, campos),
}
