import { hash } from '@node-rs/argon2'
import type { Prisma, StatusPedido as StatusPrisma } from '@prisma/client'
import { prisma } from '@/db/client'
import { aplicarAcaoBatedeira, type AcaoBatedeira, type RequisitosAtivacao } from '@/domain/batedeira-status'
import { validarEstimativa } from '@/domain/configuracao'
import { calcularMetricas } from '@/domain/metricas'
import { validarSenha } from '@/domain/auth/senha'
import { normalizarEmail } from '@/domain/auth/limitacao'
import { STATUS_PEDIDO, type StatusPedido } from '@/domain/pedido/estados'
import { bloquearUsuario, reativarUsuario } from './auth'
import { ErroNegocio } from './erros'
import { MENSAGENS_OPERACIONAIS, transicionarPedido } from './pedidos'

/** Toda função recebe o `adminId` da sessão e confere de novo, no banco, que ele é um administrador ativo. */
async function exigirAdminAtivo(tx: Prisma.TransactionClient, adminId: bigint) {
  const a = await tx.usuario.findUnique({ where: { id: adminId } })
  if (a?.tipo !== 'ADMINISTRADOR' || a.status !== 'ATIVO') throw new ErroNegocio('NAO_AUTORIZADO', 'Ação restrita ao administrador.')
  return a
}

const auditar = (tx: Prisma.TransactionClient, adminId: bigint, acao: string, entidadeTipo: string, entidadeId: bigint, detalhes: Prisma.InputJsonValue | undefined, agora: Date) =>
  tx.eventoAuditoria.create({ data: { usuarioId: adminId, acao, entidadeTipo, entidadeId, detalhes, criadoEm: agora } })

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Batedeiras ──────────────────────────────────────────────────────────────

export type EntradaCadastro = {
  operadorNome: string
  operadorEmail: string
  operadorTelefone: string
  senhaTemporaria: string
  nome: string
  endereco: string
  bairroId: bigint
  pontoReferencia?: string
  estimativaMin: number
  estimativaMax: number
}

/** Cadastro assistido (DEC-033): uma batedeira em análise e seu único operador responsável. Sem documentos. */
export async function cadastrarBatedeira(adminId: bigint, e: EntradaCadastro, agora: Date = new Date()) {
  const email = normalizarEmail(e.operadorEmail)
  const operadorNome = e.operadorNome.trim()
  const nome = e.nome.trim()
  const endereco = e.endereco.trim()
  const telefone = e.operadorTelefone.replace(/\D/g, '')
  if (operadorNome.length < 2 || operadorNome.length > 150) throw new ErroNegocio('NOME_INVALIDO', 'Informe o nome do operador.')
  if (!EMAIL_VALIDO.test(email) || email.length > 254) throw new ErroNegocio('EMAIL_INVALIDO', 'Informe um e-mail válido para o operador.')
  if (telefone && !/^\d{10,11}$/.test(telefone)) throw new ErroNegocio('TELEFONE_INVALIDO', 'Informe o telefone com DDD.')
  if (nome.length < 2 || nome.length > 150) throw new ErroNegocio('NOME_INVALIDO', 'Informe o nome da batedeira.')
  if (endereco.length < 3 || endereco.length > 255) throw new ErroNegocio('ENDERECO_INVALIDO', 'Informe o endereço da batedeira.')
  const ponto = e.pontoReferencia?.trim() || null
  if ((ponto?.length ?? 0) > 255) throw new ErroNegocio('ENDERECO_INVALIDO', 'Ponto de referência longo demais.')
  const { min, max } = validarEstimativa(e.estimativaMin, e.estimativaMax)
  const senha = validarSenha(e.senhaTemporaria, email)
  if (!senha.valida) throw new ErroNegocio('SENHA_FRACA', senha.motivo)
  const senhaHash = await hash(e.senhaTemporaria)
  return prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    if (await tx.usuario.findUnique({ where: { email }, select: { id: true } })) throw new ErroNegocio('EMAIL_EM_USO', 'Já existe uma conta com esse e-mail.')
    const bairro = await tx.bairro.findUnique({ where: { id: e.bairroId } })
    if (!bairro?.ativo) throw new ErroNegocio('BAIRRO_INVALIDO', 'Escolha um bairro habilitado.')
    const operador = await tx.usuario.create({ data: { nome: operadorNome, email, telefone: telefone || null, senhaHash, tipo: 'OPERADOR' } })
    const batedeira = await tx.batedeira.create({
      data: { responsavelId: operador.id, nome, endereco, bairroId: bairro.id, pontoReferencia: ponto, estimativaMinutosMin: min, estimativaMinutosMax: max },
    })
    await auditar(tx, adminId, 'BATEDEIRA_CADASTRADA', 'batedeiras', batedeira.id, { operadorId: operador.id.toString() }, agora)
    return batedeira
  })
}

export async function requisitosDaBatedeira(id: bigint): Promise<RequisitosAtivacao> {
  const b = await prisma.batedeira.findUniqueOrThrow({ where: { id }, include: { responsavel: { select: { status: true } } } })
  const [bairros, produtos, horarios] = await Promise.all([
    prisma.batedeiraBairro.count({ where: { batedeiraId: id, ativo: true, bairro: { ativo: true } } }),
    prisma.produto.count({ where: { batedeiraId: id, ativo: true, disponivel: true } }),
    prisma.horarioFuncionamento.count({ where: { batedeiraId: id, ativo: true } }),
  ])
  return { operadorAtivo: b.responsavel.status === 'ATIVO', bairroAtendido: bairros > 0, produtoDisponivel: produtos > 0, horarioCadastrado: horarios > 0 }
}

/** Ativar, suspender, reativar ou desativar, com motivo e auditoria na mesma transação (US-05). Não mexe nos pedidos existentes. */
export async function mudarStatusBatedeira(adminId: bigint, batedeiraId: bigint, acao: AcaoBatedeira, motivo: string | null, agora: Date = new Date()) {
  const requisitos = await requisitosDaBatedeira(batedeiraId)
  await prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    const b = await tx.batedeira.findUnique({ where: { id: batedeiraId } })
    if (!b) throw new ErroNegocio('BATEDEIRA_NAO_ENCONTRADA', 'Batedeira não encontrada.')
    const r = aplicarAcaoBatedeira(b.status, acao, motivo, requisitos)
    // Condiciona ao estado lido: duas ações simultâneas não se sobrepõem em silêncio.
    const u = await tx.batedeira.updateMany({ where: { id: b.id, status: b.status }, data: { status: r.para } })
    if (u.count === 0) throw new ErroNegocio('CONFLITO', 'A batedeira foi alterada por outra ação. Recarregue a página.')
    await auditar(tx, adminId, r.auditoria, 'batedeiras', b.id, { de: b.status, para: r.para, ...(r.motivo ? { motivo: r.motivo } : {}) }, agora)
  })
}

export const listarBatedeirasAdmin = () =>
  prisma.batedeira.findMany({ orderBy: [{ status: 'asc' }, { nome: 'asc' }], include: { responsavel: { select: { nome: true, email: true, status: true } }, bairro: true } })

export const batedeiraAdmin = (id: bigint) =>
  prisma.batedeira.findUnique({
    where: { id },
    include: {
      responsavel: { select: { id: true, nome: true, email: true, telefone: true, status: true } },
      bairro: true,
      bairros: { include: { bairro: true } },
      produtos: { where: { ativo: true } },
      horarios: true,
    },
  })

// ── Bairros ─────────────────────────────────────────────────────────────────

export const listarBairros = () => prisma.bairro.findMany({ orderBy: { nome: 'asc' }, include: { _count: { select: { batedeirasAtende: true } } } })

export async function criarBairro(adminId: bigint, nomeBruto: string, agora: Date = new Date()) {
  const nome = nomeBruto.trim().replace(/\s+/g, ' ')
  if (nome.length < 2 || nome.length > 100) throw new ErroNegocio('BAIRRO_INVALIDO', 'Informe o nome do bairro (2 a 100 caracteres).')
  return prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    if (await tx.bairro.findUnique({ where: { nome } })) throw new ErroNegocio('BAIRRO_EXISTENTE', 'Esse bairro já está na lista.')
    // Novos bairros nascem desabilitados: habilitar é uma decisão explícita (DEC-019).
    const b = await tx.bairro.create({ data: { nome, ativo: false } })
    await auditar(tx, adminId, 'BAIRRO_CRIADO', 'bairros', b.id, { nome }, agora)
    return b
  })
}

export async function definirBairroHabilitado(adminId: bigint, bairroId: bigint, ativo: boolean, agora: Date = new Date()) {
  await prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    const b = await tx.bairro.findUnique({ where: { id: bairroId } })
    if (!b) throw new ErroNegocio('BAIRRO_INVALIDO', 'Bairro não encontrado.')
    if (b.ativo === ativo) return
    await tx.bairro.update({ where: { id: b.id }, data: { ativo } })
    await auditar(tx, adminId, ativo ? 'BAIRRO_HABILITADO' : 'BAIRRO_DESABILITADO', 'bairros', b.id, { nome: b.nome }, agora)
  })
}

// ── Usuários ────────────────────────────────────────────────────────────────

export const listarUsuarios = (busca?: string) => {
  const q = busca?.trim().slice(0, 100)
  return prisma.usuario.findMany({
    where: { tipo: { in: ['CLIENTE', 'OPERADOR'] }, ...(q ? { OR: [{ nome: { contains: q } }, { email: { contains: q } }] } : {}) },
    orderBy: { criadoEm: 'desc' },
    take: 50,
    select: { id: true, nome: true, email: true, tipo: true, status: true, criadoEm: true },
  })
}

/** Bloqueio e reativação de clientes e operadores; o administrador não bloqueia a si mesmo nem outro administrador. */
export async function alterarBloqueio(adminId: bigint, usuarioId: bigint, bloquear: boolean, motivo: string) {
  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { tipo: true, status: true } })
  if (!alvo) throw new ErroNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.')
  if (alvo.tipo === 'ADMINISTRADOR') throw new ErroNegocio('NAO_AUTORIZADO', 'Contas de administrador não são alteradas por aqui.')
  // Sem mudança real não há o que registrar: evita eventos de auditoria sem efeito.
  if (bloquear === (alvo.status !== 'ATIVO')) throw new ErroNegocio('SEM_MUDANCA', bloquear ? 'A conta já está bloqueada.' : 'A conta já está ativa.')
  await (bloquear ? bloquearUsuario : reativarUsuario)({ usuarioId, administradorId: adminId, motivo })
}

/** Recuperação de acesso assistida (PRD §16.2): nova senha temporária, sessões encerradas e ação auditada sem a senha. */
export async function redefinirSenha(adminId: bigint, usuarioId: bigint, novaSenha: string, agora: Date = new Date()) {
  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!alvo) throw new ErroNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.')
  if (alvo.tipo === 'ADMINISTRADOR') throw new ErroNegocio('NAO_AUTORIZADO', 'Contas de administrador não são alteradas por aqui.')
  const v = validarSenha(novaSenha, alvo.email)
  if (!v.valida) throw new ErroNegocio('SENHA_FRACA', v.motivo)
  const senhaHash = await hash(novaSenha)
  await prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    await tx.usuario.update({ where: { id: alvo.id }, data: { senhaHash } })
    await tx.sessao.updateMany({ where: { usuarioId: alvo.id, encerradaEm: null }, data: { encerradaEm: agora } })
    await auditar(tx, adminId, 'SENHA_REDEFINIDA', 'usuarios', alvo.id, undefined, agora)
  })
}

// ── Pedidos e suporte ───────────────────────────────────────────────────────

export type FiltroPedidosAdmin = { batedeiraId?: bigint; status?: StatusPedido; codigo?: string }

export const listarPedidosAdmin = (f: FiltroPedidosAdmin) =>
  prisma.pedido.findMany({
    where: { batedeiraId: f.batedeiraId, status: f.status as StatusPrisma | undefined, ...(f.codigo ? { codigo: { contains: f.codigo.toUpperCase() } } : {}) },
    orderBy: { criadoEm: 'desc' },
    take: 50,
    include: { batedeira: { select: { nome: true } } },
  })

export const pedidoAdmin = (codigo: string) =>
  prisma.pedido.findUnique({
    where: { codigo },
    include: {
      batedeira: { select: { id: true, nome: true, telefoneOperacional: true } },
      cliente: { select: { nome: true, telefone: true } },
      itens: { orderBy: { id: 'asc' } },
      eventos: { orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }], include: { usuario: { select: { nome: true, tipo: true } } } },
    },
  })

/** Mensagem predefinida do suporte, registrada na linha do tempo do pedido (PRD §13.4, §8.3). */
export async function registrarIntervencao(adminId: bigint, codigo: string, mensagem: string, agora: Date = new Date()) {
  if (!(MENSAGENS_OPERACIONAIS as readonly string[]).includes(mensagem)) throw new ErroNegocio('MENSAGEM_INVALIDA', 'Escolha uma das mensagens disponíveis.')
  await prisma.$transaction(async tx => {
    await exigirAdminAtivo(tx, adminId)
    const p = await tx.pedido.findUnique({ where: { codigo } })
    if (!p) throw new ErroNegocio('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.')
    await tx.eventoPedido.create({ data: { pedidoId: p.id, usuarioId: adminId, tipo: 'INTERVENCAO_ADMINISTRATIVA', mensagem, criadoEm: agora } })
  })
}

/** Cancelamento administrativo: só após o aceite e antes da saída para entrega, com motivo (matriz de estados). */
export async function cancelarPedidoComoAdmin(adminId: bigint, codigo: string, motivo: string, agora: Date = new Date()) {
  const p = await prisma.pedido.findUnique({ where: { codigo }, select: { id: true } })
  if (!p) throw new ErroNegocio('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.')
  await prisma.$transaction(async tx => exigirAdminAtivo(tx, adminId))
  return transicionarPedido({ pedidoId: p.id, para: 'CANCELADO', ator: { tipo: 'USUARIO', papel: 'ADMINISTRADOR', usuarioId: adminId }, motivo }, agora)
}

export const STATUS_FILTRAVEIS: readonly StatusPedido[] = STATUS_PEDIDO

// ── Métricas e auditoria ────────────────────────────────────────────────────

export async function metricasDoPiloto(agora: Date = new Date(), dias = 30) {
  const desde = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000)
  const [pedidos, respostas, motivos, ativas] = await Promise.all([
    prisma.pedido.findMany({ where: { criadoEm: { gte: desde } }, select: { id: true, clienteId: true, status: true, criadoEm: true, aceitoEm: true, finalizadoEm: true } }),
    prisma.eventoPedido.findMany({
      where: { statusAnterior: 'AGUARDANDO_ACEITE', statusNovo: { in: ['ACEITO', 'RECUSADO'] }, pedido: { criadoEm: { gte: desde } } },
      select: { pedidoId: true, criadoEm: true },
    }),
    prisma.eventoPedido.findMany({ where: { tipo: { in: ['PEDIDO_RECUSADO', 'PEDIDO_CANCELADO'] }, pedido: { criadoEm: { gte: desde } } }, select: { tipo: true, motivo: true } }),
    prisma.batedeira.count({ where: { status: 'ATIVA' } }),
  ])
  return {
    dias,
    ...calcularMetricas({
      pedidos,
      respostas: respostas.map(r => ({ pedidoId: r.pedidoId, respondidoEm: r.criadoEm })),
      motivos: motivos.map(m => ({ status: m.tipo === 'PEDIDO_RECUSADO' ? ('RECUSADO' as const) : ('CANCELADO' as const), motivo: m.motivo })),
      batedeirasAtivas: ativas,
      agora,
    }),
    batedeirasAtivas: ativas,
  }
}

export const listarAuditoria = (f: { acao?: string; entidadeTipo?: string } = {}) =>
  prisma.eventoAuditoria.findMany({
    where: { acao: f.acao || undefined, entidadeTipo: f.entidadeTipo || undefined },
    orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    take: 100,
    include: { usuario: { select: { nome: true } } },
  })
export const acoesDeAuditoria = () => prisma.eventoAuditoria.findMany({ distinct: ['acao'], select: { acao: true }, orderBy: { acao: 'asc' } })
export type Cadastro = Awaited<ReturnType<typeof cadastrarBatedeira>>
