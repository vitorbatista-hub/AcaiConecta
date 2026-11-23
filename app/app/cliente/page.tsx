'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bike, Clock, MapPin, Minus, Plus, Search, ShoppingBag } from 'lucide-react'
import { AppFrame, SectionHeading, StatusPill, useToast } from '@/components/app-shell'
import { usePrototype } from '@/components/prototype-provider'
import { Modal } from '@/components/modal'
import { CustomerAccount } from '@/components/customer-account'
import { CustomerOrder } from '@/components/customer-order'
import { QualityCard } from '@/components/quality-card'
import { PixQrCode } from '@/components/pix-qr-code'
import { SupportButton } from '@/components/support-panel'
import { useView } from '@/lib/use-view'
import { maxSavedAddresses, saveAddress } from '@/lib/customer-session'
import { calculateTotals, cents, getFeeText, getSchedule, getStoreAvailabilityText, isStoreOpenNow, isProductOffered, isStoreOrderable, parseMoney, type CartItem, type Product } from '@/lib/mock-data'

type Step = 'cart' | 'account' | 'checkout' | null

export default function ClientePage() {
  const demo = usePrototype()
  const customer = demo.customer
  const router = useRouter()
  useEffect(() => { if (!customer.signedIn) router.replace('/entrar') }, [customer.signedIn, router])
  const notify = useToast()
  const [view, setView] = useView('stores')
  const [search, setSearch] = useState('')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(null)
  const [replacement, setReplacement] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [saveDelivery, setSaveDelivery] = useState(false)
  const [sending, setSending] = useState(false)
  const stores = demo.stores.filter(store => store.adminStatus === 'ATIVA' && store.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))).sort((a, b) => Number(isStoreOpenNow(b)) - Number(isStoreOpenNow(a)))
  const selectedStore = demo.stores.find(store => store.id === storeId)
  const owner = demo.stores.find(store => store.id === customer.storeId)
  const totals = calculateTotals(customer.cart, owner?.deliveryFeeCents ?? 0)
  const orders = demo.orders.filter(order => order.customerId === 'customer-001').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const selectedOrder = view.startsWith('pedido:') ? orders.find(order => order.id === view.slice(7)) : undefined
  const setCart = (cart: CartItem[], selected = customer.storeId) => demo.updateCustomer({ cart, storeId: cart.length ? selected : null, requestId: '' })
  function add(product: Product, replace = false) {
    const store = demo.stores.find(store => store.id === product.storeId)
    if (!store || !isStoreOrderable(store) || !product.active || !product.available) { notify('Produto indisponível no momento.', 'error'); return }
    if (customer.storeId && customer.storeId !== product.storeId && !replace) { setReplacement(product); return }
    if (!customer.cart.length) demo.trackCartStarted()
    const cart = replace ? [] : customer.cart
    const existing = cart.find(item => item.product.id === product.id)
    setCart(existing ? cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...cart, { product, quantity: 1 }], product.storeId)
    setReplacement(null); notify(`${product.name} adicionado à sacola.`)
  }
  function quantity(id: string, delta: number) {
    setCart(customer.cart.map(item => item.product.id === id ? { ...item, quantity: Math.max(0, Math.min(65535, item.quantity + delta)) } : item).filter(item => item.quantity > 0))
  }
  function submit() {
    if (sending) return
    setSending(true); setError('')
    try {
      if (!owner) throw new Error('Escolha uma batedeira antes de enviar.')
      const requestId = customer.requestId || crypto.randomUUID()
      demo.updateCustomer({ requestId })
      // Validate saved-address data before the order is committed.
      const storeAddress = saveDelivery && customer.addresses.length < maxSavedAddresses
      const addresses = storeAddress ? saveAddress(customer.addresses, { ...customer.address, id: crypto.randomUUID(), primary: customer.addresses.length === 0 }) : customer.addresses
      const order = demo.submitOrder({ items: customer.cart, storeId: owner.id, address: customer.address, phone: customer.phone, payment: customer.payment, change: customer.payment === 'DINHEIRO' && customer.change ? parseMoney(customer.change) : undefined, note: customer.note, requestId, fee: totals.deliveryFeeCents })
      if (storeAddress) demo.updateCustomer({ addresses })
      setSaveDelivery(false); setStep(null); setStoreId(null); setView(`pedido:${order.id}`); notify(`Pedido enviado para ${owner.name}.`)
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível enviar. Revise o pedido.') }
    finally { setSending(false) }
  }
  const openCart = () => { setStoreId(null); setError(''); setStep('cart') }
  if (!customer.signedIn) return null
  return <AppFrame profile="cliente"><div className="mx-auto max-w-6xl">
    {view === 'conta' ? <><SectionHeading title="Minha conta" /><CustomerAccount /></> : view === 'pedidos' || view.startsWith('pedido:') ? <>
      <SectionHeading title={selectedOrder ? 'Acompanhe seu pedido' : 'Meus pedidos'} action={<button className="demo-button" onClick={() => setView('stores')}>Ver batedeiras</button>} />
      {selectedOrder ? <><CustomerOrder order={selectedOrder} /><button className="demo-button mt-4" onClick={() => setView('pedidos')}>Todos os pedidos</button></> : <div className="grid gap-4">{orders.length ? orders.map(order => <CustomerOrder key={order.id} order={order} />) : <div className="empty-state"><ShoppingBag className="size-8" aria-hidden /><p className="font-bold text-foreground">Você ainda não enviou pedidos</p><p>Escolha uma batedeira para começar.</p><button className="demo-primary mt-2" onClick={() => setView('stores')}>Ver batedeiras</button></div>}</div>}
    </> : <>
      <SectionHeading eyebrow="Entrega no Centro · Cametá/PA" title="Escolha sua batedeira" description="Açaí tradicional. Mínimo de 1 litro por pedido." action={<button className="demo-primary inline-flex items-center gap-2" onClick={openCart}><ShoppingBag size={18} />Sacola{customer.cart.length > 0 && ` (${customer.cart.reduce((sum, item) => sum + item.quantity, 0)})`}</button>} />
      <div className="mb-5 flex flex-wrap items-center gap-2"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input className="h-11 w-full rounded-xl border bg-card pl-9 pr-3 text-sm" aria-label="Buscar batedeira" placeholder="Buscar batedeira" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="demo-button" onClick={() => setView('pedidos')}>Meus pedidos</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {!stores.length && <div className="empty-state md:col-span-2"><Search className="size-8" aria-hidden /><p className="font-bold text-foreground">Nenhuma batedeira encontrada</p><button className="demo-button mt-2" onClick={() => setSearch('')}>Limpar busca</button></div>}
        {stores.map(store => { const open = isStoreOpenNow(store); return <article key={store.id} className={`group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-lg ${open ? '' : 'opacity-90'}`}><div className="relative"><Image src={store.image || '/placeholder.svg'} width={640} height={320} sizes="(max-width: 768px) 100vw, 50vw" alt={`Foto ilustrativa de açaí tradicional da ${store.name}`} className={`aspect-[2/1] w-full object-cover ${open ? '' : 'grayscale-[40%]'}`} /><div className="absolute left-3 top-3 rounded-full bg-background/90 p-0.5 backdrop-blur"><StatusPill status={open ? 'open' : 'closed'} label={open ? 'Aberta agora' : 'Fechada'} /></div></div><div className="flex flex-1 flex-col p-4"><h2 className="text-lg font-black tracking-tight">{store.name}</h2><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" aria-hidden />{store.address}</p><p className="mt-3 text-sm">{getStoreAvailabilityText(store)}</p><p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{store.estimatedRange}</span><span className="inline-flex items-center gap-1.5"><Bike className="size-4" aria-hidden />{getFeeText(store)}</span></p><button className="demo-primary mt-4 w-full" onClick={() => setStoreId(store.id)}>Ver catálogo</button></div></article> })}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Pagamento em dinheiro ou Pix na entrega, diretamente à batedeira. Fotografias ilustrativas.</p>
    </>}
    {customer.cart.length > 0 && !step && !selectedStore && view !== 'conta' && <div className="sticky bottom-3 z-20 mt-5"><button className="demo-primary flex w-full items-center justify-between gap-3 shadow-lg" onClick={openCart}><span>Ver sacola · {totals.volumeMl} ml</span><span>R$ {cents(totals.totalCents)}</span></button></div>}
    <div className="mt-6"><SupportButton orderId={selectedOrder?.id} /></div>
  </div>
  {selectedStore && <Modal title={selectedStore.name} onClose={() => setStoreId(null)}><div className="mb-4 space-y-2 text-sm"><p>{getStoreAvailabilityText(selectedStore)}</p><p>{selectedStore.address} · Centro, Cametá/PA</p><p>{getFeeText(selectedStore)} · Estimativa {selectedStore.estimatedRange}</p><p>Escolha a qualidade e depois a quantidade. Mínimo de 1 litro por pedido; você pode combinar volumes.</p><details><summary>Horários de funcionamento</summary>{getSchedule(selectedStore).map((hours, index) => <p key={`${hours.day}-${index}`}>{['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][hours.day]}: {hours.active ? `${hours.opens}–${hours.closes}` : 'Fechada'}</p>)}</details></div>
    {!isStoreOrderable(selectedStore) && <p className="mb-4 rounded-xl bg-muted p-3 text-sm">Catálogo disponível para consulta. Novos pedidos estão indisponíveis.</p>}
    <div className="grid gap-3">{Object.values(Object.groupBy(demo.products.filter(product => product.storeId === selectedStore.id && product.active && (product.available || product.showUnavailable) && isProductOffered(product, selectedStore)), product => String(product.grade ?? product.id))).map(group => group && <QualityCard key={`${selectedStore.id}-${group[0].grade ?? group[0].id}-${group.map(p => p.id).join()}`} title={group[0].grade ? `Açaí de ${group[0].grade}` : group[0].name} options={group} canOrder={isStoreOrderable(selectedStore)} onAdd={add} />)}</div>
    {!demo.products.some(product => product.storeId === selectedStore.id && product.active && (product.available || product.showUnavailable)) && <p>Nenhum produto disponível para consulta.</p>}
    {customer.cart.length > 0 && <div role="status" className="sticky bottom-0 mt-4 bg-background pt-3"><button className="demo-primary w-full" onClick={openCart}>Ver sacola · {customer.cart.reduce((sum, item) => sum + item.quantity, 0)} item(ns)</button></div>}
  </Modal>}
  {replacement && <Modal title="Trocar de batedeira?" onClose={() => setReplacement(null)}><p className="mb-5 text-muted-foreground">Cada pedido pertence a uma batedeira. A sacola de <b className="text-foreground">{owner?.name}</b> será substituída.</p><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="demo-button" onClick={() => setReplacement(null)}>Manter sacola</button><button className="demo-primary" onClick={() => add(replacement, true)}>Trocar e adicionar</button></div></Modal>}
  {step === 'cart' && <Modal title="Sua sacola" onClose={() => setStep(null)}>{customer.cart.length ? <>
    <p className="mb-4 font-bold">{owner?.name}</p><div className="grid gap-3">{customer.cart.map(item => <div key={item.product.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{item.product.name}</p><p className="text-sm">R$ {cents(item.product.priceCents)} cada</p></div><div className="flex items-center gap-2"><button className="quantity-button" aria-label={`Diminuir ${item.product.name}`} onClick={() => quantity(item.product.id, -1)}><Minus size={18} /></button><span className="min-w-5 text-center">{item.quantity}</span><button className="quantity-button" aria-label={`Aumentar ${item.product.name}`} disabled={item.quantity >= 65535} onClick={() => quantity(item.product.id, 1)}><Plus size={18} /></button></div></div><label className="mt-3 block text-sm">Observação do item<input className="demo-field" maxLength={300} value={item.note ?? ''} onChange={event => setCart(customer.cart.map(entry => entry.product.id === item.product.id ? { ...entry, note: event.target.value } : entry))} /></label></div>)}</div>
    <dl className="my-4 space-y-1.5 rounded-2xl bg-muted p-4 text-sm tabular-nums"><div className="flex justify-between"><dt>Volume</dt><dd className="font-bold">{totals.volumeMl} ml</dd></div><div className="flex justify-between"><dt>Subtotal</dt><dd>R$ {cents(totals.subtotalCents)}</dd></div><div className="flex justify-between"><dt>Entrega</dt><dd>{totals.deliveryFeeCents ? `R$ ${cents(totals.deliveryFeeCents)}` : 'Grátis'}</dd></div><div className="flex justify-between border-t pt-2 text-lg font-black"><dt>Total</dt><dd>R$ {cents(totals.totalCents)}</dd></div></dl>
    <p role="status" className={`mb-3 rounded-xl px-3 py-2 text-sm font-semibold ${totals.volumeMl < 1000 ? 'bg-accent/20' : 'bg-secondary/15 text-secondary'}`}>{totals.volumeMl < 1000 ? `Faltam ${1000 - totals.volumeMl} ml para atingir o mínimo de 1 litro.` : 'Mínimo de 1 litro atingido.'}</p>
    {owner && !isStoreOrderable(owner) && <p role="alert" className="mb-3 text-sm">A batedeira está indisponível. Sua sacola foi preservada para revisão.</p>}
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button className="demo-button" onClick={() => { setStep(null); setStoreId(customer.storeId) }}>Adicionar outros produtos</button><button className="demo-primary sm:min-w-48" disabled={totals.volumeMl < 1000 || !owner || !isStoreOrderable(owner)} onClick={() => { setError(''); setStep(customer.signedIn ? 'checkout' : 'account') }}>Continuar pedido</button></div>
  </> : <div className="empty-state"><ShoppingBag className="size-8" aria-hidden /><p className="font-bold text-foreground">Sua sacola está vazia</p><p>Abra um catálogo para adicionar produtos.</p></div>}</Modal>}
  {step === 'account' && <Modal title="Acesso para enviar o pedido" onClose={() => setStep('cart')}><CustomerAccount onDone={() => setStep('checkout')} /></Modal>}
  {step === 'checkout' && <Modal title="Revisar e enviar pedido" onClose={() => setStep('cart')}><form className="space-y-4" onSubmit={event => { event.preventDefault(); submit() }}>
    <section className="rounded-xl bg-muted p-4 text-sm"><h3 className="font-bold">{owner?.name}</h3><ul className="mt-2 space-y-1">{customer.cart.map(item => <li key={item.product.id}>{item.quantity} × {item.product.name} · R$ {cents(item.quantity * item.product.priceCents)}{item.note && <p>Observação: {item.note}</p>}</li>)}</ul><p className="mt-3 text-muted-foreground">{totals.volumeMl} ml · Subtotal R$ {cents(totals.subtotalCents)} · Entrega {totals.deliveryFeeCents ? `R$ ${cents(totals.deliveryFeeCents)}` : 'grátis'}</p><p className="mt-1 flex items-baseline justify-between text-lg font-black"><span>Total</span><span className="tabular-nums">R$ {cents(totals.totalCents)}</span></p><p className="text-xs text-muted-foreground">Estimativa: {owner?.estimatedRange}, sem garantia de horário.</p></section>
    <h3 className="border-b pb-1 text-sm font-black uppercase tracking-[0.14em] text-secondary">Entrega</h3>
    {customer.addresses.length > 0 && <label>Usar endereço salvo<select className="demo-field" value="" onChange={event => { const address = customer.addresses.find(item => item.id === event.target.value); if (address) demo.updateCustomer({ address }) }}><option value="">Escolha um endereço</option>{customer.addresses.map(address => <option key={address.id} value={address.id}>{address.street}, {address.number} · {address.primary ? 'Principal' : 'Secundário'}</option>)}</select></label>}
    <label>Rua<input className="demo-field" required maxLength={180} autoComplete="street-address" value={customer.address.street} onChange={event => demo.updateCustomer({ address: { ...customer.address, street: event.target.value } })} /></label>
    <div className="grid grid-cols-2 gap-3"><label>Número<input className="demo-field" required maxLength={20} value={customer.address.number} onChange={event => demo.updateCustomer({ address: { ...customer.address, number: event.target.value } })} /></label><label>Bairro<input className="demo-field" readOnly value="Centro" /></label></div>
    <label>Complemento (opcional)<input className="demo-field" maxLength={100} value={customer.address.complement ?? ''} onChange={event => demo.updateCustomer({ address: { ...customer.address, complement: event.target.value } })} /></label>
    <label>Ponto de referência (opcional)<input className="demo-field" maxLength={255} value={customer.address.reference ?? ''} onChange={event => demo.updateCustomer({ address: { ...customer.address, reference: event.target.value } })} /></label>
    {customer.addresses.length < maxSavedAddresses ? <label className="flex items-center gap-2"><input type="checkbox" checked={saveDelivery} onChange={event => setSaveDelivery(event.target.checked)} />Salvar este endereço para os próximos pedidos</label> : <p className="text-sm text-muted-foreground">Você já tem 2 endereços salvos. Para trocar um deles, edite-o em Minha conta.</p>}
    <h3 className="border-b pb-1 pt-2 text-sm font-black uppercase tracking-[0.14em] text-secondary">Contato e pagamento</h3>
    <label>Telefone com DDD<input className="demo-field" required type="tel" maxLength={20} autoComplete="tel" value={customer.phone} onChange={event => demo.updateCustomer({ phone: event.target.value })} /></label>
    <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-bold">Forma de pagamento</legend><div className="grid grid-cols-2 gap-2">{([['PIX_NA_ENTREGA', 'Pix (QR Code)'], ['DINHEIRO', 'Dinheiro na entrega']] as const).map(([value, label]) => <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border p-3 text-center text-sm font-bold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${customer.payment === value ? 'border-primary bg-primary/10 text-primary' : 'bg-card'}`}><input type="radio" name="payment" className="sr-only" checked={customer.payment === value} onChange={() => demo.updateCustomer({ payment: value, change: '' })} />{label}</label>)}</div></fieldset>
    {customer.payment === 'DINHEIRO' && <label>Troco para (opcional)<input className="demo-field" inputMode="decimal" maxLength={11} value={customer.change} onChange={event => demo.updateCustomer({ change: event.target.value })} placeholder={`Total R$ ${cents(totals.totalCents)}`} /></label>}
    <p className="text-sm text-muted-foreground">{customer.payment === 'PIX_NA_ENTREGA' ? 'Escaneie o QR Code abaixo para pagar o valor do pedido.' : 'Você paga em dinheiro ao receber o pedido. Informe o valor da nota se precisar de troco.'}</p>
    {customer.payment === 'PIX_NA_ENTREGA' && <PixQrCode totalCents={totals.totalCents} storeName={owner?.name ?? 'Batedeira'} />}
    <label>Observação do pedido (opcional)<textarea className="demo-field" maxLength={500} value={customer.note} onChange={event => demo.updateCustomer({ note: event.target.value })} /></label>
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="sticky -bottom-4 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t bg-background px-4 py-3 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-between sm:px-6"><button type="button" className="demo-button" onClick={() => setStep('cart')}>Revisar sacola</button><button disabled={sending} className="demo-primary sm:min-w-56">{sending ? 'Enviando…' : `Enviar pedido · R$ ${cents(totals.totalCents)}`}</button></div>
  </form></Modal>}
  </AppFrame>
}
