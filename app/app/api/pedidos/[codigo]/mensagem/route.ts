import { orderRoute } from '@/lib/api-orders'
import { messageOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

// Mensagem predefinida da batedeira ou intervenção do administrador na linha do tempo do pedido.
export const POST = (request: Request, { params }: { params: Promise<{ codigo: string }> }) => orderRoute(request, ['operador', 'admin'], true, async (session, body) => {
  const { codigo } = await params
  return { order: await messageOrder(session, codigo, typeof body.text === 'string' ? body.text : '') }
})
