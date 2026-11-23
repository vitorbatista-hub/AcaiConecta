import { hash } from '@node-rs/argon2'
import { prisma } from '@/db/client'

/** Segunda-feira, 09:00 em Cametá (UTC-3). */
export const AGORA = new Date('2026-11-23T12:00:00Z')

export async function criarCenario(opcoes: { aberta?: boolean; entrega?: boolean; status?: 'ATIVA' | 'SUSPENSA' } = {}) {
  const s = Math.random().toString(36).slice(2, 10)
  const bairro = await prisma.bairro.create({ data: { nome: `Centro-${s}` } })
  const foraBairro = await prisma.bairro.create({ data: { nome: `Outro-${s}` } })
  const senhaHash = await hash('senha-de-teste-123')
  const cliente = await prisma.usuario.create({ data: { nome: 'Cliente', email: `c-${s}@teste.local`, telefone: '91999990000', senhaHash, tipo: 'CLIENTE' } })
  const operador = await prisma.usuario.create({ data: { nome: 'Operador', email: `o-${s}@teste.local`, senhaHash, tipo: 'OPERADOR' } })
  const operador2 = await prisma.usuario.create({ data: { nome: 'Operador 2', email: `o2-${s}@teste.local`, senhaHash, tipo: 'OPERADOR' } })
  const admin = await prisma.usuario.create({ data: { nome: 'Admin', email: `a-${s}@teste.local`, senhaHash, tipo: 'ADMINISTRADOR' } })
  const mk = (responsavelId: bigint, nome: string) =>
    prisma.batedeira.create({
      data: {
        responsavelId, nome, endereco: 'Rua A, 1', bairroId: bairro.id,
        status: opcoes.status ?? 'ATIVA', aberta: opcoes.aberta ?? true, entregaDisponivel: opcoes.entrega ?? true,
        estimativaMinutosMin: 25, estimativaMinutosMax: 35,
        horarios: { create: [0, 1, 2, 3, 4, 5, 6].map(d => ({ diaSemana: d, horaAbertura: new Date('1970-01-01T06:00:00Z'), horaFechamento: new Date('1970-01-01T22:00:00Z') })) },
        bairros: { create: { bairroId: bairro.id, taxaEntregaCentavos: 250 } },
      },
    })
  const batedeira = await mk(operador.id, 'Batedeira A')
  const batedeira2 = await mk(operador2.id, 'Batedeira B')
  const p = (batedeiraId: bigint, nome: string, volumeMl: number, precoCentavos: number, extra: object = {}) =>
    prisma.produto.create({ data: { batedeiraId, nome, unidade: volumeMl >= 1000 ? '1 L' : '500 ml', volumeMl, precoCentavos, ...extra } })
  const meio = await p(batedeira.id, 'Açaí 500 ml', 500, 1800)
  const litro = await p(batedeira.id, 'Açaí 1 L', 1000, 3200)
  const indisponivel = await p(batedeira.id, 'Açaí especial', 500, 1200, { disponivel: false })
  const arquivado = await p(batedeira.id, 'Açaí antigo', 500, 1000, { ativo: false })
  const deOutra = await p(batedeira2.id, 'Açaí da B', 500, 1800)
  return { s, bairro, foraBairro, cliente, operador, operador2, admin, batedeira, batedeira2, meio, litro, indisponivel, arquivado, deOutra }
}

export type Cenario = Awaited<ReturnType<typeof criarCenario>>

export async function limparCenario(c: Cenario) {
  const usuarios = [c.cliente.id, c.operador.id, c.operador2.id, c.admin.id]
  const batedeiras = [c.batedeira.id, c.batedeira2.id]
  await prisma.eventoAuditoria.deleteMany({ where: { usuarioId: { in: usuarios } } })
  const pedidos = await prisma.pedido.findMany({ where: { batedeiraId: { in: batedeiras } }, select: { id: true } })
  const pedidoIds = pedidos.map(p => p.id)
  await prisma.eventoPedido.deleteMany({ where: { pedidoId: { in: pedidoIds } } })
  await prisma.itemPedido.deleteMany({ where: { pedidoId: { in: pedidoIds } } })
  await prisma.pedido.deleteMany({ where: { id: { in: pedidoIds } } })
  await prisma.enderecoCliente.deleteMany({ where: { clienteId: c.cliente.id } })
  await prisma.produto.deleteMany({ where: { batedeiraId: { in: batedeiras } } })
  await prisma.batedeiraBairro.deleteMany({ where: { batedeiraId: { in: batedeiras } } })
  await prisma.horarioFuncionamento.deleteMany({ where: { batedeiraId: { in: batedeiras } } })
  await prisma.batedeira.deleteMany({ where: { id: { in: batedeiras } } })
  await prisma.sessao.deleteMany({ where: { usuarioId: { in: usuarios } } })
  await prisma.tentativaLogin.deleteMany({ where: { email: { endsWith: `${c.s}@teste.local` } } })
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } })
  await prisma.bairro.deleteMany({ where: { id: { in: [c.bairro.id, c.foraBairro.id] } } })
}
