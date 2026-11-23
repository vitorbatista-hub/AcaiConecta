import { prisma } from '@/db/client'
import { unidadeDoVolume, validarProduto } from '@/domain/catalogo'
import { validarEstimativa, validarHorarioDia, validarTelefone } from '@/domain/configuracao'
import { inicioDoDiaLocal } from '@/domain/dia'
import type { Horario } from '@/domain/disponibilidade'
import { ESTADOS_FINAIS, type StatusPedido } from '@/domain/pedido/estados'
import { ErroNegocio } from './erros'
import { horariosDe, transicionarPedido } from './pedidos'

/** Todas as funções recebem o `batedeiraId` da sessão do operador, nunca de um campo de formulário. */
const SEM_VENDA: StatusPedido[] = ['RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA']
const FINAIS = [...ESTADOS_FINAIS]

export async function filaDoOperador(batedeiraId: bigint, agora: Date = new Date()) {
  const desde = inicioDoDiaLocal(agora)
  const include = {
    itens: { orderBy: { id: 'asc' as const } },
    cliente: { select: { nome: true, telefone: true } },
    eventos: { where: { tipo: 'MENSAGEM_OPERACIONAL' as const }, orderBy: { id: 'desc' as const }, take: 3 },
  }
  const [ativos, encerradosHoje] = await Promise.all([
    // Fila por ordem de criação: o mais antigo primeiro (PRD §12.6).
    prisma.pedido.findMany({ where: { batedeiraId, status: { notIn: FINAIS } }, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }], include }),
    prisma.pedido.findMany({ where: { batedeiraId, status: { in: FINAIS }, criadoEm: { gte: desde } }, orderBy: { finalizadoEm: 'desc' }, take: 30, include }),
  ])
  return { ativos, encerradosHoje }
}

/** Faturamento do dia conforme a DEC-043: pedidos criados hoje, sem os que terminaram sem venda. */
export async function resumoDoDia(batedeiraId: bigint, agora: Date = new Date()) {
  const desde = inicioDoDiaLocal(agora)
  const hoje = { batedeiraId, criadoEm: { gte: desde } }
  const [fat, aceitos, entregues] = await Promise.all([
    prisma.pedido.aggregate({ _sum: { totalCentavos: true }, where: { ...hoje, status: { notIn: SEM_VENDA } } }),
    prisma.pedido.count({ where: { ...hoje, aceitoEm: { not: null } } }),
    prisma.pedido.count({ where: { ...hoje, status: 'ENTREGUE' } }),
  ])
  return { faturamentoCentavos: fat._sum.totalCentavos ?? 0, aceitos, entregues }
}

export async function transicionarPedidoDoOperador(
  args: { usuarioId: bigint; batedeiraId: bigint; codigo: string; para: StatusPedido; motivo?: string | null },
  agora: Date = new Date(),
) {
  const pedido = await prisma.pedido.findFirst({ where: { codigo: args.codigo, batedeiraId: args.batedeiraId }, select: { id: true } })
  if (!pedido) throw new ErroNegocio('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.')
  return transicionarPedido(
    { pedidoId: pedido.id, para: args.para, motivo: args.motivo, ator: { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: args.usuarioId, batedeiraId: args.batedeiraId } },
    agora,
  )
}

export async function configuracaoDaBatedeira(batedeiraId: bigint) {
  const b = await prisma.batedeira.findUniqueOrThrow({ where: { id: batedeiraId }, include: { horarios: true, bairros: true } })
  const habilitados = await prisma.bairro.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } })
  const cobertura = new Map(b.bairros.map(x => [x.bairroId, x]))
  return {
    batedeira: b,
    horarios: horariosDe(b.horarios),
    bairros: habilitados.map(x => ({ id: x.id, nome: x.nome, atende: cobertura.get(x.id)?.ativo ?? false, taxaCentavos: cobertura.get(x.id)?.taxaEntregaCentavos ?? 0 })),
  }
}

export const salvarDisponibilidade = (batedeiraId: bigint, d: { aberta?: boolean; entregaDisponivel?: boolean }) =>
  prisma.batedeira.update({ where: { id: batedeiraId }, data: { aberta: d.aberta, entregaDisponivel: d.entregaDisponivel } })

export async function salvarPerfilOperacional(batedeiraId: bigint, d: { descricao: string; telefone: string; estimativaMin: number; estimativaMax: number }) {
  const descricao = d.descricao.trim() || null
  if ((descricao?.length ?? 0) > 500) throw new ErroNegocio('DESCRICAO_LONGA', 'A descrição deve ter no máximo 500 caracteres.')
  const { min, max } = validarEstimativa(d.estimativaMin, d.estimativaMax)
  await prisma.batedeira.update({
    where: { id: batedeiraId },
    data: { descricao, telefoneOperacional: validarTelefone(d.telefone), estimativaMinutosMin: min, estimativaMinutosMax: max },
  })
}

/** O operador só escolhe entre bairros habilitados pelo administrador (PRD §8.3, DEC-019). */
export async function salvarBairros(batedeiraId: bigint, itens: { bairroId: bigint; atende: boolean; taxaCentavos: number }[]) {
  const habilitados = new Set((await prisma.bairro.findMany({ where: { ativo: true }, select: { id: true } })).map(b => b.id))
  await prisma.$transaction(async tx => {
    for (const i of itens) {
      if (!habilitados.has(i.bairroId)) throw new ErroNegocio('BAIRRO_INVALIDO', 'Este bairro não está habilitado para pedidos.')
      if (!Number.isSafeInteger(i.taxaCentavos) || i.taxaCentavos < 0 || i.taxaCentavos > 4_000_000_000) {
        throw new ErroNegocio('TAXA_INVALIDA', 'Taxa de entrega inválida.')
      }
      await tx.batedeiraBairro.upsert({
        where: { batedeiraId_bairroId: { batedeiraId, bairroId: i.bairroId } },
        create: { batedeiraId, bairroId: i.bairroId, ativo: i.atende, taxaEntregaCentavos: i.taxaCentavos },
        update: { ativo: i.atende, taxaEntregaCentavos: i.taxaCentavos },
      })
    }
  })
}

const hora = (s: string) => new Date(`1970-01-01T${s}:00Z`)

/** Um intervalo por dia na interface; salvar substitui os horários regulares da batedeira. */
export async function salvarHorarios(batedeiraId: bigint, dias: Horario[]) {
  const validos = dias.map(validarHorarioDia)
  await prisma.$transaction([
    prisma.horarioFuncionamento.deleteMany({ where: { batedeiraId } }),
    prisma.horarioFuncionamento.createMany({
      data: validos.map(h => ({ batedeiraId, diaSemana: h.diaSemana, horaAbertura: hora(h.abertura), horaFechamento: hora(h.fechamento), ativo: h.ativo })),
    }),
  ])
}

export const produtosDaBatedeira = (batedeiraId: bigint) =>
  prisma.produto.findMany({ where: { batedeiraId, ativo: true }, orderBy: [{ volumeMl: 'asc' }, { nome: 'asc' }] })

export async function salvarProduto(batedeiraId: bigint, d: { id?: bigint; nome: string; descricao: string; volumeMl: number; precoCentavos: number }) {
  const p = validarProduto(d)
  const dados = { nome: p.nome, descricao: p.descricao, volumeMl: p.volumeMl, unidade: unidadeDoVolume(p.volumeMl), precoCentavos: p.precoCentavos }
  if (d.id === undefined) return prisma.produto.create({ data: { ...dados, batedeiraId } })
  const r = await prisma.produto.updateMany({ where: { id: d.id, batedeiraId, ativo: true }, data: dados })
  if (r.count === 0) throw new ErroNegocio('PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.')
}

/** Arquivar (`ativo = false`) preserva o produto para o histórico dos pedidos já feitos. */
export async function alterarProduto(batedeiraId: bigint, id: bigint, d: { disponivel?: boolean; exibirQuandoIndisponivel?: boolean; ativo?: boolean }) {
  const r = await prisma.produto.updateMany({ where: { id, batedeiraId, ativo: true }, data: d })
  if (r.count === 0) throw new ErroNegocio('PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.')
}
