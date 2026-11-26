import { orderRoute } from '@/lib/api-orders'
import { HttpError, transitionOrder } from '@/lib/orders'
import type { OrderStatus } from '@/lib/domain'

export const dynamic = 'force-dynamic'
const STATUSES = ['AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA']

// Muda o estado do pedido pelas regras de domínio (quem pode, de qual estado e com qual motivo).
export const POST = (request: Request, { params }: { params: Promise<{ codigo: string }> }) => orderRoute(request, ['cliente', 'operador', 'admin'], true, async (session, body) => {
  const { codigo } = await params
  if (typeof body.to !== 'string' || !STATUSES.includes(body.to)) throw new HttpError(400, 'Estado inválido.')
  return { order: await transitionOrder(session, codigo, body.to as OrderStatus, typeof body.reason === 'string' ? body.reason : undefined) }
})
