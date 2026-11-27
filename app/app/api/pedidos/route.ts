import { orderRoute } from '@/lib/api-orders'
import { createOrder, expireDueOrders, listOrders, parseCreateInput } from '@/lib/orders'

export const dynamic = 'force-dynamic'

// Lista os pedidos que o papel pode ver (cliente: os seus; batedeira: os dela; administrador: todos). Expira o que venceu antes de responder.
export const GET = (request: Request) => orderRoute(request, ['cliente', 'operador', 'admin'], false, async session => {
  await expireDueOrders()
  return { orders: await listOrders(session) }
})

// O cliente envia o pedido; preços e taxa vêm do banco. Repetir o mesmo requestId devolve o pedido já criado.
export const POST = (request: Request) => orderRoute(request, ['cliente'], true, async (session, body) => ({ order: await createOrder(session, parseCreateInput(body)) }))
