import { prisma } from '@/db/client'
import { estaAbertaAgora, proximaAbertura } from '@/domain/disponibilidade'
import { horariosDe } from './pedidos'

export type FiltroBatedeiras = { busca?: string; bairroId?: bigint }

/** Batedeiras ativas, com estado de abertura calculado no momento da consulta (PRD §10.1–10.2). */
export async function listarBatedeiras(filtro: FiltroBatedeiras, agora: Date = new Date()) {
  const busca = filtro.busca?.trim().slice(0, 100)
  const linhas = await prisma.batedeira.findMany({
    where: {
      status: 'ATIVA',
      ...(busca ? { nome: { contains: busca } } : {}),
      bairros: { some: { ativo: true, bairro: { ativo: true }, ...(filtro.bairroId ? { bairroId: filtro.bairroId } : {}) } },
    },
    include: { horarios: true, bairros: { where: { ativo: true, bairro: { ativo: true } }, include: { bairro: true } } },
  })
  return linhas
    .map(b => {
      const horarios = horariosDe(b.horarios)
      const disp = { status: b.status, aberta: b.aberta, entregaDisponivel: b.entregaDisponivel, horarios }
      const aberta = estaAbertaAgora(disp, agora)
      const taxas = b.bairros.map(x => x.taxaEntregaCentavos)
      return {
        id: b.id,
        nome: b.nome,
        descricao: b.descricao,
        imagemUrl: b.imagemUrl,
        estimativaMin: b.estimativaMinutosMin,
        estimativaMax: b.estimativaMinutosMax,
        aberta,
        entregaDisponivel: b.entregaDisponivel,
        proximaAbertura: aberta ? null : proximaAbertura(horarios, agora),
        bairros: b.bairros.map(x => x.bairro.nome),
        taxaMinimaCentavos: taxas.length ? Math.min(...taxas) : null,
      }
    })
    .sort((a, b) => Number(b.aberta && b.entregaDisponivel) - Number(a.aberta && a.entregaDisponivel) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

export const bairrosHabilitados = () => prisma.bairro.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } })

export async function perfilBatedeira(id: bigint, agora: Date = new Date()) {
  const b = await prisma.batedeira.findFirst({
    where: { id, status: 'ATIVA' },
    include: {
      horarios: true,
      bairros: { where: { ativo: true, bairro: { ativo: true } }, include: { bairro: true }, orderBy: { bairro: { nome: 'asc' } } },
      produtos: { where: { ativo: true, OR: [{ disponivel: true }, { exibirQuandoIndisponivel: true }] }, orderBy: [{ volumeMl: 'asc' }, { nome: 'asc' }] },
    },
  })
  if (!b) return null
  const horarios = horariosDe(b.horarios)
  const aberta = estaAbertaAgora({ status: b.status, aberta: b.aberta, entregaDisponivel: b.entregaDisponivel, horarios }, agora)
  return { ...b, horariosTexto: horarios, aberta, aceitaPedidos: aberta && b.entregaDisponivel, proximaAbertura: aberta ? null : proximaAbertura(horarios, agora) }
}

export const enderecosDoCliente = (clienteId: bigint) =>
  prisma.enderecoCliente.findMany({ where: { clienteId, ativo: true }, include: { bairro: true }, orderBy: [{ principal: 'desc' }, { id: 'asc' }] })

export const pedidosDoCliente = (clienteId: bigint) =>
  prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { criadoEm: 'desc' },
    take: 50,
    include: { batedeira: { select: { nome: true } } },
  })

/** O filtro por cliente está na própria consulta: pedido alheio é "não encontrado". */
export const pedidoDoCliente = (clienteId: bigint, codigo: string) =>
  prisma.pedido.findFirst({
    where: { clienteId, codigo },
    include: {
      batedeira: { select: { nome: true, telefoneOperacional: true } },
      itens: { orderBy: { id: 'asc' } },
      eventos: { orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] },
    },
  })
