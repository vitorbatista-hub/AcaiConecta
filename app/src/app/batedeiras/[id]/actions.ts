'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { parseReais, ErroDinheiro } from '@/domain/dinheiro'
import { criarPedido } from '@/server/pedidos'
import { mensagemDoErro } from '@/server/erro-usuario'
import { exigirPapel } from '@/server/guardas'

export type EstadoPedido = { erro?: string }

const id = z.string().regex(/^\d{1,19}$/).transform(v => BigInt(v))
const texto = (max: number) => z.string().trim().max(max)

const Itens = z
  .array(z.object({ produtoId: id, quantidade: z.number().int().min(1).max(100) }))
  .min(1)
  .max(30)

const Entrada = z.object({
  batedeiraId: id,
  chave: z.string().trim().min(8).max(64),
  itens: z.string().transform((s, ctx) => {
    try {
      return Itens.parse(JSON.parse(s))
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Sacola inválida.' })
      return z.NEVER
    }
  }),
  enderecoModo: z.enum(['salvo', 'novo']),
  enderecoId: z.string().optional(),
  logradouro: texto(180).optional(),
  numero: texto(20).optional(),
  complemento: texto(100).optional(),
  pontoReferencia: texto(255).optional(),
  bairroId: z.string().optional(),
  salvar: z.string().optional(),
  formaPagamento: z.enum(['DINHEIRO', 'PIX_NA_ENTREGA']),
  troco: texto(20).optional(),
  observacao: texto(500).optional(),
})

export async function enviarPedidoAction(_: EstadoPedido, form: FormData): Promise<EstadoPedido> {
  const bruto = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string'))
  const parsed = Entrada.safeParse(bruto)
  if (!parsed.success) return { erro: 'Confira os dados do pedido e tente de novo.' }
  const d = parsed.data

  let codigo: string
  try {
    const cliente = await exigirPapel('CLIENTE')
    let endereco
    if (d.enderecoModo === 'salvo') {
      const eid = id.safeParse(d.enderecoId)
      if (!eid.success) return { erro: 'Escolha o endereço de entrega.' }
      endereco = { enderecoId: eid.data }
    } else {
      const bid = id.safeParse(d.bairroId)
      if (!bid.success) return { erro: 'Escolha o bairro de entrega.' }
      endereco = { logradouro: d.logradouro ?? '', numero: d.numero ?? '', complemento: d.complemento, pontoReferencia: d.pontoReferencia, bairroId: bid.data, salvar: d.salvar === 'on' }
    }
    let troco: number | null = null
    if (d.formaPagamento === 'DINHEIRO' && d.troco) {
      try {
        troco = parseReais(d.troco)
      } catch (e) {
        if (e instanceof ErroDinheiro) return { erro: 'Informe o valor do troco em reais, por exemplo 50,00.' }
        throw e
      }
    }
    const { pedido } = await criarPedido({
      clienteId: cliente.id,
      batedeiraId: d.batedeiraId,
      chaveIdempotencia: d.chave,
      itens: d.itens,
      endereco,
      formaPagamento: d.formaPagamento,
      trocoParaCentavos: troco,
      observacao: d.observacao,
    })
    codigo = pedido.codigo
  } catch (e) {
    return { erro: mensagemDoErro(e) }
  }
  redirect(`/pedidos/${codigo}`)
}
