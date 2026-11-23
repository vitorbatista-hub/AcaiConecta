'use server'

import { revalidatePath } from 'next/cache'
import { mensagemDoErro } from '@/server/erro-usuario'
import { exigirPapel } from '@/server/guardas'
import { prisma } from '@/db/client'
import { transicionarPedido } from '@/server/pedidos'

export type EstadoCancelamento = { erro?: string }

/** O cliente só cancela o próprio pedido e só enquanto aguarda resposta; a regra final está em `validarTransicao`. */
export async function cancelarPedidoAction(_: EstadoCancelamento, form: FormData): Promise<EstadoCancelamento> {
  const codigo = form.get('codigo')
  if (typeof codigo !== 'string' || !/^AC-[A-Z0-9]{8}$/.test(codigo)) return { erro: 'Pedido inválido.' }
  try {
    const cliente = await exigirPapel('CLIENTE')
    const pedido = await prisma.pedido.findFirst({ where: { codigo, clienteId: cliente.id }, select: { id: true } })
    if (!pedido) return { erro: 'Pedido não encontrado.' }
    await transicionarPedido({ pedidoId: pedido.id, para: 'CANCELADO', ator: { tipo: 'USUARIO', papel: 'CLIENTE', usuarioId: cliente.id } })
  } catch (e) {
    return { erro: mensagemDoErro(e) }
  }
  revalidatePath(`/pedidos/${codigo}`)
  return {}
}
