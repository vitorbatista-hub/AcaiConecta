import { PRAZO_ACEITE_MS } from './pedido/calculo'
import type { StatusPedido } from './pedido/estados'

/** Métricas do piloto (PRD §5.2–5.4). Funções puras sobre linhas já consultadas. */
export type PedidoMetrica = { id: bigint; clienteId: bigint; status: StatusPedido; criadoEm: Date; aceitoEm: Date | null; finalizadoEm: Date | null }
export type RespostaMetrica = { pedidoId: bigint; respondidoEm: Date }
export type MotivoMetrica = { status: 'RECUSADO' | 'CANCELADO'; motivo: string | null }

export type Metricas = {
  pedidos: number
  chegaramABatedeira: number
  respondidosEm5Min: number | null
  taxaAceite: number | null
  taxaConclusao: number | null
  cancelamentoAposAceite: number | null
  taxaExpirados: number | null
  tempoMedioRespostaSegundos: number | null
  clientesAtivos: number
  clientesRecorrentes: number
  entreguesPorBatedeiraAtivaNaSemana: number | null
  motivos: { status: 'RECUSADO' | 'CANCELADO'; motivo: string; quantidade: number }[]
}

const razao = (a: number, b: number) => (b === 0 ? null : a / b)

/** "Outro: texto livre" é agrupado como "Outro", para não expor texto livre na contagem. */
const agruparMotivo = (m: string | null) => (m ? (m.split(':')[0] ?? m).trim() : 'Sem motivo registrado')

export function calcularMetricas(args: {
  pedidos: readonly PedidoMetrica[]
  respostas: readonly RespostaMetrica[]
  motivos: readonly MotivoMetrica[]
  batedeirasAtivas: number
  agora: Date
}): Metricas {
  const { pedidos, respostas, agora } = args
  // Cancelado pelo cliente enquanto aguardava (sem aceite) não chegou a ser decisão da batedeira.
  const chegaram = pedidos.filter(p => !(p.status === 'CANCELADO' && p.aceitoEm === null))
  const aceitos = pedidos.filter(p => p.aceitoEm !== null)
  const porId = new Map(pedidos.map(p => [p.id, p]))
  const tempos = respostas
    .map(r => {
      const p = porId.get(r.pedidoId)
      return p ? r.respondidoEm.getTime() - p.criadoEm.getTime() : null
    })
    .filter((t): t is number => t !== null)
  const porCliente = new Map<bigint, number>()
  for (const p of pedidos) porCliente.set(p.clienteId, (porCliente.get(p.clienteId) ?? 0) + 1)
  const semanaAtras = agora.getTime() - 7 * 24 * 60 * 60 * 1000
  const entreguesSemana = pedidos.filter(p => p.status === 'ENTREGUE' && (p.finalizadoEm?.getTime() ?? 0) >= semanaAtras).length

  const contagem = new Map<string, number>()
  for (const m of args.motivos) {
    const k = `${m.status}|${agruparMotivo(m.motivo)}`
    contagem.set(k, (contagem.get(k) ?? 0) + 1)
  }
  return {
    pedidos: pedidos.length,
    chegaramABatedeira: chegaram.length,
    respondidosEm5Min: razao(tempos.filter(t => t <= PRAZO_ACEITE_MS).length, chegaram.length),
    taxaAceite: razao(aceitos.length, chegaram.length),
    taxaConclusao: razao(aceitos.filter(p => p.status === 'ENTREGUE').length, aceitos.length),
    cancelamentoAposAceite: razao(aceitos.filter(p => p.status === 'CANCELADO').length, aceitos.length),
    taxaExpirados: razao(pedidos.filter(p => p.status === 'EXPIRADO').length, chegaram.length),
    tempoMedioRespostaSegundos: tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length / 1000) : null,
    clientesAtivos: porCliente.size,
    clientesRecorrentes: [...porCliente.values()].filter(n => n >= 2).length,
    entreguesPorBatedeiraAtivaNaSemana: razao(entreguesSemana, args.batedeirasAtivas),
    motivos: [...contagem.entries()]
      .map(([k, quantidade]) => ({ status: k.split('|')[0] as 'RECUSADO' | 'CANCELADO', motivo: k.split('|')[1] ?? '', quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
  }
}
