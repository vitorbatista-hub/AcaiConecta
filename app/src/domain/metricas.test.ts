import { expect, it } from 'vitest'
import { calcularMetricas, type PedidoMetrica } from './metricas'

const t0 = new Date('2026-11-23T12:00:00Z')
const min = (n: number) => new Date(t0.getTime() + n * 60_000)
let id = 0n
const p = (status: PedidoMetrica['status'], extra: Partial<PedidoMetrica> = {}): PedidoMetrica => ({
  id: ++id, clienteId: 1n, status, criadoEm: t0, aceitoEm: null, finalizadoEm: null, ...extra,
})

it('calcula taxas sobre os pedidos que chegaram à batedeira', () => {
  const entregue = p('ENTREGUE', { aceitoEm: min(2), finalizadoEm: min(40), clienteId: 1n })
  const cancAposAceite = p('CANCELADO', { aceitoEm: min(3), clienteId: 2n })
  const recusado = p('RECUSADO', { clienteId: 3n })
  const expirado = p('EXPIRADO', { clienteId: 3n })
  const clienteCancelou = p('CANCELADO', { clienteId: 4n }) // sem aceite: não chegou a ser decisão da batedeira
  const m = calcularMetricas({
    pedidos: [entregue, cancAposAceite, recusado, expirado, clienteCancelou],
    respostas: [
      { pedidoId: entregue.id, respondidoEm: min(2) },
      { pedidoId: cancAposAceite.id, respondidoEm: min(3) },
      { pedidoId: recusado.id, respondidoEm: min(6) }, // fora do prazo (caso hipotético)
    ],
    motivos: [{ status: 'RECUSADO', motivo: 'Outro: texto livre' }, { status: 'RECUSADO', motivo: 'Outro: outro texto' }, { status: 'CANCELADO', motivo: null }],
    batedeirasAtivas: 2,
    agora: min(60),
  })
  expect(m.pedidos).toBe(5)
  expect(m.chegaramABatedeira).toBe(4)
  expect(m.respondidosEm5Min).toBe(0.5)
  expect(m.taxaAceite).toBe(0.5)
  expect(m.taxaConclusao).toBe(0.5)
  expect(m.cancelamentoAposAceite).toBe(0.5)
  expect(m.taxaExpirados).toBe(0.25)
  expect(m.tempoMedioRespostaSegundos).toBe(Math.round(((2 + 3 + 6) * 60) / 3))
  expect(m.clientesAtivos).toBe(4)
  expect(m.clientesRecorrentes).toBe(1)
  expect(m.entreguesPorBatedeiraAtivaNaSemana).toBe(0.5)
  expect(m.motivos[0]).toEqual({ status: 'RECUSADO', motivo: 'Outro', quantidade: 2 })
  expect(m.motivos.some(x => x.motivo === 'Sem motivo registrado')).toBe(true)
})

it('sem dados, as razões são nulas e não NaN', () => {
  const m = calcularMetricas({ pedidos: [], respostas: [], motivos: [], batedeirasAtivas: 0, agora: t0 })
  expect(m.taxaAceite).toBeNull()
  expect(m.entreguesPorBatedeiraAtivaNaSemana).toBeNull()
})
