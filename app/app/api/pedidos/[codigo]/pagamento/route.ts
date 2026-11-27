import { orderRoute } from '@/lib/api-orders'
import { chooseOrderPayment, HttpError } from '@/lib/orders'

export const dynamic = 'force-dynamic'

// O cliente escolhe a forma de pagamento depois do aceite (10 minutos). Hoje só dinheiro na entrega; o Pix depende do provedor (Épico 9).
export const POST = (request: Request, { params }: { params: Promise<{ codigo: string }> }) => orderRoute(request, ['cliente'], true, async (session, body) => {
  const { codigo } = await params
  if (body.method !== 'DINHEIRO' && body.method !== 'PIX') throw new HttpError(400, 'Escolha Pix ou dinheiro na entrega.')
  const change = body.changeForCents === undefined || body.changeForCents === null ? undefined : Number(body.changeForCents)
  return { order: await chooseOrderPayment(session, codigo, body.method, change) }
})
