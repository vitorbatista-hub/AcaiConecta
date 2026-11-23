import { hash } from '@node-rs/argon2'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { listarBatedeiras, pedidoDoCliente, perfilBatedeira } from './consultas-cliente'
import { AGORA, type Cenario, criarCenario, limparCenario } from './fixtures.test-util'
import { criarPedido } from './pedidos'

let c: Cenario
let fechado: Cenario
let outroClienteId: bigint
beforeAll(async () => {
  c = await criarCenario()
  fechado = await criarCenario({ aberta: false })
  outroClienteId = (await prisma.usuario.create({ data: { nome: 'Outro', email: `x-${c.s}@teste.local`, telefone: '91988880000', senhaHash: await hash('senha-de-teste-123'), tipo: 'CLIENTE' } })).id
})
afterAll(async () => {
  await limparCenario(c)
  await limparCenario(fechado)
  await prisma.usuario.delete({ where: { id: outroClienteId } })
  await prisma.$disconnect()
})

describe('listarBatedeiras', () => {
  it('filtra por nome e bairro e põe as que recebem pedidos antes das fechadas', async () => {
    const todas = await listarBatedeiras({ busca: 'Batedeira' }, AGORA)
    const meus = todas.filter(b => [c.batedeira.id, c.batedeira2.id, fechado.batedeira.id].includes(b.id))
    expect(meus).toHaveLength(3)
    const ultimaAberta = Math.max(...meus.map((b, i) => (b.aberta ? i : -1)))
    const primeiraFechada = meus.findIndex(b => !b.aberta)
    expect(primeiraFechada).toBeGreaterThan(ultimaAberta)

    const porBairro = await listarBatedeiras({ bairroId: c.bairro.id }, AGORA)
    expect(porBairro.map(b => b.id).sort()).toEqual([c.batedeira.id, c.batedeira2.id].sort())
    expect(porBairro[0]?.taxaMinimaCentavos).toBe(250)
  })

  it('não lista batedeira suspensa nem bairro desabilitado', async () => {
    await prisma.batedeira.update({ where: { id: c.batedeira2.id }, data: { status: 'SUSPENSA' } })
    expect((await listarBatedeiras({ bairroId: c.bairro.id }, AGORA)).map(b => b.id)).toEqual([c.batedeira.id])
    expect(await perfilBatedeira(c.batedeira2.id, AGORA)).toBeNull()
    await prisma.bairro.update({ where: { id: c.bairro.id }, data: { ativo: false } })
    expect(await listarBatedeiras({ bairroId: c.bairro.id }, AGORA)).toEqual([])
    await prisma.bairro.update({ where: { id: c.bairro.id }, data: { ativo: true } })
  })
})

describe('perfilBatedeira', () => {
  it('mostra só produtos ativos e disponíveis e indica abertura e próxima abertura', async () => {
    const aberto = await perfilBatedeira(c.batedeira.id, AGORA)
    expect(aberto?.aceitaPedidos).toBe(true)
    expect(aberto?.produtos.map(p => p.nome).sort()).toEqual(['Açaí 1 L', 'Açaí 500 ml'])
    const fechada = await perfilBatedeira(fechado.batedeira.id, AGORA)
    expect(fechada?.aceitaPedidos).toBe(false)
    expect(fechada?.proximaAbertura).not.toBeNull()
  })
})

describe('pedidoDoCliente', () => {
  it('só devolve o pedido ao próprio cliente', async () => {
    const { pedido } = await criarPedido({
      clienteId: c.cliente.id, batedeiraId: c.batedeira.id, chaveIdempotencia: `consulta-${c.s}`,
      itens: [{ produtoId: c.litro.id, quantidade: 1 }],
      endereco: { logradouro: 'Rua A', numero: '1', bairroId: c.bairro.id }, formaPagamento: 'PIX_NA_ENTREGA',
    }, AGORA)
    expect((await pedidoDoCliente(c.cliente.id, pedido.codigo))?.eventos).toHaveLength(1)
    expect(await pedidoDoCliente(outroClienteId, pedido.codigo)).toBeNull()
  })
})
