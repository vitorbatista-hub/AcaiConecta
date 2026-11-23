import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { ErroNegocio } from './erros'
import { criarPedido, expirarPedidosVencidos, MENSAGENS_OPERACIONAIS, registrarMensagemOperacional, transicionarPedido } from './pedidos'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'

let c: Cenario
const criados: Cenario[] = []
beforeAll(async () => { c = await criarCenario(); criados.push(c) })
afterAll(async () => { for (const x of criados) await limparCenario(x); await prisma.$disconnect() })

let n = 0
const chave = () => `chave-${c.s}-${++n}-${Math.random().toString(36).slice(2, 8)}`
const enderecoNovo = (extra: object = {}) => ({ logradouro: 'Rua das Flores', numero: '42', bairroId: c.bairro.id, ...extra })
const base = (extra: Partial<Parameters<typeof criarPedido>[0]> = {}) => ({
  clienteId: c.cliente.id,
  batedeiraId: c.batedeira.id,
  chaveIdempotencia: chave(),
  itens: [{ produtoId: c.litro.id, quantidade: 1 }],
  endereco: enderecoNovo(),
  formaPagamento: 'PIX_NA_ENTREGA' as const,
  ...extra,
})
const codigoDe = async (p: Promise<unknown>) => { try { await p; return 'OK' } catch (e) { return e instanceof ErroNegocio ? e.codigo : (e as Error).name } }

describe('criarPedido', () => {
  it('cria o pedido em AGUARDANDO_ACEITE, com totais, snapshots, prazo de 5 min e evento', async () => {
    const { pedido, criado } = await criarPedido(base({ itens: [{ produtoId: c.meio.id, quantidade: 1 }, { produtoId: c.litro.id, quantidade: 1, observacao: 'bem gelado' }], observacao: 'portão azul' }), AGORA)
    expect(criado).toBe(true)
    expect(pedido.status).toBe('AGUARDANDO_ACEITE')
    expect(pedido).toMatchObject({ subtotalCentavos: 5000, taxaEntregaCentavos: 250, totalCentavos: 5250, volumeTotalMl: 1500, bairroSnapshot: c.bairro.nome })
    expect(pedido.expiraAceiteEm.getTime() - pedido.criadoEm.getTime()).toBe(5 * 60_000)
    expect(pedido.codigo).toMatch(/^AC-[A-Z2-9]{8}$/)
    const itens = await prisma.itemPedido.findMany({ where: { pedidoId: pedido.id } })
    expect(itens.map(i => i.nomeProdutoSnapshot).sort()).toEqual(['Açaí 1 L', 'Açaí 500 ml'])
    const eventos = await prisma.eventoPedido.findMany({ where: { pedidoId: pedido.id } })
    expect(eventos).toHaveLength(1)
    expect(eventos[0]).toMatchObject({ tipo: 'PEDIDO_CRIADO', usuarioId: c.cliente.id })
  })

  it('preço do pedido é copiado: mudar o produto depois não altera o pedido', async () => {
    const { pedido } = await criarPedido(base(), AGORA)
    await prisma.produto.update({ where: { id: c.litro.id }, data: { precoCentavos: 9999 } })
    const item = await prisma.itemPedido.findFirstOrThrow({ where: { pedidoId: pedido.id } })
    expect(item.precoUnitarioCentavos).toBe(3200)
    await prisma.produto.update({ where: { id: c.litro.id }, data: { precoCentavos: 3200 } })
  })

  it('é idempotente: repetir a mesma chave devolve o mesmo pedido', async () => {
    const entrada = base()
    const a = await criarPedido(entrada, AGORA)
    const b = await criarPedido(entrada, AGORA)
    expect(a.criado).toBe(true)
    expect(b.criado).toBe(false)
    expect(b.pedido.id).toBe(a.pedido.id)
    expect(await prisma.pedido.count({ where: { clienteId: c.cliente.id, chaveIdempotencia: entrada.chaveIdempotencia } })).toBe(1)
  })

  it('requisições simultâneas com a mesma chave criam um único pedido', async () => {
    const entrada = base()
    const resultados = await Promise.all(Array.from({ length: 6 }, () => criarPedido(entrada, AGORA)))
    expect(new Set(resultados.map(r => r.pedido.id)).size).toBe(1)
    expect(resultados.filter(r => r.criado)).toHaveLength(1)
    expect(await prisma.pedido.count({ where: { clienteId: c.cliente.id, chaveIdempotencia: entrada.chaveIdempotencia } })).toBe(1)
  })

  it('recusa menos de 1 litro, produto indisponível/arquivado/de outra batedeira e itens repetidos', async () => {
    expect(await codigoDe(criarPedido(base({ itens: [{ produtoId: c.meio.id, quantidade: 1 }] }), AGORA))).toBe('ErroPedido')
    for (const produto of [c.indisponivel, c.arquivado, c.deOutra]) {
      expect(await codigoDe(criarPedido(base({ itens: [{ produtoId: produto.id, quantidade: 2 }] }), AGORA))).toBe('PRODUTO_INDISPONIVEL')
    }
    expect(await codigoDe(criarPedido(base({ itens: [{ produtoId: c.litro.id, quantidade: 1 }, { produtoId: c.litro.id, quantidade: 1 }] }), AGORA))).toBe('ITEM_DUPLICADO')
  })

  it('recusa bairro fora da área da batedeira ou desabilitado', async () => {
    expect(await codigoDe(criarPedido(base({ endereco: enderecoNovo({ bairroId: c.foraBairro.id }) }), AGORA))).toBe('FORA_DA_AREA')
    await prisma.bairro.update({ where: { id: c.bairro.id }, data: { ativo: false } })
    expect(await codigoDe(criarPedido(base(), AGORA))).toBe('BAIRRO_INVALIDO')
    await prisma.bairro.update({ where: { id: c.bairro.id }, data: { ativo: true } })
  })

  it('valida o troco', async () => {
    expect(await codigoDe(criarPedido(base({ formaPagamento: 'DINHEIRO', trocoParaCentavos: 3000 }), AGORA))).toBe('ErroPedido')
    expect(await codigoDe(criarPedido(base({ formaPagamento: 'PIX_NA_ENTREGA', trocoParaCentavos: 5000 }), AGORA))).toBe('ErroPedido')
    const { pedido } = await criarPedido(base({ formaPagamento: 'DINHEIRO', trocoParaCentavos: 5000 }), AGORA)
    expect(pedido.trocoParaCentavos).toBe(5000)
  })

  it('não aceita pedido com a batedeira fechada, sem entrega, fora do horário ou suspensa', async () => {
    const f = await criarCenario({ aberta: false }); criados.push(f)
    const g = await criarCenario({ entrega: false }); criados.push(g)
    const h = await criarCenario({ status: 'SUSPENSA' }); criados.push(h)
    const tenta = (x: Cenario, agora = AGORA) => criarPedido({ clienteId: x.cliente.id, batedeiraId: x.batedeira.id, chaveIdempotencia: `k-${x.s}-12345`, itens: [{ produtoId: x.litro.id, quantidade: 1 }], endereco: { logradouro: 'R', numero: '1', bairroId: x.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA' }, agora)
    expect(await codigoDe(tenta(f))).toBe('BATEDEIRA_INDISPONIVEL')
    expect(await codigoDe(tenta(g))).toBe('BATEDEIRA_INDISPONIVEL')
    expect(await codigoDe(tenta(h))).toBe('BATEDEIRA_INDISPONIVEL')
    expect(await codigoDe(tenta(c, new Date('2026-11-23T03:00:00Z')))).toBe('BATEDEIRA_INDISPONIVEL') // 00:00 local, antes das 06:00
  })

  it('salva o endereço no máximo duas vezes (DEC-040) e permite reutilizá-lo', async () => {
    const d = await criarCenario(); criados.push(d)
    const envio = (x: Cenario, endereco: Parameters<typeof criarPedido>[0]['endereco']) =>
      criarPedido({ clienteId: x.cliente.id, batedeiraId: x.batedeira.id, chaveIdempotencia: `k-${Math.random().toString(36).slice(2)}-abcdef`, itens: [{ produtoId: x.litro.id, quantidade: 1 }], endereco, formaPagamento: 'PIX_NA_ENTREGA' }, AGORA)
    const novo = (n: number) => ({ logradouro: `Rua ${n}`, numero: String(n), bairroId: d.bairro.id, salvar: true })
    const um = await envio(d, novo(1))
    await envio(d, novo(2))
    expect(await codigoDe(envio(d, novo(3)))).toBe('LIMITE_ENDERECOS')
    const salvos = await prisma.enderecoCliente.findMany({ where: { clienteId: d.cliente.id } })
    expect(salvos).toHaveLength(2)
    expect(salvos.filter(s => s.principal)).toHaveLength(1)
    const reutilizado = await envio(d, { enderecoId: salvos[0]!.id })
    expect(reutilizado.pedido.enderecoSnapshot).toMatch(/^Rua [12], [12]$/)
    expect(um.pedido.enderecoClienteId).not.toBeNull()
  })

  it('cliente bloqueado não envia pedidos', async () => {
    const d = await criarCenario(); criados.push(d)
    await prisma.usuario.update({ where: { id: d.cliente.id }, data: { status: 'BLOQUEADO' } })
    expect(await codigoDe(criarPedido({ clienteId: d.cliente.id, batedeiraId: d.batedeira.id, chaveIdempotencia: 'bloqueado-12345', itens: [{ produtoId: d.litro.id, quantidade: 1 }], endereco: { logradouro: 'R', numero: '1', bairroId: d.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA' }, AGORA))).toBe('CONTA_INDISPONIVEL')
  })
})

describe('transicionarPedido', () => {
  const novoPedido = async () => (await criarPedido(base(), AGORA)).pedido
  const op = () => ({ tipo: 'USUARIO' as const, papel: 'OPERADOR' as const, usuarioId: c.operador.id, batedeiraId: c.batedeira.id })
  const cli = () => ({ tipo: 'USUARIO' as const, papel: 'CLIENTE' as const, usuarioId: c.cliente.id })
  const adm = () => ({ tipo: 'USUARIO' as const, papel: 'ADMINISTRADOR' as const, usuarioId: c.admin.id })
  const dentro = new Date(AGORA.getTime() + 60_000)

  it('percorre o fluxo completo gravando um evento por transição, com autor', async () => {
    const p = await novoPedido()
    for (const para of ['ACEITO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'] as const) {
      await transicionarPedido({ pedidoId: p.id, para, ator: op() }, dentro)
    }
    const final = await prisma.pedido.findUniqueOrThrow({ where: { id: p.id } })
    expect(final.status).toBe('ENTREGUE')
    expect(final.aceitoEm).not.toBeNull()
    expect(final.finalizadoEm).not.toBeNull()
    const eventos = await prisma.eventoPedido.findMany({ where: { pedidoId: p.id }, orderBy: { id: 'asc' } })
    expect(eventos.map(e => e.statusNovo)).toEqual(['AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'])
    expect(eventos.slice(1).every(e => e.usuarioId === c.operador.id && e.origemProcesso === null)).toBe(true)
  })

  it('recusa com motivo registra PEDIDO_RECUSADO; sem motivo falha e nada muda', async () => {
    const p = await novoPedido()
    expect(await codigoDe(transicionarPedido({ pedidoId: p.id, para: 'RECUSADO', ator: op() }, dentro))).toBe('ErroTransicao')
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: p.id } })).status).toBe('AGUARDANDO_ACEITE')
    await transicionarPedido({ pedidoId: p.id, para: 'RECUSADO', ator: op(), motivo: 'Produto indisponível' }, dentro)
    const e = await prisma.eventoPedido.findFirstOrThrow({ where: { pedidoId: p.id, tipo: 'PEDIDO_RECUSADO' } })
    expect(e.motivo).toBe('Produto indisponível')
  })

  it('cliente cancela antes do aceite; depois do aceite só a operação cancela, com motivo', async () => {
    const a = await novoPedido()
    await transicionarPedido({ pedidoId: a.id, para: 'CANCELADO', ator: cli() }, dentro)
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: a.id } })).status).toBe('CANCELADO')

    const b = await novoPedido()
    await transicionarPedido({ pedidoId: b.id, para: 'ACEITO', ator: op() }, dentro)
    expect(await codigoDe(transicionarPedido({ pedidoId: b.id, para: 'CANCELADO', ator: cli(), motivo: 'desisti' }, dentro))).toBe('ErroTransicao')
    await transicionarPedido({ pedidoId: b.id, para: 'CANCELADO', ator: adm(), motivo: 'Sem insumo' }, dentro)
    const ev = await prisma.eventoPedido.findFirstOrThrow({ where: { pedidoId: b.id, tipo: 'PEDIDO_CANCELADO' } })
    expect(ev).toMatchObject({ usuarioId: c.admin.id, motivo: 'Sem insumo' })
  })

  it('operador de outra batedeira não age sobre o pedido', async () => {
    const p = await novoPedido()
    const alheio = { tipo: 'USUARIO' as const, papel: 'OPERADOR' as const, usuarioId: c.operador2.id, batedeiraId: c.batedeira2.id }
    expect(await codigoDe(transicionarPedido({ pedidoId: p.id, para: 'ACEITO', ator: alheio }, dentro))).toBe('ErroTransicao')
  })

  it('depois dos 5 minutos não é possível aceitar', async () => {
    const p = await novoPedido()
    expect(await codigoDe(transicionarPedido({ pedidoId: p.id, para: 'ACEITO', ator: op() }, new Date(AGORA.getTime() + 5 * 60_000)))).toBe('ErroTransicao')
  })

  it('aceitar e expirar ao mesmo tempo: apenas um vence e o resultado é consistente', async () => {
    for (let i = 0; i < 5; i++) {
      const p = await novoPedido()
      const limite = new Date(AGORA.getTime() + 5 * 60_000 - 1000) // 1 s antes do fim: aceitar vale
      const depois = new Date(AGORA.getTime() + 5 * 60_000) // no fim: só expirar vale
      const [aceite, expira] = await Promise.allSettled([
        transicionarPedido({ pedidoId: p.id, para: 'ACEITO', ator: op() }, limite),
        transicionarPedido({ pedidoId: p.id, para: 'EXPIRADO', ator: { tipo: 'SISTEMA', processo: 'expiracao-aceite' } }, depois),
      ])
      const final = await prisma.pedido.findUniqueOrThrow({ where: { id: p.id } })
      const eventos = await prisma.eventoPedido.findMany({ where: { pedidoId: p.id, tipo: 'STATUS_ALTERADO' } })
      expect(eventos).toHaveLength(1)
      expect([aceite.status, expira.status].filter(s => s === 'fulfilled')).toHaveLength(1)
      expect(['ACEITO', 'EXPIRADO']).toContain(final.status)
    }
  })

  it('aceites simultâneos do mesmo pedido: um único evento', async () => {
    const p = await novoPedido()
    const r = await Promise.allSettled(Array.from({ length: 5 }, () => transicionarPedido({ pedidoId: p.id, para: 'ACEITO', ator: op() }, dentro)))
    expect(r.filter(x => x.status === 'fulfilled')).toHaveLength(1)
    expect(await prisma.eventoPedido.count({ where: { pedidoId: p.id, statusNovo: 'ACEITO' } })).toBe(1)
  })
})

describe('expiração automática', () => {
  it('expira só os pedidos vencidos e é idempotente', async () => {
    const d = await criarCenario(); criados.push(d)
    const mk = (k: string, agora: Date) => criarPedido({ clienteId: d.cliente.id, batedeiraId: d.batedeira.id, chaveIdempotencia: `exp-${k}-${d.s}`, itens: [{ produtoId: d.litro.id, quantidade: 1 }], endereco: { logradouro: 'R', numero: '1', bairroId: d.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA' }, agora)
    const antigo = await mk('a', AGORA)
    const recente = await mk('b', new Date(AGORA.getTime() + 4 * 60_000))
    const agora = new Date(AGORA.getTime() + 6 * 60_000)
    const n1 = await expirarPedidosVencidos(agora)
    const n2 = await expirarPedidosVencidos(agora)
    expect(n1).toBeGreaterThanOrEqual(1)
    expect(n2).toBe(0)
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: antigo.pedido.id } })).status).toBe('EXPIRADO')
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: recente.pedido.id } })).status).toBe('AGUARDANDO_ACEITE')
    const ev = await prisma.eventoPedido.findFirstOrThrow({ where: { pedidoId: antigo.pedido.id, statusNovo: 'EXPIRADO' } })
    expect(ev).toMatchObject({ usuarioId: null, origemProcesso: 'expiracao-aceite' })
  })
})

describe('mensagens operacionais', () => {
  it('só mensagens predefinidas, do operador da própria batedeira', async () => {
    const p = (await criarPedido(base(), AGORA)).pedido
    const operador = { usuarioId: c.operador.id, batedeiraId: c.batedeira.id }
    await registrarMensagemOperacional({ pedidoId: p.id, operador, mensagem: MENSAGENS_OPERACIONAIS[2] }, AGORA)
    expect(await codigoDe(registrarMensagemOperacional({ pedidoId: p.id, operador, mensagem: 'texto livre' }, AGORA))).toBe('MENSAGEM_INVALIDA')
    expect(await codigoDe(registrarMensagemOperacional({ pedidoId: p.id, operador: { usuarioId: c.operador2.id, batedeiraId: c.batedeira2.id }, mensagem: MENSAGENS_OPERACIONAIS[0] }, AGORA))).toBe('PEDIDO_NAO_ENCONTRADO')
  })
})
