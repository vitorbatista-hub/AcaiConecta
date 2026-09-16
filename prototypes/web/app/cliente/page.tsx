'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Minus, Plus, Search, ShoppingBag } from 'lucide-react'
import { AppFrame, DemoNotice, SectionHeading, StatusPill, useToast } from '@/components/app-shell'
import { usePrototype } from '@/components/prototype-provider'
import { Modal } from '@/components/modal'
import { CustomerAccount } from '@/components/customer-account'
import { CustomerOrder } from '@/components/customer-order'
import { SupportButton } from '@/components/support-panel'
import { useView } from '@/lib/use-view'
import { saveAddress } from '@/lib/customer-session'
import { calculateTotals, cents, getFeeText, getSchedule, getStoreAvailabilityText, isStoreOpenNow, isStoreOrderable, parseMoney, type CartItem, type Product } from '@/lib/mock-data'

type Step = 'cart' | 'account' | 'checkout' | null

export default function ClientePage() {
  const demo = usePrototype()
  const customer = demo.customer
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
      const addresses = saveDelivery ? saveAddress(customer.addresses, { ...customer.address, id: crypto.randomUUID(), primary: customer.addresses.length === 0 }) : customer.addresses
      const order = demo.submitOrder({ items: customer.cart, storeId: owner.id, address: customer.address, phone: customer.phone, payment: customer.payment, change: customer.payment === 'DINHEIRO' && customer.change ? parseMoney(customer.change) : undefined, note: customer.note, requestId, fee: totals.deliveryFeeCents })
      if (saveDelivery) demo.updateCustomer({ addresses })
      setSaveDelivery(false); setStep(null); setStoreId(null); setView(`pedido:${order.id}`); notify(`Pedido enviado para ${owner.name}.`)
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível enviar. Revise o pedido.') }
    finally { setSending(false) }
  }
  const openCart = () => { setStoreId(null); setError(''); setStep('cart') }
  return <AppFrame profile="cliente"><div className="mx-auto max-w-6xl">
    <DemoNotice>Dados fictícios · Pedidos e acesso simulados.</DemoNotice>
    {view === 'conta' ? <><SectionHeading title="Minha conta" /><CustomerAccount /></> : view === 'pedidos' || view.startsWith('pedido:') ? <>
      <SectionHeading title={selectedOrder ? 'Acompanhe seu pedido' : 'Meus pedidos'} action={<button className="demo-button" onClick={() => setView('stores')}>Ver batedeiras</button>} />
      {selectedOrder ? <><CustomerOrder order={selectedOrder} /><button className="demo-button mt-4" onClick={() => setView('pedidos')}>Todos os pedidos</button></> : <div className="grid gap-4">{orders.length ? orders.map(order => <CustomerOrder key={order.id} order={order} />) : <p className="rounded-2xl border p-6">Você ainda não enviou pedidos. Escolha uma batedeira para começar.</p>}</div>}
    </> : <>
      <SectionHeading eyebrow="Entrega no Centro · Cametá/PA" title="Escolha sua batedeira" description="Açaí tradicional. Mínimo de 1 litro por pedido." action={<button className="demo-primary inline-flex items-center gap-2" onClick={openCart}><ShoppingBag size={18} />Sacola{customer.cart.length > 0 && ` (${customer.cart.reduce((sum, item) => sum + item.quantity, 0)})`}</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input className="h-11 w-full rounded-xl border bg-card pl-9 pr-3 text-sm" aria-label="Buscar batedeira" placeholder="Buscar batedeira" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="demo-button" onClick={() => setView('pedidos')}>Meus pedidos</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {!stores.length && <div className="rounded-2xl border p-5"><p>Nenhuma batedeira encontrada.</p><button className="demo-button mt-3" onClick={() => setSearch('')}>Limpar busca</button></div>}
        {stores.map(store => <article key={store.id} className="overflow-hidden rounded-2xl border bg-card"><div className="flex gap-3 p-4"><Image src={store.image || '/placeholder.svg'} width={112} height={112} sizes="112px" alt="Açaí tradicional; imagem ilustrativa" className="size-24 shrink-0 rounded-xl object-cover sm:size-28" /><div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{store.name}</h2><p className="mt-1 text-xs text-muted-foreground">{store.address}</p><div className="mt-2"><StatusPill status={isStoreOpenNow(store) ? 'open' : 'closed'} label={isStoreOpenNow(store) ? 'Aberta agora' : 'Fechada'} /></div></div></div><div className="px-4 pb-4"><p className="text-sm">{getStoreAvailabilityText(store)}</p><p className="mt-1 text-sm text-muted-foreground">{store.estimatedRange} · {getFeeText(store)}</p><button className="demo-primary mt-3 w-full" onClick={() => setStoreId(store.id)}>Ver catálogo</button></div></article>)}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Pagamento em dinheiro ou Pix na entrega, diretamente à batedeira. Fotografias ilustrativas.</p>
    </>}
    {customer.cart.length > 0 && !step && !selectedStore && view !== 'conta' && <div className="sticky bottom-3 z-20 mt-5"><button className="demo-primary flex w-full items-center justify-between gap-3 shadow-lg" onClick={openCart}><span>Ver sacola · {totals.volumeMl} ml</span><span>R$ {cents(totals.totalCents)}</span></button></div>}
    <div className="mt-6"><SupportButton /></div>
  </div>
  {selectedStore && <Modal title={selectedStore.name} onClose={() => setStoreId(null)}><div className="mb-4 space-y-2 text-sm"><p>{getStoreAvailabilityText(selectedStore)}</p><p>{selectedStore.address} · Centro, Cametá/PA</p><p>{getFeeText(selectedStore)} · Estimativa {selectedStore.estimatedRange}</p><p>Mínimo de 1 litro por pedido. Você pode combinar volumes.</p><details><summary>Horários de funcionamento</summary>{getSchedule(selectedStore).map((hours, index) => <p key={`${hours.day}-${index}`}>{['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][hours.day]}: {hours.active ? `${hours.opens}–${hours.closes}` : 'Fechada'}</p>)}</details></div>
    {!isStoreOrderable(selectedStore) && <p className="mb-4 rounded-xl bg-muted p-3 text-sm">Catálogo disponível para consulta. Novos pedidos estão indisponíveis.</p>}
    <div className="grid gap-3">{demo.products.filter(product => product.storeId === selectedStore.id && product.active && (product.available || product.showUnavailable)).map(product => <article key={product.id} className="flex gap-3 rounded-xl border p-3"><Image src={product.image || '/placeholder.svg'} width={80} height={80} sizes="80px" alt={product.name} className="size-16 shrink-0 rounded-lg object-cover sm:size-20" /><div className="min-w-0 flex-1"><h3 className="font-bold">{product.name}</h3><p className="text-sm">{product.volumeMl} ml · R$ {cents(product.priceCents)}</p><p className="mt-1 text-xs text-muted-foreground">{product.description}</p><button className="demo-primary mt-2" disabled={!product.available || !isStoreOrderable(selectedStore)} onClick={() => add(product)}>{product.available ? 'Adicionar' : 'Indisponível'}</button></div></article>)}</div>
    {!demo.products.some(product => product.storeId === selectedStore.id && product.active && (product.available || product.showUnavailable)) && <p>Nenhum produto disponível para consulta.</p>}
    {customer.cart.length > 0 && <div role="status" className="sticky bottom-0 mt-4 bg-background pt-3"><button className="demo-primary w-full" onClick={openCart}>Ver sacola · {customer.cart.reduce((sum, item) => sum + item.quantity, 0)} item(ns)</button></div>}
  </Modal>}
  {replacement && <Modal title="Trocar de batedeira?" onClose={() => setReplacement(null)}><p className="mb-4">Cada pedido pertence a uma batedeira. A sacola de {owner?.name} será substituída.</p><div className="flex flex-wrap gap-2"><button className="demo-button" onClick={() => setReplacement(null)}>Manter sacola</button><button className="demo-primary" onClick={() => add(replacement, true)}>Trocar e adicionar</button></div></Modal>}
  {step === 'cart' && <Modal title="Sua sacola" onClose={() => setStep(null)}>{customer.cart.length ? <>
    <p className="mb-4 font-bold">{owner?.name}</p><div className="grid gap-3">{customer.cart.map(item => <div key={item.product.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{item.product.name}</p><p className="text-sm">R$ {cents(item.product.priceCents)} cada</p></div><div className="flex items-center gap-2"><button className="quantity-button" aria-label={`Diminuir ${item.product.name}`} onClick={() => quantity(item.product.id, -1)}><Minus size={18} /></button><span className="min-w-5 text-center">{item.quantity}</span><button className="quantity-button" aria-label={`Aumentar ${item.product.name}`} disabled={item.quantity >= 65535} onClick={() => quantity(item.product.id, 1)}><Plus size={18} /></button></div></div><label className="mt-3 block text-sm">Observação do item<input className="demo-field" maxLength={300} value={item.note ?? ''} onChange={event => setCart(customer.cart.map(entry => entry.product.id === item.product.id ? { ...entry, note: event.target.value } : entry))} /></label></div>)}</div>
    <div className="my-4 space-y-1 rounded-xl bg-muted p-4 text-sm"><p>Volume: <b>{totals.volumeMl} ml</b></p><p>Subtotal: R$ {cents(totals.subtotalCents)} · Entrega: R$ {cents(totals.deliveryFeeCents)}</p><p className="text-lg font-bold">Total: R$ {cents(totals.totalCents)}</p></div>
    <p role="status" className="mb-3 text-sm">{totals.volumeMl < 1000 ? `Faltam ${1000 - totals.volumeMl} ml para atingir o mínimo de 1 litro.` : 'Mínimo de 1 litro atingido.'}</p>
    {owner && !isStoreOrderable(owner) && <p role="alert" className="mb-3 text-sm">A batedeira está indisponível. Sua sacola foi preservada para revisão.</p>}
    <div className="flex flex-wrap gap-2"><button className="demo-button" onClick={() => { setStep(null); setStoreId(customer.storeId) }}>Adicionar outros produtos</button><button className="demo-primary" disabled={totals.volumeMl < 1000 || !owner || !isStoreOrderable(owner)} onClick={() => { setError(''); setStep(customer.signedIn ? 'checkout' : 'account') }}>Continuar pedido</button></div>
  </> : <p className="py-6">Sua sacola está vazia. Abra um catálogo para adicionar produtos.</p>}</Modal>}
  {step === 'account' && <Modal title="Acesso para enviar o pedido" onClose={() => setStep('cart')}><CustomerAccount onDone={() => setStep('checkout')} /></Modal>}
  {step === 'checkout' && <Modal title="Revisar e enviar pedido" onClose={() => setStep('cart')}><form className="space-y-4" onSubmit={event => { event.preventDefault(); submit() }}>
    <section className="rounded-xl bg-muted p-4 text-sm"><h3 className="font-bold">{owner?.name}</h3><ul className="mt-2 space-y-1">{customer.cart.map(item => <li key={item.product.id}>{item.quantity} × {item.product.name} · R$ {cents(item.quantity * item.product.priceCents)}{item.note && <p>Observação: {item.note}</p>}</li>)}</ul><p className="mt-3">{totals.volumeMl} ml · Subtotal R$ {cents(totals.subtotalCents)} · Entrega R$ {cents(totals.deliveryFeeCents)}</p><p className="mt-1 text-lg font-bold">Total R$ {cents(totals.totalCents)}</p><p>Estimativa: {owner?.estimatedRange}</p></section>
    {customer.addresses.length > 0 && <label>Usar endereço salvo<select className="demo-field" value="" onChange={event => { const address = customer.addresses.find(item => item.id === event.target.value); if (address) demo.updateCustomer({ address }) }}><option value="">Escolha um endereço</option>{customer.addresses.map(address => <option key={address.id} value={address.id}>{address.street}, {address.number}{address.primary ? ' · Principal' : ''}</option>)}</select></label>}
    <label>Rua<input className="demo-field" required maxLength={180} autoComplete="street-address" value={customer.address.street} onChange={event => demo.updateCustomer({ address: { ...customer.address, street: event.target.value } })} /></label>
    <div className="grid grid-cols-2 gap-3"><label>Número<input className="demo-field" required maxLength={20} value={customer.address.number} onChange={event => demo.updateCustomer({ address: { ...customer.address, number: event.target.value } })} /></label><label>Bairro<input className="demo-field" readOnly value="Centro" /></label></div>
    <label>Complemento (opcional)<input className="demo-field" maxLength={100} value={customer.address.complement ?? ''} onChange={event => demo.updateCustomer({ address: { ...customer.address, complement: event.target.value } })} /></label>
    <label>Ponto de referência (opcional)<input className="demo-field" maxLength={255} value={customer.address.reference ?? ''} onChange={event => demo.updateCustomer({ address: { ...customer.address, reference: event.target.value } })} /></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={saveDelivery} onChange={event => setSaveDelivery(event.target.checked)} />Salvar este endereço nesta demonstração</label>
    <label>Telefone com DDD<input className="demo-field" required type="tel" maxLength={20} autoComplete="tel" value={customer.phone} onChange={event => demo.updateCustomer({ phone: event.target.value })} /></label>
    <label>Forma de pagamento<select className="demo-field" value={customer.payment} onChange={event => demo.updateCustomer({ payment: event.target.value === 'PIX' ? 'PIX' : 'DINHEIRO', change: '' })}><option value="PIX">Pix na entrega</option><option value="DINHEIRO">Dinheiro na entrega</option></select></label>
    {customer.payment === 'DINHEIRO' && <label>Troco para (opcional)<input className="demo-field" inputMode="decimal" maxLength={11} value={customer.change} onChange={event => demo.updateCustomer({ change: event.target.value })} placeholder={`Total R$ ${cents(totals.totalCents)}`} /></label>}
    <p className="text-sm text-muted-foreground">{customer.payment === 'PIX' ? 'Transfira o Pix diretamente à batedeira na entrega. Não pague antecipadamente pelo protótipo.' : 'Pague em dinheiro na entrega. Informe o valor da nota se precisar de troco.'}</p>
    <label>Observação do pedido (opcional)<textarea className="demo-field" maxLength={500} value={customer.note} onChange={event => demo.updateCustomer({ note: event.target.value })} /></label>
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className="demo-button" onClick={() => setStep('cart')}>Revisar sacola</button><button disabled={sending} className="demo-primary">{sending ? 'Enviando…' : `Enviar pedido · R$ ${cents(totals.totalCents)}`}</button></div>
  </form></Modal>}
  </AppFrame>
}
