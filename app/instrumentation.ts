// Tarefas periódicas do servidor (ADR-006, item 9): expira pedidos vencidos e expurga dados de autenticação. Exige processo persistente.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return
  const global = globalThis as { acaiScheduler?: boolean }
  if (global.acaiScheduler) return // uma única vez por processo (também com recarga a quente)
  global.acaiScheduler = true
  const { expireDueOrders } = await import('./lib/orders.ts')
  const { purgeAuthData } = await import('./lib/sessions.ts')
  let running = false
  setInterval(() => {
    if (running) return
    running = true
    expireDueOrders().catch(() => console.error('Falha ao expirar pedidos.')).finally(() => { running = false })
  }, 10_000).unref()
  setInterval(() => { purgeAuthData().catch(() => console.error('Falha ao expurgar dados de autenticação.')) }, 60 * 60 * 1000).unref()
}
