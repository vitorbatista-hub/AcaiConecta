/** Disponibilidade da batedeira (PRD §10.1–10.2). O fuso do piloto é o de Cametá/PA. */
export const FUSO_PILOTO = 'America/Belem'

export type StatusBatedeira = 'EM_ANALISE' | 'ATIVA' | 'SUSPENSA' | 'DESATIVADA'

export type Horario = {
  diaSemana: number // 0 = domingo … 6 = sábado
  abertura: string // "HH:MM"
  fechamento: string // "HH:MM"
  ativo: boolean
}

export type BatedeiraDisponibilidade = {
  status: StatusBatedeira
  aberta: boolean // chave manual; quando falsa, prevalece sobre o horário regular
  entregaDisponivel: boolean
  horarios: readonly Horario[]
}

const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function momentoLocal(data: Date, fuso: string = FUSO_PILOTO): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)
  const get = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''
  return { dia: DIAS[get('weekday')] ?? 0, minutos: Number(get('hour')) * 60 + Number(get('minute')) }
}

function minutosDe(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

export function dentroDoHorario(horarios: readonly Horario[], agora: Date): boolean {
  const { dia, minutos } = momentoLocal(agora)
  return horarios.some(
    h => h.ativo && h.diaSemana === dia && minutos >= minutosDe(h.abertura) && minutos < minutosDe(h.fechamento),
  )
}

/** Aberta agora = ativa, chave manual ligada e dentro de um intervalo regular ativo. */
export function estaAbertaAgora(b: BatedeiraDisponibilidade, agora: Date): boolean {
  return b.status === 'ATIVA' && b.aberta && dentroDoHorario(b.horarios, agora)
}

/** Pedido só é aceito quando a batedeira está aberta agora e com entrega disponível. */
export function aceitaPedidosAgora(b: BatedeiraDisponibilidade, agora: Date): boolean {
  return estaAbertaAgora(b, agora) && b.entregaDisponivel
}

/** Próxima abertura regular (dia da semana e horário), considerando os 7 dias seguintes. */
export function proximaAbertura(
  horarios: readonly Horario[],
  agora: Date,
): { diasAFrente: number; diaSemana: number; abertura: string } | null {
  const { dia, minutos } = momentoLocal(agora)
  for (let delta = 0; delta <= 7; delta++) {
    const alvo = (dia + delta) % 7
    const candidatos = horarios
      .filter(h => h.ativo && h.diaSemana === alvo && (delta > 0 || minutosDe(h.abertura) > minutos))
      .sort((a, b) => minutosDe(a.abertura) - minutosDe(b.abertura))
    const primeiro = candidatos[0]
    if (primeiro) return { diasAFrente: delta, diaSemana: alvo, abertura: primeiro.abertura }
  }
  return null
}
