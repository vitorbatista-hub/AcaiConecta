import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { bloquearUsuario, cadastrarCliente, encerrarSessao, entrar, expurgarAutenticacao, reativarUsuario, usuarioDaSessao } from './auth'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'

const SEGREDO = 'segredo-de-teste-com-pelo-menos-32-caracteres'
const SENHA = 'senha-de-teste-123'
let c: Cenario
const cadastrados: string[] = []
beforeAll(async () => { c = await criarCenario() })
afterAll(async () => {
  await prisma.tentativaLogin.deleteMany({ where: { email: { in: cadastrados } } })
  const us = await prisma.usuario.findMany({ where: { email: { in: cadastrados } }, select: { id: true } })
  await prisma.sessao.deleteMany({ where: { usuarioId: { in: us.map(u => u.id) } } })
  await prisma.usuario.deleteMany({ where: { id: { in: us.map(u => u.id) } } })
  await limparCenario(c)
  await prisma.$disconnect()
})
const codigo = async (p: Promise<unknown>) => { try { await p; return 'OK' } catch (e) { return (e as { codigo?: string }).codigo ?? (e as Error).name } }
const login = (email: string, senha = SENHA, ip = '203.0.113.7', agora = AGORA) => entrar({ email, senha, ip }, SEGREDO, agora)

describe('cadastro', () => {
  it('cria cliente com senha em hash argon2id e e-mail normalizado', async () => {
    const email = `Novo-${c.s}@Teste.Local`
    cadastrados.push(email.toLowerCase())
    const u = await cadastrarCliente({ nome: 'Ana', email, telefone: '(91) 99999-0000', senha: SENHA })
    expect(u.email).toBe(email.toLowerCase())
    const guardado = await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } })
    expect(guardado.senhaHash).toMatch(/^\$argon2id\$/)
    expect(guardado.senhaHash).not.toContain(SENHA)
    expect(guardado.telefone).toBe('91999990000')
    expect(guardado.tipo).toBe('CLIENTE')
  })
  it('valida nome, e-mail, telefone, senha e e-mail repetido', async () => {
    const ok = { nome: 'Ana', email: `v-${c.s}@teste.local`, telefone: '91999990000', senha: SENHA }
    expect(await codigo(cadastrarCliente({ ...ok, nome: '' }))).toBe('NOME_INVALIDO')
    expect(await codigo(cadastrarCliente({ ...ok, email: 'sem-arroba' }))).toBe('EMAIL_INVALIDO')
    expect(await codigo(cadastrarCliente({ ...ok, telefone: '123' }))).toBe('TELEFONE_INVALIDO')
    expect(await codigo(cadastrarCliente({ ...ok, senha: '12345678' }))).toBe('SENHA_FRACA')
    expect(await codigo(cadastrarCliente({ ...ok, email: c.cliente.email }))).toBe('EMAIL_EM_USO')
  })
})

describe('login e sessão', () => {
  it('entra, valida a sessão e guarda só o hash do token', async () => {
    const { token } = await login(c.cliente.email)
    const sessao = await prisma.sessao.findFirstOrThrow({ where: { usuarioId: c.cliente.id } })
    expect(sessao.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(sessao.tokenHash).not.toBe(token)
    expect(await usuarioDaSessao(token, AGORA)).toMatchObject({ id: c.cliente.id, tipo: 'CLIENTE', batedeiraId: null })
  })
  it('operador carrega o vínculo com a própria batedeira', async () => {
    const { token } = await login(c.operador.email)
    expect(await usuarioDaSessao(token, AGORA)).toMatchObject({ tipo: 'OPERADOR', batedeiraId: c.batedeira.id })
  })
  it('cada login gera um token novo', async () => {
    const a = await login(c.cliente.email), b = await login(c.cliente.email)
    expect(a.token).not.toBe(b.token)
  })
  it('cliente: sessão de 30 dias renovada a cada uso; operador: 12 h fixas', async () => {
    const cli = await login(c.cliente.email)
    expect(cli.expiraEm.getTime() - AGORA.getTime()).toBe(30 * 86_400_000)
    const depois = new Date(AGORA.getTime() + 10 * 86_400_000)
    await usuarioDaSessao(cli.token, depois)
    const renovada = await prisma.sessao.findFirstOrThrow({ where: { tokenHash: (await import('@/domain/auth/sessao')).hashDoToken(cli.token) } })
    expect(renovada.expiraEm.getTime()).toBe(depois.getTime() + 30 * 86_400_000)

    const equipe = await login(c.operador.email)
    expect(equipe.expiraEm.getTime() - AGORA.getTime()).toBe(12 * 3_600_000)
    expect(await usuarioDaSessao(equipe.token, new Date(AGORA.getTime() + 13 * 3_600_000))).toBeNull()
    const apos = await prisma.sessao.findFirstOrThrow({ where: { tokenHash: (await import('@/domain/auth/sessao')).hashDoToken(equipe.token) } })
    expect(apos.expiraEm.getTime()).toBe(equipe.expiraEm.getTime())
  })
  it('sair encerra a sessão', async () => {
    const { token } = await login(c.cliente.email)
    await encerrarSessao(token, AGORA)
    expect(await usuarioDaSessao(token, AGORA)).toBeNull()
  })
  it('token inexistente ou vazio não autentica', async () => {
    expect(await usuarioDaSessao('', AGORA)).toBeNull()
    expect(await usuarioDaSessao('token-qualquer', AGORA)).toBeNull()
  })
})

describe('respostas que não revelam contas (ADR-001 §5)', () => {
  it('e-mail inexistente e senha errada têm exatamente a mesma resposta', async () => {
    const msg = async (p: Promise<unknown>) => { try { await p } catch (e) { return `${(e as { codigo: string }).codigo}|${(e as Error).message}` } return 'OK' }
    const inexistente = await msg(login(`nao-existe-${c.s}@teste.local`, SENHA, '198.51.100.1'))
    const errada = await msg(login(c.cliente.email, 'errada-errada', '198.51.100.2'))
    expect(inexistente).toBe(errada)
    expect(inexistente).toContain('LOGIN_INVALIDO')
  })
})

describe('limitação de tentativas', () => {
  it('após 10 falhas no e-mail, até a senha correta é recusada durante a espera; depois libera', async () => {
    const d = await criarCenario()
    try {
      const falha = () => login(d.cliente.email, 'errada-errada', '198.51.100.9').catch(() => null)
      for (let i = 0; i < 10; i++) await falha()
      expect(await prisma.tentativaLogin.count({ where: { email: d.cliente.email, sucesso: false } })).toBe(10)
      expect(await codigo(login(d.cliente.email, SENHA, '198.51.100.10'))).toBe('LOGIN_INVALIDO') // senha certa, ainda em espera
      expect(await prisma.tentativaLogin.count({ where: { email: d.cliente.email } })).toBe(10) // tentativa bloqueada não é registrada
      const depoisDaEspera = new Date(AGORA.getTime() + 61_000)
      // falhas registradas com `AGORA`; passado 1 min da última, libera
      expect(await codigo(login(d.cliente.email, SENHA, '198.51.100.10', depoisDaEspera))).toBe('OK')
    } finally { await limparCenario(d) }
  })
  it('a tentativa guarda o HMAC da origem, nunca o IP', async () => {
    await login(c.cliente.email, 'errada-errada', '203.0.113.200').catch(() => null)
    const t = await prisma.tentativaLogin.findFirstOrThrow({ where: { email: c.cliente.email }, orderBy: { id: 'desc' } })
    expect(t.origemHash).toMatch(/^[0-9a-f]{64}$/)
    expect(Object.values(t).map(String).join('|')).not.toContain('203.0.113.200')
  })
})

describe('bloqueio de conta', () => {
  it('encerra todas as sessões, impede novo login e audita o motivo; reativar restaura', async () => {
    const d = await criarCenario()
    try {
      const a = await login(d.cliente.email), b = await login(d.cliente.email)
      expect(await codigo(bloquearUsuario({ usuarioId: d.cliente.id, administradorId: d.admin.id, motivo: ' ' }))).toBe('MOTIVO_OBRIGATORIO')
      expect(await codigo(bloquearUsuario({ usuarioId: d.cliente.id, administradorId: d.operador.id, motivo: 'x' }))).toBe('NAO_AUTORIZADO')
      await bloquearUsuario({ usuarioId: d.cliente.id, administradorId: d.admin.id, motivo: 'Uso indevido' })
      expect(await usuarioDaSessao(a.token, AGORA)).toBeNull()
      expect(await usuarioDaSessao(b.token, AGORA)).toBeNull()
      expect(await codigo(login(d.cliente.email, SENHA, '198.51.100.30'))).toBe('LOGIN_INVALIDO')
      const aud = await prisma.eventoAuditoria.findFirstOrThrow({ where: { entidadeId: d.cliente.id, acao: 'USUARIO_BLOQUEADO' } })
      expect(aud).toMatchObject({ usuarioId: d.admin.id, detalhes: { motivo: 'Uso indevido' } })
      await reativarUsuario({ usuarioId: d.cliente.id, administradorId: d.admin.id, motivo: 'Resolvido' })
      expect(await codigo(login(d.cliente.email, SENHA, '198.51.100.31'))).toBe('OK')
    } finally { await limparCenario(d) }
  })
})

describe('expurgo', () => {
  it('remove tentativas com mais de 24 h e sessões encerradas ou expiradas, preservando as ativas', async () => {
    const d = await criarCenario()
    try {
      await prisma.tentativaLogin.create({ data: { email: d.cliente.email, origemHash: 'a'.repeat(64), sucesso: false, criadoEm: new Date(AGORA.getTime() - 25 * 3_600_000) } })
      await prisma.tentativaLogin.create({ data: { email: d.cliente.email, origemHash: 'a'.repeat(64), sucesso: false, criadoEm: new Date(AGORA.getTime() - 1 * 3_600_000) } })
      const ativa = await login(d.cliente.email)
      const encerrada = await login(d.cliente.email); await encerrarSessao(encerrada.token, AGORA)
      await expurgarAutenticacao(AGORA)
      expect(await prisma.tentativaLogin.count({ where: { email: d.cliente.email, criadoEm: { lt: new Date(AGORA.getTime() - 24 * 3_600_000) } } })).toBe(0)
      expect(await usuarioDaSessao(ativa.token, AGORA)).not.toBeNull()
      expect(await prisma.sessao.count({ where: { usuarioId: d.cliente.id, encerradaEm: { not: null } } })).toBe(0)
    } finally { await limparCenario(d) }
  })
})
