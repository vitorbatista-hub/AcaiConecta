import { prisma } from '@/db/client'
import type { EventoSSE } from './sse'

/** Escopos de visibilidade (ADR-002 §5): cada conexão só recebe eventos que o usuário pode ver. */
export type EscopoEventos =
  | { tipo: 'batedeira'; batedeiraId: bigint }
  | { tipo: 'pedido'; codigo: string; clienteId: bigint }
  | { tipo: 'admin'; codigo?: string }

const filtro = (e: EscopoEventos) =>
  e.tipo === 'batedeira'
    ? { pedido: { batedeiraId: e.batedeiraId } }
    : e.tipo === 'pedido'
      ? { pedido: { codigo: e.codigo, clienteId: e.clienteId } }
      : e.codigo
        ? { pedido: { codigo: e.codigo } }
        : {}

/** Novos eventos de `eventos_pedido` depois de `apos`, em ordem. Só código, tipo e estado: sem dados pessoais. */
export async function consultarEventos(escopo: EscopoEventos, apos: bigint, limite = 100): Promise<EventoSSE[]> {
  const linhas = await prisma.eventoPedido.findMany({
    where: { id: { gt: apos }, ...filtro(escopo) },
    orderBy: { id: 'asc' },
    take: limite,
    select: { id: true, tipo: true, statusNovo: true, pedido: { select: { codigo: true } } },
  })
  return linhas.map(l => ({ id: l.id, nome: 'pedido', dados: { codigo: l.pedido.codigo, tipo: l.tipo, status: l.statusNovo ?? '' } }))
}

/** Último evento visível no escopo. As páginas leem isto antes dos dados, para a conexão não perder nada entre os dois momentos. */
export async function ultimoEventoId(escopo: EscopoEventos): Promise<bigint> {
  const r = await prisma.eventoPedido.findFirst({ where: filtro(escopo), orderBy: { id: 'desc' }, select: { id: true } })
  return r?.id ?? 0n
}
