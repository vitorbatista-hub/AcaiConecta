import { hash, verify } from '@node-rs/argon2'
import { prisma } from '@/db/client'
import { esperaDeLoginMs, JANELA_MS, MENSAGEM_LOGIN_INVALIDO, normalizarEmail } from '@/domain/auth/limitacao'
import { validarSenha } from '@/domain/auth/senha'
import { expiracaoInicial, expiracaoRenovada, gerarToken, hashDaOrigem, hashDoToken, sessaoValida } from '@/domain/auth/sessao'
import { ErroNegocio } from './erros'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
let hashFalso: Promise<string> | undefined

/** Hash descartável: calculado quando o e-mail não existe, para não vazar contas pelo tempo de resposta. */
const hashParaTempoConstante = () => (hashFalso ??= hash('senha-inexistente-para-tempo-constante'))

export async function cadastrarCliente(entrada: { nome: string; email: string; telefone: string; senha: string }) {
  const nome = entrada.nome.trim()
  const email = normalizarEmail(entrada.email)
  const telefone = entrada.telefone.replace(/\D/g, '')
  if (nome.length < 2 || nome.length > 150) throw new ErroNegocio('NOME_INVALIDO', 'Informe seu nome.')
  if (!EMAIL_VALIDO.test(email) || email.length > 254) throw new ErroNegocio('EMAIL_INVALIDO', 'Informe um e-mail válido.')
  if (!/^\d{10,11}$/.test(telefone)) throw new ErroNegocio('TELEFONE_INVALIDO', 'Informe o telefone com DDD.')
  const senha = validarSenha(entrada.senha, email)
  if (!senha.valida) throw new ErroNegocio('SENHA_FRACA', senha.motivo)
  const jaExiste = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  if (jaExiste) throw new ErroNegocio('EMAIL_EM_USO', 'Não foi possível criar a conta com esses dados.')
  return prisma.usuario.create({
    data: { nome, email, telefone, senhaHash: await hash(entrada.senha), tipo: 'CLIENTE' },
    select: { id: true, nome: true, email: true, tipo: true },
  })
}

export async function entrar(
  entrada: { email: string; senha: string; ip: string },
  segredoHmac: string,
  agora: Date = new Date(),
): Promise<{ token: string; expiraEm: Date; tipo: 'CLIENTE' | 'OPERADOR' | 'ADMINISTRADOR' }> {
  const email = normalizarEmail(entrada.email).slice(0, 254)
  const origemHash = hashDaOrigem(entrada.ip, segredoHmac)
  const desde = new Date(agora.getTime() - JANELA_MS)
  const [porEmail, porOrigem] = await Promise.all([
    prisma.tentativaLogin.findMany({ where: { email, sucesso: false, criadoEm: { gt: desde } }, select: { criadoEm: true } }),
    prisma.tentativaLogin.findMany({ where: { origemHash, sucesso: false, criadoEm: { gt: desde } }, select: { criadoEm: true } }),
  ])
  if (esperaDeLoginMs(porEmail.map(t => t.criadoEm), porOrigem.map(t => t.criadoEm), agora) > 0) {
    throw new ErroNegocio('LOGIN_INVALIDO', MENSAGEM_LOGIN_INVALIDO)
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  const senhaConfere = await verify(usuario?.senhaHash ?? (await hashParaTempoConstante()), entrada.senha).catch(() => false)
  const ok = Boolean(usuario) && senhaConfere && usuario?.status === 'ATIVO'
  await prisma.tentativaLogin.create({ data: { email, origemHash, sucesso: ok, criadoEm: agora } })
  if (!ok || !usuario) throw new ErroNegocio('LOGIN_INVALIDO', MENSAGEM_LOGIN_INVALIDO)

  const token = gerarToken()
  const expiraEm = expiracaoInicial(usuario.tipo, agora)
  await prisma.sessao.create({ data: { usuarioId: usuario.id, tokenHash: hashDoToken(token), criadoEm: agora, expiraEm } })
  return { token, expiraEm, tipo: usuario.tipo }
}

export type UsuarioAutenticado = {
  id: bigint
  nome: string
  tipo: 'CLIENTE' | 'OPERADOR' | 'ADMINISTRADOR'
  batedeiraId: bigint | null
}

/** Valida o token de uma requisição. Sessão encerrada, expirada ou de conta inativa é recusada. */
export async function usuarioDaSessao(token: string, agora: Date = new Date()): Promise<UsuarioAutenticado | null> {
  if (!token) return null
  const sessao = await prisma.sessao.findUnique({
    where: { tokenHash: hashDoToken(token) },
    include: { usuario: { include: { batedeira: { select: { id: true } } } } },
  })
  if (!sessao) return null
  const { usuario } = sessao
  if (!sessaoValida({ encerradaEm: sessao.encerradaEm, expiraEm: sessao.expiraEm, usuarioAtivo: usuario.status === 'ATIVO' }, agora)) return null
  const renovada = expiracaoRenovada(usuario.tipo, agora, sessao.expiraEm)
  if (renovada.getTime() !== sessao.expiraEm.getTime()) {
    await prisma.sessao.update({ where: { id: sessao.id }, data: { expiraEm: renovada } })
  }
  return { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo, batedeiraId: usuario.batedeira?.id ?? null }
}

export async function encerrarSessao(token: string, agora: Date = new Date()) {
  await prisma.sessao.updateMany({ where: { tokenHash: hashDoToken(token), encerradaEm: null }, data: { encerradaEm: agora } })
}

/** Bloqueia a conta e encerra todas as sessões na mesma transação, com motivo auditado (ADR-001 §3). */
export async function bloquearUsuario(args: { usuarioId: bigint; administradorId: bigint; motivo: string }, agora: Date = new Date()) {
  const motivo = args.motivo.trim()
  if (!motivo) throw new ErroNegocio('MOTIVO_OBRIGATORIO', 'Informe o motivo do bloqueio.')
  await prisma.$transaction(async tx => {
    const admin = await tx.usuario.findUnique({ where: { id: args.administradorId } })
    if (admin?.tipo !== 'ADMINISTRADOR' || admin.status !== 'ATIVO') throw new ErroNegocio('NAO_AUTORIZADO', 'Ação restrita ao administrador.')
    await tx.usuario.update({ where: { id: args.usuarioId }, data: { status: 'BLOQUEADO' } })
    await tx.sessao.updateMany({ where: { usuarioId: args.usuarioId, encerradaEm: null }, data: { encerradaEm: agora } })
    await tx.eventoAuditoria.create({
      data: { usuarioId: admin.id, acao: 'USUARIO_BLOQUEADO', entidadeTipo: 'usuarios', entidadeId: args.usuarioId, detalhes: { motivo }, criadoEm: agora },
    })
  })
}

export async function reativarUsuario(args: { usuarioId: bigint; administradorId: bigint; motivo: string }, agora: Date = new Date()) {
  const motivo = args.motivo.trim()
  if (!motivo) throw new ErroNegocio('MOTIVO_OBRIGATORIO', 'Informe o motivo da reativação.')
  await prisma.$transaction(async tx => {
    const admin = await tx.usuario.findUnique({ where: { id: args.administradorId } })
    if (admin?.tipo !== 'ADMINISTRADOR' || admin.status !== 'ATIVO') throw new ErroNegocio('NAO_AUTORIZADO', 'Ação restrita ao administrador.')
    await tx.usuario.update({ where: { id: args.usuarioId }, data: { status: 'ATIVO' } })
    await tx.eventoAuditoria.create({
      data: { usuarioId: admin.id, acao: 'USUARIO_REATIVADO', entidadeTipo: 'usuarios', entidadeId: args.usuarioId, detalhes: { motivo }, criadoEm: agora },
    })
  })
}

/** Expurgo periódico (ADR-001 §7): tentativas após 24 h; sessões encerradas ou expiradas. */
export async function expurgarAutenticacao(agora: Date = new Date()) {
  const limiteTentativas = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  const [tentativas, sessoes] = await Promise.all([
    prisma.tentativaLogin.deleteMany({ where: { criadoEm: { lt: limiteTentativas } } }),
    prisma.sessao.deleteMany({ where: { OR: [{ encerradaEm: { not: null } }, { expiraEm: { lt: agora } }] } }),
  ])
  return { tentativas: tentativas.count, sessoes: sessoes.count }
}
