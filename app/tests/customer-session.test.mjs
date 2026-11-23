import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyCustomerSession, restoreCustomerSession, saveAddress, removeAddress, maxSavedAddresses } from '../lib/customer-session.ts'
import { mockProducts, createOrderId, mockOrders } from '../lib/mock-data.ts'
import { formatDuration, orderGuidance, orderTone, pilotMetrics, storeDailyMetrics } from '../lib/order-presentation.ts'

test('restaura sacola e preenchimento sem guardar senha', () => {
  const session = { ...emptyCustomerSession(), cart: [{ product: mockProducts[0], quantity: 2, note: 'Sem açúcar' }], storeId: mockProducts[0].storeId, phone: '91900000000', payment: 'DINHEIRO', change: '50', note: 'Casa azul' }
  assert.deepEqual(restoreCustomerSession(JSON.parse(JSON.stringify(session))), session)
  assert.equal('password' in session, false)
  assert.equal('password' in restoreCustomerSession({ ...session, password: 'discard-me' }), false)
  assert.deepEqual(restoreCustomerSession(undefined), emptyCustomerSession())
  assert.throws(() => restoreCustomerSession({ ...session, cart: [{ quantity: 1 }] }))
  assert.throws(() => restoreCustomerSession({ ...session, address: { street: null } }))
})

test('endereços têm no máximo um principal e mantêm alternativa após remoção', () => {
  const first = { id: 'a', street: 'Rua teste', number: '1', neighborhood: 'Centro', primary: false }
  const second = { ...first, id: 'b', number: '2', primary: true }
  const addresses = saveAddress(saveAddress([], first), second)
  assert.equal(addresses.filter(address => address.primary).length, 1)
  assert.equal(addresses.find(address => address.primary).id, 'b')
  assert.equal(removeAddress(addresses, 'b')[0].primary, true)
  assert.equal(addresses.find(address => address.id === 'a').primary, false)
  assert.throws(() => saveAddress(addresses, { ...first, neighborhood: 'Outro' }))
})

test('cliente mantém no máximo dois endereços, alterna o principal e edita sem ultrapassar o limite', () => {
  const primary = { id: 'a', street: 'Rua um', number: '1', neighborhood: 'Centro', primary: true }
  const secondary = { ...primary, id: 'b', number: '2', primary: false }
  const addresses = saveAddress(saveAddress([], primary), secondary)
  assert.equal(maxSavedAddresses, 2)
  assert.throws(() => saveAddress(addresses, { ...primary, id: 'c', number: '3', primary: false }), /2 endereços/)
  const swapped = saveAddress(addresses, { ...secondary, primary: true })
  assert.equal(swapped.length, 2)
  assert.equal(swapped.find(address => address.primary).id, 'b')
  const edited = saveAddress(swapped, { ...swapped.find(address => address.id === 'a'), street: 'Rua editada' })
  assert.equal(edited.length, 2)
  assert.equal(edited.find(address => address.id === 'a').street, 'Rua editada')
  assert.equal(edited.find(address => address.primary).id, 'b')
  assert.throws(() => restoreCustomerSession({ ...emptyCustomerSession(), addresses: [primary, secondary, { ...secondary, id: 'c' }] }))
})

test('mensagens de estados terminais não orientam aguardar aceite', () => {
  for (const status of ['ENTREGUE', 'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA']) {
    assert.doesNotMatch(orderGuidance[status], /tem até 5 minutos/)
  }
  for (const status of ['RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA']) assert.equal(orderTone(status), 'negative')
})

test('código de pedido cabe no campo de 24 caracteres do schema SQL', () => {
  assert.match(createOrderId(), /^AC-[A-F0-9]{20}$/)
})

test('métricas preservam aceites anteriores ao cancelamento', () => {
  const order = structuredClone(mockOrders[0])
  order.status = 'CANCELADO'
  const metrics = pilotMetrics([order])
  assert.equal(metrics.accepted, 1)
  assert.equal(metrics.cancelledAfterAcceptance, 1)
  assert.equal(metrics.delivered, 0)
  assert.equal(pilotMetrics([]).sent, 0)
})

test('métricas de apoio calculam tempos médios, motivos e recorrência', () => {
  const base = structuredClone(mockOrders[0])
  const start = Date.parse(base.createdAt)
  const at = offset => new Date(start + offset).toISOString()
  const delivered = { ...base, id: 'AC-D1', customerId: 'customer-001', status: 'ENTREGUE', timeline: [
    { to: 'AGUARDANDO_ACEITE', at: at(0), author: 'cliente' },
    { from: 'AGUARDANDO_ACEITE', to: 'ACEITO', at: at(60_000), author: 'Operador' },
    { from: 'ACEITO', to: 'SAIU_PARA_ENTREGA', at: at(300_000), author: 'Operador' },
    { from: 'SAIU_PARA_ENTREGA', to: 'ENTREGUE', at: at(600_000), author: 'Operador' },
  ] }
  const deliveredAgain = { ...delivered, id: 'AC-D2' }
  const refused = { ...base, id: 'AC-R1', customerId: 'customer-002', status: 'RECUSADO', timeline: [
    { to: 'AGUARDANDO_ACEITE', at: at(0), author: 'cliente' },
    { from: 'AGUARDANDO_ACEITE', to: 'RECUSADO', at: at(120_000), author: 'Operador', reason: 'Sem capacidade' },
  ] }
  const now = start + 20 * 60_000
  const metrics = pilotMetrics([delivered, deliveredAgain, refused], now)
  assert.equal(metrics.avgResponseMs, 80_000)
  assert.equal(metrics.avgAcceptToDispatchMs, 240_000)
  assert.equal(metrics.avgDeliveryMs, 600_000)
  assert.deepEqual(metrics.refusalReasons, [{ reason: 'Sem capacidade', count: 1 }])
  assert.equal(metrics.activeCustomers, 2)
  assert.equal(metrics.returningCustomers, 1)
  assert.equal(metrics.recurrenceRate, 1)
  assert.equal(metrics.activeStoresLastWeek, 1)
  assert.equal(pilotMetrics([]).avgResponseMs, null)
})

test('faturamento do dia soma pedidos criados hoje, com taxa, exceto os que terminaram sem venda', () => {
  const base = structuredClone(mockOrders[0])
  const now = Date.parse('2026-09-28T15:00:00Z')
  const today = new Date(now - 60 * 60_000).toISOString()
  const yesterday = new Date(now - 24 * 60 * 60_000).toISOString()
  const order = (id, status, createdAt, totalCents) => ({ ...base, id, status, createdAt, totalCents, timeline: [{ to: 'AGUARDANDO_ACEITE', at: createdAt, author: 'cliente' }] })
  const orders = [
    order('AC-1', 'AGUARDANDO_ACEITE', today, 3450),
    order('AC-2', 'ENTREGUE', today, 4000),
    ...['RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'].map((status, i) => order(`AC-X${i}`, status, today, 9999)),
    order('AC-3', 'ENTREGUE', yesterday, 5000),
    { ...order('AC-4', 'ACEITO', today, 7000), storeId: 'outra-batedeira' },
  ]
  assert.equal(storeDailyMetrics(orders, base.storeId, now).revenueCents, 7450)
})

test('formatDuration indica ausência de dados e formata minutos e segundos', () => {
  assert.equal(formatDuration(null), 'Sem dados')
  assert.equal(formatDuration(45_000), '45s')
  assert.equal(formatDuration(125_000), '2min 5s')
})
