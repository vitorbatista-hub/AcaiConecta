'use client'

import { useState } from 'react'
import { cents, formatOrderDate, getOrderStatusLabel, guestCustomerName, type Order } from '@/lib/mock-data'
import { orderGuidance, orderTone } from '@/lib/order-presentation'
import { StatusPill, useToast } from './app-shell'
import { usePrototype } from './prototype-provider'
import { Modal } from './modal'

export function CustomerOrder({ order }: { order: Order }) {
  const demo = usePrototype()
  const notify = useToast()
  const [cancel, setCancel] = useState(false)
  const remaining = Math.max(0, Math.ceil((Date.parse(order.acceptedDeadline) - demo.now) / 1000))
  const storeName = order.storeName ?? demo.stores.find(store => store.id === order.storeId)?.name ?? 'Batedeira'
  return <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{storeName}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{order.id} · {formatOrderDate(order.createdAt)}</p></div><StatusPill status={orderTone(order.status)} label={getOrderStatusLabel(order.status)} /></div>
    <p role="status" className="rounded-xl bg-muted p-3 text-sm">{orderGuidance[order.status]}</p>
    {order.status === 'AGUARDANDO_ACEITE' && <p className="font-bold">Resposta em até {Math.floor(remaining / 60)}min {remaining % 60}s</p>}
    <ul className="space-y-2 text-sm">{order.items.map(item => <li key={item.productId}><p>{item.quantity} × {item.name} · R$ {cents(item.quantity * item.unitPriceCents)}</p>{item.note && <p className="text-muted-foreground">Observação: {item.note}</p>}</li>)}</ul>
    <dl className="grid gap-2 border-y py-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>R$ {cents(order.subtotalCents)}</dd></div><div className="flex justify-between"><dt>Entrega</dt><dd>{order.deliveryFeeCents ? `R$ ${cents(order.deliveryFeeCents)}` : 'Grátis'}</dd></div><div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>R$ {cents(order.totalCents)}</dd></div></dl>
    <details><summary className="font-bold">Endereço, pagamento e estimativa</summary><div className="mt-2 space-y-2 text-sm"><p>{order.address.street}, {order.address.number} · {order.address.neighborhood}, Cametá/PA</p>{order.address.complement && <p>Complemento: {order.address.complement}</p>}{order.address.reference && <p>Referência: {order.address.reference}</p>}<p>Telefone: {order.phone}</p><p>{order.payment === 'PIX' ? 'Pix na entrega, diretamente à batedeira' : 'Dinheiro na entrega'}{order.changeForCents !== undefined && ` · Troco para R$ ${cents(order.changeForCents)}`}</p><p>Faixa estimada informada no pedido: {order.estimatedRange}. Não é um horário garantido.</p>{order.note && <p>Observação: {order.note}</p>}</div></details>
    <details open><summary className="font-bold">Acompanhamento</summary><ol className="mt-3 space-y-3 border-l-2 border-primary/30 pl-4">{order.timeline.map((event, index) => <li key={`${event.at}-${index}`} className="text-sm"><p className="font-semibold">{event.message ?? getOrderStatusLabel(event.to)}</p>{event.reason && <p>Motivo: {event.reason}</p>}<p className="text-xs text-muted-foreground">{formatOrderDate(event.at)} · {event.author}</p></li>)}</ol></details>
    {order.status === 'AGUARDANDO_ACEITE' && <button className="demo-button" disabled={remaining === 0} onClick={() => setCancel(true)}>Cancelar pedido</button>}
    {cancel && <Modal title="Cancelar este pedido?" onClose={() => setCancel(false)}><p className="mb-4">O pedido ainda não foi aceito. O cancelamento não poderá ser desfeito.</p><div className="flex flex-wrap gap-2"><button className="demo-button" onClick={() => setCancel(false)}>Manter pedido</button><button className="demo-primary" onClick={() => { try { demo.transition(order.id, 'CANCELADO', { role: 'cliente', name: demo.customer.name || guestCustomerName, customerId: 'customer-001' }); setCancel(false); notify('Pedido cancelado.') } catch (error) { setCancel(false); notify(error instanceof Error ? error.message : 'Não foi possível cancelar.', 'error') } }}>Confirmar cancelamento</button></div></Modal>}
  </article>
}
