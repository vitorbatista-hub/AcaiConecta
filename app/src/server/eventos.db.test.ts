import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hash } from '@node-rs/argon2'
import { prisma } from '@/db/client'
import { consultarEventos, ultimoEventoId } from './eventos'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'
import { criarPedido, expirarPedidosVencidos, transicionarPedido } from './pedidos'

let c: Cenario
let outroCliente: bigint
beforeAll(async () => {
  c = await criarCenario()
  outroCliente = (await prisma.usuario.create({ data: { nome: 'Outro', email: `ev-${c.s}@teste.local`, telefone: '91977770000', senhaHash: await hash('senha-de-teste-123'), tipo: 'CLIENTE' } })).id
})
afterAll(async () => {
  await limparCenario(c)
  await prisma.usuario.delete({ where: { id: outroCliente } })
  await prisma.$disconnect()
})

let n = 0
const pedido = (batedeiraId: bigint, produtoId: bigint, clienteId = c.cliente.id, quantidade = 1) =>
  criarPedido({ clienteId, batedeiraId, chaveIdempotencia: `ev-${c.s}-${++n}`, itens: [{ produtoId, quantidade }], endereco: { logradouro: 'Rua A', numero: '1', bairroId: c.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA' }, AGORA).then(r => r.pedido)

describe('consultarEventos', () => {
  it('cada escopo só vê os próprios pedidos', async () => {
    const a = await pedido(c.batedeira.id, c.litro.id)
    const b = await pedido(c.batedeira2.id, c.deOutra.id, c.cliente.id, 2)
    const outro = await pedido(c.batedeira.id, c.litro.id, outroCliente)
    const codigos = async (e: Parameters<typeof consultarEventos>[0]) => [...new Set((await consultarEventos(e, 0n, 1000)).map(x => x.dados.codigo))]

    const daA = await codigos({ tipo: 'batedeira', batedeiraId: c.batedeira.id })
    expect(daA).toEqual(expect.arrayContaining([a.codigo, outro.codigo]))
    expect(daA).not.toContain(b.codigo)
    expect(await codigos({ tipo: 'pedido', codigo: a.codigo, clienteId: c.cliente.id })).toEqual([a.codigo])
    // cliente errado não recebe nada do pedido de outro
    expect(await codigos({ tipo: 'pedido', codigo: a.codigo, clienteId: outroCliente })).toEqual([])
    expect(await codigos({ tipo: 'admin', codigo: b.codigo })).toEqual([b.codigo])
  })

  it('devolve só o que veio depois do último id, em ordem, e sem dados pessoais', async () => {
    const p = await pedido(c.batedeira.id, c.litro.id)
    const escopo = { tipo: 'pedido', codigo: p.codigo, clienteId: c.cliente.id } as const
    const antes = await ultimoEventoId(escopo)
    expect(await consultarEventos(escopo, antes)).toEqual([])
    await transicionarPedido({ pedidoId: p.id, para: 'ACEITO', ator: { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: c.operador.id, batedeiraId: c.batedeira.id } }, AGORA)
    const novos = await consultarEventos(escopo, antes)
    expect(novos).toHaveLength(1)
    expect(novos[0]?.dados).toEqual({ codigo: p.codigo, tipo: 'STATUS_ALTERADO', status: 'ACEITO' })
  })

  it('a expiração pelo agendador gera evento para o operador e o cliente', async () => {
    const p = await pedido(c.batedeira.id, c.litro.id)
    const antes = await ultimoEventoId({ tipo: 'batedeira', batedeiraId: c.batedeira.id })
    const depoisDoPrazo = new Date(AGORA.getTime() + 6 * 60_000)
    expect(await expirarPedidosVencidos(depoisDoPrazo)).toBeGreaterThanOrEqual(1)
    const eventos = await consultarEventos({ tipo: 'batedeira', batedeiraId: c.batedeira.id }, antes)
    expect(eventos.some(e => e.dados.codigo === p.codigo && e.dados.status === 'EXPIRADO')).toBe(true)
  })
})
