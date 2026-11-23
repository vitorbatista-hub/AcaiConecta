import { randomBytes } from 'node:crypto'
import { Prisma, type StatusPedido as StatusPrisma, type TipoEventoPedido } from '@prisma/client'
import { prisma } from '@/db/client'
import { aceitaPedidosAgora, type Horario } from '@/domain/disponibilidade'
import { calcularPedido, calcularPrazoAceite, type FormaPagamento, validarTroco } from '@/domain/pedido/calculo'
import { type Ator, validarTransicao, type StatusPedido } from '@/domain/pedido/estados'
import { ErroNegocio } from './erros'

export const MENSAGENS_OPERACIONAIS = [
  'O entregador chegou.',
  'Não encontramos o endereço.',
  'Seu pedido está atrasado.',
  'Precisamos confirmar uma informação do pedido.',
  'Um item ficou indisponível; aguarde contato do suporte.',
] as const

type Tx = Prisma.TransactionClient

const hhmm = (d: Date) => d.toISOString().slice(11, 16)

export function horariosDe(linhas: { diaSemana: number; horaAbertura: Date; horaFechamento: Date; ativo: boolean }[]): Horario[] {
  return linhas.map(h => ({ diaSemana: h.diaSemana, abertura: hhmm(h.horaAbertura), fechamento: hhmm(h.horaFechamento), ativo: h.ativo }))
}

function novoCodigo(): string {
  // 8 caracteres legíveis (sem 0/O/1/I) — o código é lido por telefone no suporte.
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return 'AC-' + Array.from(bytes, b => alfabeto[b % alfabeto.length]).join('')
}

export type EntradaEndereco =
  | { enderecoId: bigint }
  | { logradouro: string; numero: string; complemento?: string; pontoReferencia?: string; bairroId: bigint; salvar?: boolean }

export type EntradaPedido = {
  clienteId: bigint
  batedeiraId: bigint
  chaveIdempotencia: string
  itens: { produtoId: bigint; quantidade: number; observacao?: string }[]
  endereco: EntradaEndereco
  formaPagamento: FormaPagamento
  trocoParaCentavos?: number | null
  observacao?: string
}

const MAX_ENDERECOS = 2

async function resolverEndereco(tx: Tx, clienteId: bigint, e: EntradaEndereco) {
  if ('enderecoId' in e) {
    const salvo = await tx.enderecoCliente.findFirst({ where: { id: e.enderecoId, clienteId, ativo: true }, include: { bairro: true } })
    if (!salvo) throw new ErroNegocio('ENDERECO_INVALIDO', 'Endereço não encontrado.')
    return { id: salvo.id, logradouro: salvo.logradouro, numero: salvo.numero, complemento: salvo.complemento, pontoReferencia: salvo.pontoReferencia, bairro: salvo.bairro }
  }
  const logradouro = e.logradouro.trim()
  const numero = e.numero.trim()
  if (!logradouro || logradouro.length > 180 || !numero || numero.length > 20) {
    throw new ErroNegocio('ENDERECO_INVALIDO', 'Informe rua e número do endereço de entrega.')
  }
  const complemento = e.complemento?.trim() || null
  const pontoReferencia = e.pontoReferencia?.trim() || null
  if ((complemento?.length ?? 0) > 100 || (pontoReferencia?.length ?? 0) > 255) {
    throw new ErroNegocio('ENDERECO_INVALIDO', 'Complemento ou ponto de referência longo demais.')
  }
  const bairro = await tx.bairro.findUnique({ where: { id: e.bairroId } })
  if (!bairro) throw new ErroNegocio('BAIRRO_INVALIDO', 'Bairro não encontrado.')
  let id: bigint | null = null
  if (e.salvar) {
    const ativos = await tx.enderecoCliente.count({ where: { clienteId, ativo: true } })
    if (ativos >= MAX_ENDERECOS) throw new ErroNegocio('LIMITE_ENDERECOS', 'Você já tem 2 endereços salvos. Edite ou remova um deles.')
    const criado = await tx.enderecoCliente.create({
      data: { clienteId, logradouro, numero, complemento, pontoReferencia, bairroId: bairro.id, principal: ativos === 0 },
    })
    id = criado.id
  }
  return { id, logradouro, numero, complemento, pontoReferencia, bairro }
}

/**
 * Cria o pedido numa única transação (PRD §18.3, §19 US-02). É idempotente por
 * (cliente, chave): repetir a mesma requisição devolve o pedido já criado.
 */
export async function criarPedido(entrada: EntradaPedido, agora: Date = new Date()) {
  const chave = entrada.chaveIdempotencia.trim()
  if (chave.length < 8 || chave.length > 64) throw new ErroNegocio('CHAVE_INVALIDA', 'Requisição inválida. Recarregue a página e tente de novo.')
  const existente = () => prisma.pedido.findUnique({ where: { clienteId_chaveIdempotencia: { clienteId: entrada.clienteId, chaveIdempotencia: chave } } })
  const anterior = await existente()
  if (anterior) return { pedido: anterior, criado: false as const }

  try {
    const pedido = await prisma.$transaction(async tx => {
      const cliente = await tx.usuario.findUnique({ where: { id: entrada.clienteId } })
      if (!cliente || cliente.tipo !== 'CLIENTE' || cliente.status !== 'ATIVO') {
        throw new ErroNegocio('CONTA_INDISPONIVEL', 'Sua conta não pode enviar pedidos. Procure o suporte.')
      }
      const batedeira = await tx.batedeira.findUnique({ where: { id: entrada.batedeiraId }, include: { horarios: true } })
      if (!batedeira) throw new ErroNegocio('BATEDEIRA_INDISPONIVEL', 'Batedeira não encontrada.')
      if (!aceitaPedidosAgora({ status: batedeira.status, aberta: batedeira.aberta, entregaDisponivel: batedeira.entregaDisponivel, horarios: horariosDe(batedeira.horarios) }, agora)) {
        throw new ErroNegocio('BATEDEIRA_INDISPONIVEL', 'Esta batedeira não está recebendo pedidos de entrega agora.')
      }

      const endereco = await resolverEndereco(tx, entrada.clienteId, entrada.endereco)
      if (!endereco.bairro.ativo) throw new ErroNegocio('BAIRRO_INVALIDO', 'Este bairro ainda não está habilitado para pedidos.')
      const cobertura = await tx.batedeiraBairro.findUnique({ where: { batedeiraId_bairroId: { batedeiraId: batedeira.id, bairroId: endereco.bairro.id } } })
      if (!cobertura?.ativo) throw new ErroNegocio('FORA_DA_AREA', 'Esta batedeira não entrega no bairro informado.')

      const ids = entrada.itens.map(i => i.produtoId)
      if (new Set(ids).size !== ids.length) throw new ErroNegocio('ITEM_DUPLICADO', 'Há produtos repetidos no pedido.')
      const produtos = await tx.produto.findMany({ where: { id: { in: ids }, batedeiraId: batedeira.id } })
      const porId = new Map(produtos.map(p => [p.id, p]))
      const linhas = entrada.itens.map(item => {
        const produto = porId.get(item.produtoId)
        if (!produto || !produto.ativo || !produto.disponivel) {
          throw new ErroNegocio('PRODUTO_INDISPONIVEL', 'Um dos produtos não está mais disponível.')
        }
        const obs = item.observacao?.trim() || null
        if ((obs?.length ?? 0) > 300) throw new ErroNegocio('OBSERVACAO_LONGA', 'A observação do item deve ter no máximo 300 caracteres.')
        return { produto, quantidade: item.quantidade, observacao: obs }
      })

      const calculo = calcularPedido(
        linhas.map(l => ({ precoUnitarioCentavos: l.produto.precoCentavos, volumeUnitarioMl: l.produto.volumeMl, quantidade: l.quantidade })),
        cobertura.taxaEntregaCentavos,
      )
      const troco = validarTroco(entrada.formaPagamento, calculo.totalCentavos, entrada.trocoParaCentavos)
      const observacao = entrada.observacao?.trim() || null
      if ((observacao?.length ?? 0) > 500) throw new ErroNegocio('OBSERVACAO_LONGA', 'A observação do pedido deve ter no máximo 500 caracteres.')

      const complemento = endereco.complemento ? ` - ${endereco.complemento}` : ''
      const criado = await tx.pedido.create({
        data: {
          codigo: novoCodigo(),
          chaveIdempotencia: chave,
          clienteId: entrada.clienteId,
          batedeiraId: batedeira.id,
          enderecoClienteId: endereco.id,
          formaPagamento: entrada.formaPagamento,
          subtotalCentavos: calculo.subtotalCentavos,
          taxaEntregaCentavos: calculo.taxaEntregaCentavos,
          totalCentavos: calculo.totalCentavos,
          volumeTotalMl: calculo.volumeTotalMl,
          trocoParaCentavos: troco,
          observacao,
          estimativaMinutosMin: batedeira.estimativaMinutosMin,
          estimativaMinutosMax: batedeira.estimativaMinutosMax,
          enderecoSnapshot: `${endereco.logradouro}, ${endereco.numero}${complemento}`.slice(0, 255),
          bairroSnapshot: endereco.bairro.nome,
          referenciaSnapshot: endereco.pontoReferencia,
          criadoEm: agora,
          expiraAceiteEm: calcularPrazoAceite(agora),
          itens: {
            create: linhas.map(l => ({
              produtoId: l.produto.id,
              nomeProdutoSnapshot: l.produto.nome,
              unidadeSnapshot: l.produto.unidade,
              volumeUnitarioMlSnapshot: l.produto.volumeMl,
              precoUnitarioCentavos: l.produto.precoCentavos,
              quantidade: l.quantidade,
              subtotalCentavos: l.produto.precoCentavos * l.quantidade,
              observacao: l.observacao,
            })),
          },
        },
      })
      await tx.eventoPedido.create({
        data: { pedidoId: criado.id, usuarioId: entrada.clienteId, tipo: 'PEDIDO_CRIADO', statusNovo: 'AGUARDANDO_ACEITE', criadoEm: agora },
      })
      return criado
    })
    return { pedido, criado: true as const }
  } catch (e) {
    // Duas requisições simultâneas com a mesma chave: a restrição única do banco decide.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const vencedor = await existente()
      if (vencedor) return { pedido: vencedor, criado: false as const }
    }
    throw e
  }
}

const TIPO_EVENTO: Partial<Record<StatusPedido, TipoEventoPedido>> = { RECUSADO: 'PEDIDO_RECUSADO', CANCELADO: 'PEDIDO_CANCELADO' }

/**
 * Transição atômica (PRD §18.3): trava a linha do pedido, relê o estado atual, valida e grava
 * o novo estado e o evento juntos. Aceitar e expirar ao mesmo tempo não pode ambos vencer.
 */
export async function transicionarPedido(
  args: { pedidoId: bigint; para: StatusPedido; ator: Ator; motivo?: string | null },
  agora: Date = new Date(),
) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM pedidos WHERE id = ${args.pedidoId} FOR UPDATE`
    const pedido = await tx.pedido.findUnique({ where: { id: args.pedidoId } })
    if (!pedido) throw new ErroNegocio('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.')
    const t = validarTransicao(
      { status: pedido.status, clienteId: pedido.clienteId, batedeiraId: pedido.batedeiraId, expiraAceiteEm: pedido.expiraAceiteEm },
      args.para,
      args.ator,
      agora,
      args.motivo,
    )
    const final = ['ENTREGUE', 'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'].includes(args.para)
    const atualizado = await tx.pedido.update({
      where: { id: pedido.id },
      data: { status: args.para as StatusPrisma, aceitoEm: args.para === 'ACEITO' ? agora : undefined, finalizadoEm: final ? agora : undefined },
    })
    await tx.eventoPedido.create({
      data: {
        pedidoId: pedido.id,
        usuarioId: args.ator.tipo === 'USUARIO' ? args.ator.usuarioId : null,
        origemProcesso: args.ator.tipo === 'SISTEMA' ? args.ator.processo : null,
        tipo: TIPO_EVENTO[args.para] ?? 'STATUS_ALTERADO',
        statusAnterior: t.de as StatusPrisma,
        statusNovo: t.para as StatusPrisma,
        motivo: t.motivo,
        criadoEm: agora,
      },
    })
    return atualizado
  })
}

/** Expira os pedidos cujo prazo de 5 minutos terminou. Seguro para rodar em paralelo e repetidamente. */
export async function expirarPedidosVencidos(agora: Date = new Date()): Promise<number> {
  const vencidos = await prisma.pedido.findMany({ where: { status: 'AGUARDANDO_ACEITE', expiraAceiteEm: { lte: agora } }, select: { id: true } })
  let expirados = 0
  for (const { id } of vencidos) {
    try {
      await transicionarPedido({ pedidoId: id, para: 'EXPIRADO', ator: { tipo: 'SISTEMA', processo: 'expiracao-aceite' } }, agora)
      expirados++
    } catch (e) {
      // Outro processo (ou o operador) resolveu o pedido antes: nada a fazer.
      if (!(e instanceof Error) || e.name !== 'ErroTransicao') throw e
    }
  }
  return expirados
}

/** Mensagem operacional predefinida, sem chat livre (PRD §13.4). */
export async function registrarMensagemOperacional(
  args: { pedidoId: bigint; operador: { usuarioId: bigint; batedeiraId: bigint }; mensagem: string },
  agora: Date = new Date(),
) {
  if (!(MENSAGENS_OPERACIONAIS as readonly string[]).includes(args.mensagem)) {
    throw new ErroNegocio('MENSAGEM_INVALIDA', 'Escolha uma das mensagens disponíveis.')
  }
  const pedido = await prisma.pedido.findUnique({ where: { id: args.pedidoId } })
  if (!pedido || pedido.batedeiraId !== args.operador.batedeiraId) throw new ErroNegocio('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.')
  if (['ENTREGUE', 'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'].includes(pedido.status)) {
    throw new ErroNegocio('PEDIDO_ENCERRADO', 'Este pedido já foi encerrado.')
  }
  return prisma.eventoPedido.create({
    data: { pedidoId: pedido.id, usuarioId: args.operador.usuarioId, tipo: 'MENSAGEM_OPERACIONAL', mensagem: args.mensagem, criadoEm: agora },
  })
}
