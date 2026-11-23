import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'
import { alterarProduto, configuracaoDaBatedeira, filaDoOperador, resumoDoDia, salvarBairros, salvarHorarios, salvarProduto, transicionarPedidoDoOperador } from './operador'
import { criarPedido } from './pedidos'

let c: Cenario
beforeAll(async () => { c = await criarCenario() })
afterAll(async () => { await limparCenario(c); await prisma.$disconnect() })

let n = 0
const novoPedido = (extra: object = {}) =>
  criarPedido({
    clienteId: c.cliente.id, batedeiraId: c.batedeira.id, chaveIdempotencia: `op-${c.s}-${++n}`,
    itens: [{ produtoId: c.litro.id, quantidade: 1 }], endereco: { logradouro: 'Rua A', numero: '1', bairroId: c.bairro.id },
    formaPagamento: 'PIX_NA_ENTREGA', ...extra,
  }, AGORA).then(r => r.pedido)
const operador = () => ({ usuarioId: c.operador.id, batedeiraId: c.batedeira.id })

describe('fila, resumo e transições do operador', () => {
  it('só enxerga e move pedidos da própria batedeira', async () => {
    const p = await novoPedido()
    const fila = await filaDoOperador(c.batedeira.id, AGORA)
    expect(fila.ativos.map(x => x.codigo)).toContain(p.codigo)
    expect((await filaDoOperador(c.batedeira2.id, AGORA)).ativos.map(x => x.codigo)).not.toContain(p.codigo)
    await expect(transicionarPedidoDoOperador({ usuarioId: c.operador2.id, batedeiraId: c.batedeira2.id, codigo: p.codigo, para: 'ACEITO' }, AGORA)).rejects.toMatchObject({ codigo: 'PEDIDO_NAO_ENCONTRADO' })
  })

  it('percorre o fluxo feliz e o faturamento exclui pedidos sem venda (DEC-043)', async () => {
    const antes = await resumoDoDia(c.batedeira.id, AGORA)
    const ok = await novoPedido()
    const recusado = await novoPedido()
    const t = (codigo: string, para: Parameters<typeof transicionarPedidoDoOperador>[0]['para'], motivo?: string) =>
      transicionarPedidoDoOperador({ ...operador(), codigo, para, motivo }, AGORA)
    await t(recusado.codigo, 'RECUSADO', 'Produto indisponível')
    for (const para of ['ACEITO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'] as const) await t(ok.codigo, para)
    const depois = await resumoDoDia(c.batedeira.id, AGORA)
    expect(depois.faturamentoCentavos - antes.faturamentoCentavos).toBe(ok.totalCentavos)
    expect(depois.aceitos - antes.aceitos).toBe(1)
    expect(depois.entregues - antes.entregues).toBe(1)
  })

  it('exige motivo para recusar', async () => {
    const p = await novoPedido()
    await expect(transicionarPedidoDoOperador({ ...operador(), codigo: p.codigo, para: 'RECUSADO' }, AGORA)).rejects.toMatchObject({ codigo: 'MOTIVO_OBRIGATORIO' })
  })
})

describe('configuração', () => {
  it('só habilita bairros liberados pelo administrador e salva taxa em centavos', async () => {
    await prisma.bairro.update({ where: { id: c.foraBairro.id }, data: { ativo: false } })
    await expect(salvarBairros(c.batedeira.id, [{ bairroId: c.foraBairro.id, atende: true, taxaCentavos: 100 }])).rejects.toMatchObject({ codigo: 'BAIRRO_INVALIDO' })
    await salvarBairros(c.batedeira.id, [{ bairroId: c.bairro.id, atende: true, taxaCentavos: 0 }])
    const cfg = await configuracaoDaBatedeira(c.batedeira.id)
    expect(cfg.bairros.find(b => b.id === c.bairro.id)).toMatchObject({ atende: true, taxaCentavos: 0 })
  })

  it('substitui os horários e rejeita intervalo invertido sem alterar os atuais', async () => {
    await expect(salvarHorarios(c.batedeira.id, [{ diaSemana: 1, abertura: '20:00', fechamento: '08:00', ativo: true }])).rejects.toThrow()
    expect((await configuracaoDaBatedeira(c.batedeira.id)).horarios).toHaveLength(7)
    await salvarHorarios(c.batedeira.id, [{ diaSemana: 1, abertura: '08:00', fechamento: '12:00', ativo: true }])
    expect((await configuracaoDaBatedeira(c.batedeira.id)).horarios).toEqual([{ diaSemana: 1, abertura: '08:00', fechamento: '12:00', ativo: true }])
  })

  it('produto: valida tamanho, não altera produto de outra batedeira e arquiva sem apagar', async () => {
    await expect(salvarProduto(c.batedeira.id, { nome: 'Açaí 750', descricao: '', volumeMl: 750, precoCentavos: 2000 })).rejects.toThrow()
    await salvarProduto(c.batedeira.id, { nome: 'Açaí novo', descricao: '', volumeMl: 1000, precoCentavos: 2500 })
    await expect(salvarProduto(c.batedeira.id, { id: c.deOutra.id, nome: 'Invasão', descricao: '', volumeMl: 500, precoCentavos: 100 })).rejects.toMatchObject({ codigo: 'PRODUTO_NAO_ENCONTRADO' })
    await expect(alterarProduto(c.batedeira.id, c.deOutra.id, { disponivel: false })).rejects.toMatchObject({ codigo: 'PRODUTO_NAO_ENCONTRADO' })
    await alterarProduto(c.batedeira.id, c.meio.id, { ativo: false })
    expect((await prisma.produto.findUniqueOrThrow({ where: { id: c.meio.id } })).ativo).toBe(false)
  })
})
