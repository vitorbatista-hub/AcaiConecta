import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { alterarBloqueio, cadastrarBatedeira, cancelarPedidoComoAdmin, criarBairro, definirBairroHabilitado, metricasDoPiloto, mudarStatusBatedeira, redefinirSenha, registrarIntervencao } from './admin'
import { entrar } from './auth'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'
import { criarPedido, transicionarPedido } from './pedidos'

let c: Cenario
const extraUsuarios: bigint[] = []
const extraBatedeiras: bigint[] = []
const extraBairros: bigint[] = []
beforeAll(async () => { c = await criarCenario() })
afterAll(async () => {
  await prisma.eventoAuditoria.deleteMany({ where: { usuarioId: c.admin.id } })
  await prisma.sessao.deleteMany({ where: { usuarioId: { in: extraUsuarios } } })
  await prisma.tentativaLogin.deleteMany({ where: { email: { endsWith: `${c.s}@teste.local` } } })
  await prisma.horarioFuncionamento.deleteMany({ where: { batedeiraId: { in: extraBatedeiras } } })
  await prisma.batedeiraBairro.deleteMany({ where: { batedeiraId: { in: extraBatedeiras } } })
  await prisma.produto.deleteMany({ where: { batedeiraId: { in: extraBatedeiras } } })
  await prisma.batedeira.deleteMany({ where: { id: { in: extraBatedeiras } } })
  await prisma.usuario.deleteMany({ where: { id: { in: extraUsuarios } } })
  await prisma.bairro.deleteMany({ where: { id: { in: extraBairros } } })
  await limparCenario(c)
  await prisma.$disconnect()
})

const cadastro = (extra: object = {}) => ({
  operadorNome: 'Operador Novo', operadorEmail: `novo-${c.s}@teste.local`, operadorTelefone: '', senhaTemporaria: 'temporaria-segura-1',
  nome: 'Batedeira Nova', endereco: 'Rua B, 2', bairroId: c.bairro.id, estimativaMin: 20, estimativaMax: 30, ...extra,
})
const auditoria = (acao: string) => prisma.eventoAuditoria.findMany({ where: { usuarioId: c.admin.id, acao } })

describe('cadastro e ciclo de vida da batedeira', () => {
  let id: bigint
  it('cadastra em análise, cria o operador com senha em hash e audita', async () => {
    const b = await cadastrarBatedeira(c.admin.id, cadastro(), AGORA)
    id = b.id; extraBatedeiras.push(id)
    const op = await prisma.usuario.findUniqueOrThrow({ where: { id: b.responsavelId } })
    extraUsuarios.push(op.id)
    expect(b.status).toBe('EM_ANALISE')
    expect(op).toMatchObject({ tipo: 'OPERADOR', status: 'ATIVO' })
    expect(op.senhaHash).not.toContain('temporaria')
    expect((await auditoria('BATEDEIRA_CADASTRADA')).length).toBe(1)
    await expect(cadastrarBatedeira(c.admin.id, cadastro(), AGORA)).rejects.toMatchObject({ codigo: 'EMAIL_EM_USO' })
  })

  it('recusa cadastro por quem não é administrador ativo e com senha fraca', async () => {
    await expect(cadastrarBatedeira(c.operador.id, cadastro({ operadorEmail: `x-${c.s}@teste.local` }), AGORA)).rejects.toMatchObject({ codigo: 'NAO_AUTORIZADO' })
    await expect(cadastrarBatedeira(c.admin.id, cadastro({ operadorEmail: `y-${c.s}@teste.local`, senhaTemporaria: '12345678' }), AGORA)).rejects.toMatchObject({ codigo: 'SENHA_FRACA' })
  })

  it('só ativa com os requisitos atendidos; suspende com motivo, auditando cada passo', async () => {
    await expect(mudarStatusBatedeira(c.admin.id, id, 'ATIVAR', null, AGORA)).rejects.toThrow(/Requisitos pendentes/)
    await prisma.batedeiraBairro.create({ data: { batedeiraId: id, bairroId: c.bairro.id, taxaEntregaCentavos: 0 } })
    await prisma.produto.create({ data: { batedeiraId: id, nome: 'Açaí', unidade: '1 L', volumeMl: 1000, precoCentavos: 3000 } })
    await prisma.horarioFuncionamento.create({ data: { batedeiraId: id, diaSemana: 1, horaAbertura: new Date('1970-01-01T06:00:00Z'), horaFechamento: new Date('1970-01-01T22:00:00Z') } })
    await mudarStatusBatedeira(c.admin.id, id, 'ATIVAR', null, AGORA)
    await expect(mudarStatusBatedeira(c.admin.id, id, 'SUSPENDER', '  ', AGORA)).rejects.toThrow(/motivo/i)
    await mudarStatusBatedeira(c.admin.id, id, 'SUSPENDER', 'Reclamações de clientes', AGORA)
    expect((await prisma.batedeira.findUniqueOrThrow({ where: { id } })).status).toBe('SUSPENSA')
    const ev = await prisma.eventoAuditoria.findFirstOrThrow({ where: { acao: 'BATEDEIRA_SUSPENSA', entidadeId: id } })
    expect(ev.detalhes).toMatchObject({ de: 'ATIVA', para: 'SUSPENSA', motivo: 'Reclamações de clientes' })
    await mudarStatusBatedeira(c.admin.id, id, 'REATIVAR', 'Resolvido', AGORA)
    await mudarStatusBatedeira(c.admin.id, id, 'DESATIVAR', 'Saiu do piloto', AGORA)
    await expect(mudarStatusBatedeira(c.admin.id, id, 'REATIVAR', 'x', AGORA)).rejects.toThrow()
  })

  it('suspender não altera pedidos existentes', async () => {
    const { pedido } = await criarPedido({
      clienteId: c.cliente.id, batedeiraId: c.batedeira.id, chaveIdempotencia: `adm-${c.s}-1`, itens: [{ produtoId: c.litro.id, quantidade: 1 }],
      endereco: { logradouro: 'Rua A', numero: '1', bairroId: c.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA',
    }, AGORA)
    await mudarStatusBatedeira(c.admin.id, c.batedeira.id, 'SUSPENDER', 'Teste', AGORA)
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).status).toBe('AGUARDANDO_ACEITE')
    await prisma.batedeira.update({ where: { id: c.batedeira.id }, data: { status: 'ATIVA' } })
  })
})

describe('bairros', () => {
  it('novo bairro nasce desabilitado e a mudança é auditada', async () => {
    const nome = `Bairro-${c.s}`
    const b = await criarBairro(c.admin.id, nome, AGORA)
    extraBairros.push(b.id)
    expect(b.ativo).toBe(false)
    await expect(criarBairro(c.admin.id, nome, AGORA)).rejects.toMatchObject({ codigo: 'BAIRRO_EXISTENTE' })
    await definirBairroHabilitado(c.admin.id, b.id, true, AGORA)
    expect((await prisma.bairro.findUniqueOrThrow({ where: { id: b.id } })).ativo).toBe(true)
    expect((await auditoria('BAIRRO_HABILITADO')).length).toBe(1)
  })
})

describe('usuários', () => {
  it('redefine a senha, encerra sessões e não grava a senha na auditoria', async () => {
    const sessao = await entrar({ email: c.cliente.email, senha: 'senha-de-teste-123', ip: '10.0.0.1' }, 'segredo-de-teste-com-32-caracteres-ou-mais')
    await redefinirSenha(c.admin.id, c.cliente.id, 'nova-senha-segura-9', AGORA)
    const ativas = await prisma.sessao.count({ where: { usuarioId: c.cliente.id, encerradaEm: null } })
    expect(ativas).toBe(0)
    expect(sessao.token).toBeTruthy()
    const [ev] = await auditoria('SENHA_REDEFINIDA')
    expect(ev?.detalhes).toBeNull()
    await expect(redefinirSenha(c.admin.id, c.admin.id, 'outra-senha-segura-1', AGORA)).rejects.toMatchObject({ codigo: 'NAO_AUTORIZADO' })
  })

  it('bloqueia e reativa sem duplicar eventos quando nada muda', async () => {
    await alterarBloqueio(c.admin.id, c.cliente.id, true, 'Teste')
    await expect(alterarBloqueio(c.admin.id, c.cliente.id, true, 'Teste')).rejects.toMatchObject({ codigo: 'SEM_MUDANCA' })
    await alterarBloqueio(c.admin.id, c.cliente.id, false, 'Fim')
    await expect(alterarBloqueio(c.admin.id, c.cliente.id, false, 'Fim')).rejects.toMatchObject({ codigo: 'SEM_MUDANCA' })
    expect((await auditoria('USUARIO_BLOQUEADO')).length).toBe(1)
  })

  it('não bloqueia administrador', async () => {
    await expect(alterarBloqueio(c.admin.id, c.admin.id, true, 'x')).rejects.toMatchObject({ codigo: 'NAO_AUTORIZADO' })
  })
})

describe('suporte e métricas', () => {
  it('admin cancela só pedido aceito, com motivo; intervenção entra na linha do tempo', async () => {
    const { pedido } = await criarPedido({
      clienteId: c.cliente.id, batedeiraId: c.batedeira.id, chaveIdempotencia: `adm-${c.s}-2`, itens: [{ produtoId: c.litro.id, quantidade: 1 }],
      endereco: { logradouro: 'Rua A', numero: '1', bairroId: c.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA',
    }, AGORA)
    await expect(cancelarPedidoComoAdmin(c.admin.id, pedido.codigo, 'Motivo', AGORA)).rejects.toMatchObject({ codigo: 'NAO_AUTORIZADO' })
    await transicionarPedido({ pedidoId: pedido.id, para: 'ACEITO', ator: { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: c.operador.id, batedeiraId: c.batedeira.id } }, AGORA)
    await registrarIntervencao(c.admin.id, pedido.codigo, 'Seu pedido está atrasado.', AGORA)
    await expect(registrarIntervencao(c.admin.id, pedido.codigo, 'texto livre', AGORA)).rejects.toMatchObject({ codigo: 'MENSAGEM_INVALIDA' })
    await expect(cancelarPedidoComoAdmin(c.admin.id, pedido.codigo, ' ', AGORA)).rejects.toMatchObject({ codigo: 'MOTIVO_OBRIGATORIO' })
    await cancelarPedidoComoAdmin(c.admin.id, pedido.codigo, 'Falta de produto', AGORA)
    const eventos = await prisma.eventoPedido.findMany({ where: { pedidoId: pedido.id }, orderBy: { id: 'asc' } })
    expect(eventos.map(e => e.tipo)).toEqual(['PEDIDO_CRIADO', 'STATUS_ALTERADO', 'INTERVENCAO_ADMINISTRATIVA', 'PEDIDO_CANCELADO'])
  })

  it('calcula métricas sem erro sobre dados reais', async () => {
    const m = await metricasDoPiloto(new Date(AGORA.getTime() + 60_000))
    expect(m.pedidos).toBeGreaterThanOrEqual(2)
    expect(m.taxaAceite).not.toBeNaN()
  })
})
