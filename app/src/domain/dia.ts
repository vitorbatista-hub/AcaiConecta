import { momentoLocal } from './disponibilidade'

/** Início (00:00) do dia local de Cametá que contém `agora`. O Pará não adota horário de verão. */
export function inicioDoDiaLocal(agora: Date): Date {
  const { minutos } = momentoLocal(agora)
  return new Date(agora.getTime() - minutos * 60_000 - agora.getUTCSeconds() * 1000 - agora.getUTCMilliseconds())
}
