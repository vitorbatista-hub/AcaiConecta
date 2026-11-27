// Métricas do piloto no servidor (ADR-006 etapa 5). O cálculo é a função pura `pilotMetrics`; aqui só se leem os pedidos.
import { allOrders } from './orders.ts'
import { pilotMetrics } from './order-presentation.ts'

export type AdminMetrics = ReturnType<typeof pilotMetrics>

export async function adminMetrics(now = Date.now()): Promise<AdminMetrics> {
  return pilotMetrics(await allOrders(), now)
}
