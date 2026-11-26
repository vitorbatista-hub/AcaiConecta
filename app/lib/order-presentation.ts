import type { Order, OrderStatus } from './domain'

export const orderGuidance: Record<OrderStatus, string> = {
  AGUARDANDO_ACEITE: 'A batedeira tem até 5 minutos para responder. Você pode cancelar enquanto aguarda.',
  ACEITO: 'A batedeira aceitou seu pedido. Escolha a forma de pagamento em até 10 minutos; sem escolha, o pedido é encerrado sem custo.',
  AGUARDANDO_PAGAMENTO: 'Pague o Pix em até 10 minutos. Quando o pagamento for confirmado, a batedeira começa o preparo.',
  EM_PREPARO: 'Seu açaí está sendo preparado pela batedeira.',
  PRONTO: 'Seu pedido está pronto e aguarda a saída para entrega.',
  SAIU_PARA_ENTREGA: 'Seu pedido está a caminho. Se escolheu dinheiro, prepare o pagamento; acompanhe as mensagens.',
  ENTREGUE: 'A batedeira registrou a entrega. Se houver algum problema, acesse a ajuda.',
  RECUSADO: 'A batedeira não poderá atender. Consulte o motivo e escolha outra opção.',
  EXPIRADO: 'A batedeira não respondeu no prazo. Este pedido não será atendido; você pode fazer outro.',
  CANCELADO: 'Este pedido foi cancelado e não será atendido.',
  FALHA_NA_ENTREGA: 'A entrega não foi concluída. Consulte o motivo e acesse a ajuda.',
}

export function orderTone(status: OrderStatus) {
  if (['RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'].includes(status)) return 'negative' as const
  if (status === 'AGUARDANDO_ACEITE' || status === 'AGUARDANDO_PAGAMENTO') return 'pending' as const
  if (status === 'EM_PREPARO') return 'preparing' as const
  if (status === 'ENTREGUE') return 'delivered' as const
  return 'confirmed' as const
}

export function formatDuration(ms: number | null) {
  if (ms === null || !Number.isFinite(ms)) return 'Sem dados'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

export function reasonCounts(orders: Order[], status: OrderStatus) {
  const counts = new Map<string, number>()
  for (const order of orders) {
    const event = order.timeline.find(event => event.to === status && event.reason)
    if (event?.reason) counts.set(event.reason, (counts.get(event.reason) ?? 0) + 1)
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

function dayKey(ms: number, timeZone = 'America/Belem') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(ms))
}

// Faturamento do dia (DEC-043, DEC-058), com taxa de entrega: dinheiro conta quando o pedido é entregue;
// Pix conta quando o pagamento é confirmado. Estorno ainda não existe nesta versão e, quando existir,
// será descontado no dia em que ocorrer.
const isToday = (iso: string | undefined, today: string) => !!iso && dayKey(Date.parse(iso)) === today
const billedDay = (order: Order) => order.payment === 'PIX' ? order.paidAt : order.timeline.find(event => event.to === 'ENTREGUE')?.at

export function storeDailyMetrics(orders: Order[], storeId: string, now = Date.now()) {
  const today = dayKey(now)
  const storeOrders = orders.filter(order => order.storeId === storeId)
  const deliveredToday = storeOrders.filter(order => order.status === 'ENTREGUE' && order.timeline.some(event => event.to === 'ENTREGUE' && dayKey(Date.parse(event.at)) === today))
  const acceptedToday = storeOrders.filter(order => order.timeline.some(event => event.to === 'ACEITO' && dayKey(Date.parse(event.at)) === today))
  const billedToday = storeOrders.filter(order => order.payment !== undefined && isToday(billedDay(order), today))
  return {
    revenueCents: billedToday.reduce((sum, order) => sum + order.totalCents, 0),
    deliveredToday: deliveredToday.length,
    acceptedToday: acceptedToday.length,
  }
}

export function pilotMetrics(orders: Order[], now = Date.now()) {
  const accepted = orders.filter(order => order.timeline.some(event => event.to === 'ACEITO'))
  const responded = orders.filter(order => order.timeline.some(event => event.to === 'ACEITO' || event.to === 'RECUSADO'))
  const delivered = orders.filter(order => order.status === 'ENTREGUE')
  const responseDurations = responded.map(order => {
    const event = order.timeline.find(event => event.to === 'ACEITO' || event.to === 'RECUSADO')!
    return Date.parse(event.at) - Date.parse(order.createdAt)
  })
  const acceptToDispatchDurations = accepted.flatMap(order => {
    const acceptedAt = order.timeline.find(event => event.to === 'ACEITO')
    const dispatchedAt = order.timeline.find(event => event.to === 'SAIU_PARA_ENTREGA')
    return acceptedAt && dispatchedAt ? [Date.parse(dispatchedAt.at) - Date.parse(acceptedAt.at)] : []
  })
  const deliveryDurations = delivered.flatMap(order => {
    const deliveredAt = order.timeline.find(event => event.to === 'ENTREGUE')
    return deliveredAt ? [Date.parse(deliveredAt.at) - Date.parse(order.createdAt)] : []
  })
  const deliveredByCustomer = new Map<string, number>()
  for (const order of delivered) deliveredByCustomer.set(order.customerId, (deliveredByCustomer.get(order.customerId) ?? 0) + 1)
  const returningCustomers = [...deliveredByCustomer.values()].filter(count => count > 1).length
  const activeStoresLastWeek = new Set(orders
    .filter(order => order.timeline.some(event => event.to === 'ENTREGUE' && now - Date.parse(event.at) <= 7 * 86_400_000))
    .map(order => order.storeId)).size
  return {
    sent: orders.length, accepted: accepted.length, responded: responded.length,
    delivered: delivered.length,
    expired: orders.filter(order => order.status === 'EXPIRADO').length,
    cancelledAfterAcceptance: accepted.filter(order => order.status === 'CANCELADO').length,
    responseWithinFiveMinutes: responded.filter(order => {
      const event = order.timeline.find(event => event.to === 'ACEITO' || event.to === 'RECUSADO')!
      return Date.parse(event.at) - Date.parse(order.createdAt) <= 300_000
    }).length,
    avgResponseMs: average(responseDurations),
    avgAcceptToDispatchMs: average(acceptToDispatchDurations),
    avgDeliveryMs: average(deliveryDurations),
    refusalReasons: reasonCounts(orders, 'RECUSADO'),
    cancellationReasons: reasonCounts(orders, 'CANCELADO'),
    failureReasons: reasonCounts(orders, 'FALHA_NA_ENTREGA'),
    activeCustomers: new Set(orders.map(order => order.customerId)).size,
    returningCustomers,
    recurrenceRate: deliveredByCustomer.size ? returningCustomers / deliveredByCustomer.size : null,
    activeStoresLastWeek,
  }
}
