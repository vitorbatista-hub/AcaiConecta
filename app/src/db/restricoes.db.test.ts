import { afterAll, describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { prisma } from './client'

class Rollback extends Error {}

/** Executa o corpo numa transação e a desfaz sempre, para os testes não deixarem dados. */
async function emTransacao(corpo: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await prisma.$transaction(async tx => {
      await corpo(tx)
      throw new Rollback()
    })
  } catch (e) {
    if (!(e instanceof Rollback)) throw e
  }
}

const agora = () => new Date()
const maisCinco = () => new Date(Date.now() + 5 * 60_000)

async function cenario(tx: Prisma.TransactionClient) {
  const sufixo = Math.random().toString(36).slice(2, 10)
  const bairro = await tx.bairro.create({ data: { nome: `Centro-${sufixo}` } })
  const cliente = await tx.usuario.create({ data: { nome: 'Cliente Teste', email: `c-${sufixo}@teste.local`, telefone: '91999990000', senhaHash: 'x', tipo: 'CLIENTE' } })
  const operador = await tx.usuario.create({ data: { nome: 'Operador Teste', email: `o-${sufixo}@teste.local`, senhaHash: 'x', tipo: 'OPERADOR' } })
  const batedeira = await tx.batedeira.create({ data: { responsavelId: operador.id, nome: 'Batedeira Teste', endereco: 'Rua A, 1', bairroId: bairro.id, estimativaMinutosMin: 25, estimativaMinutosMax: 35 } })
  return { sufixo, cliente, batedeira }
}

const pedidoBase = (c: Awaited<ReturnType<typeof cenario>>, extra: Partial<Prisma.PedidoUncheckedCreateInput> = {}): Prisma.PedidoUncheckedCreateInput => ({
  codigo: `AC-${c.sufixo}`.slice(0, 24),
  chaveIdempotencia: `chave-${c.sufixo}`,
  clienteId: c.cliente.id,
  batedeiraId: c.batedeira.id,
  formaPagamento: 'PIX_NA_ENTREGA',
  subtotalCentavos: 3200,
  taxaEntregaCentavos: 0,
  totalCentavos: 3200,
  volumeTotalMl: 1000,
  estimativaMinutosMin: 25,
  estimativaMinutosMax: 35,
  enderecoSnapshot: 'Rua B, 2',
  bairroSnapshot: 'Centro',
  criadoEm: agora(),
  expiraAceiteEm: maisCinco(),
  ...extra,
})

const codigoErro = (e: unknown) => (e instanceof Prisma.PrismaClientKnownRequestError ? e.code : e instanceof Error ? e.message : 'desconhecido')

describe('restrições do banco (schema.sql)', () => {
  afterAll(() => prisma.$disconnect())

  it('cliente exige telefone', async () => {
    await emTransacao(async tx => {
      await expect(tx.usuario.create({ data: { nome: 'X', email: `x-${Date.now()}@teste.local`, senhaHash: 'x', tipo: 'CLIENTE' } })).rejects.toThrow()
    })
  })

  it('e-mail é único', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      const erro = await tx.usuario.create({ data: { nome: 'Outro', email: c.cliente.email, telefone: '91999990001', senhaHash: 'x', tipo: 'CLIENTE' } }).catch(codigoErro)
      expect(erro).toBe('P2002')
    })
  })

  it('o mesmo cliente não cria dois pedidos com a mesma chave de idempotência', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      await tx.pedido.create({ data: pedidoBase(c) })
      const erro = await tx.pedido.create({ data: pedidoBase(c, { codigo: `AC-${c.sufixo}b`.slice(0, 24) }) }).catch(codigoErro)
      expect(erro).toBe('P2002')
    })
  })

  it('não aceita pedido abaixo de 1 litro nem total diferente de subtotal + taxa', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      await expect(tx.pedido.create({ data: pedidoBase(c, { volumeTotalMl: 500 }) })).rejects.toThrow()
    })
    await emTransacao(async tx => {
      const c = await cenario(tx)
      await expect(tx.pedido.create({ data: pedidoBase(c, { totalCentavos: 3000 }) })).rejects.toThrow()
    })
  })

  it('troco só em dinheiro e a partir do total', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      await expect(tx.pedido.create({ data: pedidoBase(c, { trocoParaCentavos: 5000 }) })).rejects.toThrow() // Pix
    })
    await emTransacao(async tx => {
      const c = await cenario(tx)
      await expect(tx.pedido.create({ data: pedidoBase(c, { formaPagamento: 'DINHEIRO', trocoParaCentavos: 3000 }) })).rejects.toThrow()
      await tx.pedido.create({ data: pedidoBase(c, { formaPagamento: 'DINHEIRO', trocoParaCentavos: 5000 }) })
    })
  })

  it('evento do pedido exige usuário ou processo, nunca os dois', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      const p = await tx.pedido.create({ data: pedidoBase(c) })
      await expect(tx.eventoPedido.create({ data: { pedidoId: p.id, tipo: 'PEDIDO_CRIADO' } })).rejects.toThrow()
      await expect(tx.eventoPedido.create({ data: { pedidoId: p.id, tipo: 'PEDIDO_CRIADO', usuarioId: c.cliente.id, origemProcesso: 'x' } })).rejects.toThrow()
      await tx.eventoPedido.create({ data: { pedidoId: p.id, tipo: 'PEDIDO_CRIADO', usuarioId: c.cliente.id } })
    })
  })

  it('cada operador responde por uma única batedeira', async () => {
    await emTransacao(async tx => {
      const c = await cenario(tx)
      const b = await tx.batedeira.findUniqueOrThrow({ where: { id: c.batedeira.id } })
      const erro = await tx.batedeira.create({ data: { responsavelId: b.responsavelId, nome: 'Outra', endereco: 'Rua', bairroId: b.bairroId, estimativaMinutosMin: 10, estimativaMinutosMax: 20 } }).catch(codigoErro)
      expect(erro).toBe('P2002')
    })
  })
})
