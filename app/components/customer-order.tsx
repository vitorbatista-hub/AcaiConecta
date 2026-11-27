'use client'

import { useState } from 'react'
import { cents, formatOrderDate, getOrderStatusLabel, guestCustomerName, parseMoney, type Actor, type Order, type PaymentMethod, type Store } from '@/lib/domain'
import { neighborhoodLabel } from '@/lib/neighborhoods'
import { orderGuidance, orderTone } from '@/lib/order-presentation'
import { StatusPill, useToast } from './app-shell'
import { useApp } from './app-provider'
import { Modal } from './modal'
import { OrderProgress } from './order-progress'

export function CustomerOrder({ order }: { order: Order }) {
  const ctx = useApp()
  const notify = useToast()
  const [cancel, setCancel] = useState(false)
  const remaining = Math.max(0, Math.ceil((Date.parse(order.acceptedDeadline) - ctx.now) / 1000))
  const store = ctx.stores.find(item => item.id === order.storeId)
  const storeName = order.storeName ?? store?.name ?? 'Batedeira'
  return <article className="surface space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{storeName}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{order.id} · {formatOrderDate(order.createdAt)}</p></div><StatusPill status={orderTone(order.status)} label={getOrderStatusLabel(order.status)} /></div>
    <OrderProgress status={order.status} />
    <p role="status" className="rounded-xl bg-muted p-3 text-sm">{orderGuidance[order.status]}</p>
    {order.status === 'AGUARDANDO_ACEITE' && <p className="font-bold tabular-nums">Resposta em até {Math.floor(remaining / 60)}min {remaining % 60}s</p>}
    {order.status === 'ACEITO' && !order.payment && <PaymentChoice order={order} store={store} />}
    {order.status === 'AGUARDANDO_PAGAMENTO' && <PixPending order={order} />}
    <ul className="space-y-2 text-sm">{order.items.map(item => <li key={item.productId}><p>{item.quantity} × {item.name} · R$ {cents(item.quantity * item.unitPriceCents)}</p>{item.note && <p className="text-muted-foreground">Observação: {item.note}</p>}</li>)}</ul>
    <dl className="grid gap-2 border-y py-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>R$ {cents(order.subtotalCents)}</dd></div><div className="flex justify-between"><dt>Entrega</dt><dd>{order.deliveryFeeCents ? `R$ ${cents(order.deliveryFeeCents)}` : 'Grátis'}</dd></div><div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>R$ {cents(order.totalCents)}</dd></div></dl>
    <details><summary className="font-bold">Endereço, pagamento e estimativa</summary><div className="mt-2 space-y-2 text-sm"><p>{order.address.street}, {order.address.number} · {neighborhoodLabel(order.address.neighborhood)}, Cametá/PA</p>{order.address.complement && <p>Complemento: {order.address.complement}</p>}{order.address.reference && <p>Referência: {order.address.reference}</p>}<p>Telefone: {order.phone}</p><p>{!order.payment ? 'Pagamento: a escolher depois do aceite' : order.payment === 'PIX' ? `Pix on-line${order.paidAt ? ' · pagamento confirmado' : ''}` : 'Dinheiro na entrega'}{order.changeForCents !== undefined && ` · Troco para R$ ${cents(order.changeForCents)}`}</p><p>Faixa estimada informada no pedido: {order.estimatedRange}. Não é um horário garantido.</p>{order.note && <p>Observação: {order.note}</p>}</div></details>
    <details open><summary className="font-bold">Acompanhamento</summary><ol className="mt-3 space-y-3 border-l-2 border-primary/30 pl-4">{order.timeline.map((event, index) => <li key={`${event.at}-${index}`} className="text-sm"><p className="font-semibold">{event.message ?? getOrderStatusLabel(event.to)}</p>{event.reason && <p>Motivo: {event.reason}</p>}<p className="text-xs text-muted-foreground">{formatOrderDate(event.at)} · {event.author}</p></li>)}</ol></details>
    {order.status === 'AGUARDANDO_ACEITE' && <button className="btn" disabled={remaining === 0} onClick={() => setCancel(true)}>Cancelar pedido</button>}
    {cancel && <Modal title="Cancelar este pedido?" onClose={() => setCancel(false)}><p className="mb-4">O pedido ainda não foi aceito. O cancelamento não poderá ser desfeito.</p><div className="flex flex-wrap gap-2"><button className="btn" onClick={() => setCancel(false)}>Manter pedido</button><button className="btn-primary" onClick={async () => { try { await ctx.transition(order.id, 'CANCELADO', { role: 'cliente', name: ctx.customer.name || guestCustomerName }); setCancel(false); notify('Pedido cancelado.') } catch (error) { setCancel(false); notify(error instanceof Error ? error.message : 'Não foi possível cancelar.', 'error') } }}>Confirmar cancelamento</button></div></Modal>}
  </article>
}

const clock = (ms: number) => `${Math.floor(ms / 60000)}min ${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}s`

function PaymentChoice({ order, store }: { order: Order; store?: Store }) {
  const ctx = useApp()
  const notify = useToast()
  const [method, setMethod] = useState<PaymentMethod>('DINHEIRO')
  const [change, setChange] = useState('')
  const [error, setError] = useState('')
  const left = Math.max(0, Date.parse(order.paymentDeadline ?? '') - ctx.now)
  const pixAvailable = store?.paymentAccountStatus === 'VERIFICADA'
  const actor: Actor = { role: 'cliente', name: ctx.customer.name || guestCustomerName }
  async function confirm(event: React.FormEvent) {
    event.preventDefault()
    try { await ctx.choosePayment(order.id, method, actor, method === 'DINHEIRO' && change ? parseMoney(change) : undefined); setError(''); notify(method === 'PIX' ? 'Pix escolhido. Aguardando o pagamento.' : 'Pagamento em dinheiro escolhido.') }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível registrar a escolha.') }
  }
  return <form onSubmit={confirm} className="space-y-3 rounded-2xl border border-accent bg-accent/10 p-4" aria-labelledby={`pagamento-${order.id}`}>
    <h3 id={`pagamento-${order.id}`} className="font-bold">Escolha como vai pagar</h3>
    <p role="timer" className="text-sm font-bold tabular-nums">Tempo para escolher: {clock(left)}</p>
    <fieldset className="grid grid-cols-2 gap-2"><legend className="sr-only">Forma de pagamento</legend>{([['DINHEIRO', 'Dinheiro na entrega'], ['PIX', 'Pix on-line']] as const).map(([value, label]) => {
      const disabled = value === 'PIX' && !pixAvailable
      return <label key={value} className={`flex min-h-11 items-center justify-center rounded-xl border p-3 text-center text-sm font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${method === value ? 'border-primary bg-primary/10 text-primary' : 'bg-card'}`}><input type="radio" name={`payment-${order.id}`} className="sr-only" disabled={disabled} checked={method === value} onChange={() => { setMethod(value); setChange('') }} />{label}</label>
    })}</fieldset>
    {!pixAvailable && <p className="text-xs text-muted-foreground">Esta batedeira ainda não recebe Pix; escolha dinheiro na entrega.</p>}
    {method === 'DINHEIRO' && <label className="block text-sm">Troco para (opcional)<input className="form-field" inputMode="decimal" maxLength={11} value={change} onChange={event => setChange(event.target.value)} placeholder={`Total R$ ${cents(order.totalCents)}`} /></label>}
    <p className="text-sm text-muted-foreground">{method === 'PIX' ? 'Você terá 10 minutos para pagar. O valor vai direto para a conta da batedeira e o pedido só segue para o preparo depois da confirmação.' : 'Você paga em dinheiro ao receber o pedido, e o preparo começa agora.'}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button className="btn-primary w-full" disabled={left === 0}>{method === 'PIX' ? 'Escolher Pix' : 'Confirmar dinheiro na entrega'}</button>
  </form>
}

function PixPending({ order }: { order: Order }) {
  const ctx = useApp()
  const notify = useToast()
  const left = Math.max(0, Date.parse(order.pixDeadline ?? '') - ctx.now)
  return <section className="space-y-2 rounded-2xl border border-accent bg-accent/10 p-4" aria-label="Pagamento por Pix">
    <h3 className="font-bold">Pague R$ {cents(order.totalCents)} com Pix</h3>
    <p role="timer" className="text-sm font-bold tabular-nums">Tempo para pagar: {clock(left)}</p>
    <p className="text-sm text-muted-foreground">A cobrança Pix será gerada pelo provedor de pagamento, que ainda não está integrado a esta versão. Se o prazo terminar sem pagamento, o pedido é encerrado sem custo.</p>
  </section>
}
