'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { adminActorName, getSchedule, type Actor, type CartItem, type AdminStatus, type Order, type OrderStatus, type PaymentMethod, type Product, type Store } from '@/lib/domain'
import { usePathname } from 'next/navigation'
import { parseRange } from '@/lib/store-rules'

import { emptyCustomerSession, restoreCustomerSession, type AccessRequest, type CustomerSession } from '@/lib/customer-session'

type AuditEvent = { id:string; at:string; author:string; entityId:string; action:string; reason:string }
type AppState = { version:4; stores:Store[]; products:Product[]; serverAudit:AuditEvent[]; orders:Order[]; audit:AuditEvent[]; customer:CustomerSession; supportEmail:string; customerBlocked:boolean; accessRequests:AccessRequest[]; cartsStarted:number }
type Checkout = { items:CartItem[]; storeId:string; address:Order['address']; phone:string; note?:string; requestId:string; fee:number }
type AppContextValue = AppState & {
  now:number
  updateCustomer:(patch:Partial<CustomerSession>)=>void
  configureSupport:(email:string)=>void
  setCustomerBlocked:(blocked:boolean,reason:string)=>void
  requestAccessRecovery:(contact:string,reason:string)=>void
  resolveAccessRequest:(id:string)=>void
  trackCartStarted:()=>void
  /** Pedidos ficam no servidor: o preço e a taxa são recalculados lá. O `actor` é só para a interface; o servidor usa a sessão. */
  submitOrder:(input:Checkout)=>Promise<Order>
  transition:(id:string,to:OrderStatus,actor:Actor,reason?:string)=>Promise<void>
  choosePayment:(id:string,method:PaymentMethod,actor:Actor,change?:number)=>Promise<void>
  message:(id:string,text:string,actor:Actor)=>Promise<void>
  refreshOrders:()=>Promise<void>
  /** Operador: salva abertura, entrega, faixa, bairros atendidos e horários da própria batedeira (servidor). */
  saveStoreSettings:(store:Store)=>Promise<void>
  /** Administrador: altera a situação da batedeira, com motivo e auditoria (servidor). */
  changeStoreStatus:(id:string,status:AdminStatus,reason:string,eligibilityConfirmed:boolean)=>Promise<void>
  saveProduct:(product:Product)=>Promise<void>
  refreshCatalog:()=>Promise<void>
}
const Context = createContext<AppContextValue|null>(null)
const storageKey='acaiconecta-state-v1'
const initialState=():AppState=>({version:4,stores:[],products:[],serverAudit:[],orders:[],audit:[],customer:emptyCustomerSession(),supportEmail:'',customerBlocked:false,accessRequests:[],cartsStarted:0})

export function AppProvider({children}:{children:React.ReactNode}) {
  const [state,setState]=useState<AppState>(initialState)
  const current=useRef(state)
  const [ready,setReady]=useState(false)
  const [now,setNow]=useState(0)
  const [storageWarning,setStorageWarning]=useState('')
  const pathname=usePathname()
  function commit(next:AppState) {
    current.current=next
    setState(next)
    // Batedeiras, produtos e auditoria do servidor vêm da API: não são guardados no navegador.
    const { stores:_stores, products:_products, serverAudit:_serverAudit, orders:_orders, ...persisted }=next
    try { sessionStorage.setItem(storageKey,JSON.stringify(persisted)) }
    catch { setStorageWarning('Armazenamento da sessão indisponível. Seus dados serão mantidos somente enquanto esta página estiver aberta.') }
  }
  useEffect(()=>{
    try {
      const raw=sessionStorage.getItem(storageKey)
      if(raw) {
        const saved=JSON.parse(raw) as Partial<AppState>
        // Versões antigas (que guardavam catálogo no navegador) são descartadas sem aviso: o catálogo agora vem do servidor.
        if(saved.version===4) {
          if(!Array.isArray(saved.audit)) throw new Error('Sessão inválida')
          current.current={...initialState(),...saved,stores:[],products:[],serverAudit:[],orders:[],customer:restoreCustomerSession(saved.customer)}
          commit(current.current)
        }
      }
    } catch { setStorageWarning('Não foi possível restaurar a sessão anterior. Os dados iniciais foram carregados novamente.') }
    setReady(true)
    setNow(Date.now())
    const timer=window.setInterval(()=>{
      setNow(Date.now())
    },1000)
    return ()=>window.clearInterval(timer)
  },[])

  async function refreshCatalog() {
    try {
      const response=await fetch('/api/catalogo',{cache:'no-store'})
      const data=response.ok?await response.json() as {stores:Store[];products:Product[];audit:AuditEvent[]}:{stores:[],products:[],audit:[]}
      const next={...current.current,stores:data.stores,products:data.products,serverAudit:data.audit}
      current.current=next
      setState(next)
    } catch { /* sem rede: mantém o que já está na tela */ }
  }
  async function refreshOrders() {
    try {
      const response=await fetch('/api/pedidos',{cache:'no-store'})
      if(!response.ok) { if(current.current.orders.length) { current.current={...current.current,orders:[]}; setState(current.current) } return }
      const data=await response.json() as {orders:Order[]}
      current.current={...current.current,orders:data.orders}
      setState(current.current)
    } catch { /* sem rede: mantém o que já está na tela */ }
  }
  // Pedidos: leitura ao abrir cada área e a cada 5 s com a aba visível (tempo real por SSE vem na etapa 6 da ADR-006).
  useEffect(()=>{
    if(!ready||!/^\/(cliente|operador|admin)(\/|$)/.test(pathname)) return
    void refreshOrders()
    const timer=window.setInterval(()=>{ if(document.visibilityState==='visible') void refreshOrders() },5000)
    const onFocus=()=>void refreshOrders()
    window.addEventListener('focus',onFocus)
    return ()=>{ window.clearInterval(timer); window.removeEventListener('focus',onFocus) }
  },[ready,pathname])
  // Lê o catálogo do servidor ao abrir e a cada troca de página (depois do login, por exemplo) e ao voltar para a aba.
  useEffect(()=>{
    if(!ready) return
    void refreshCatalog()
    const onFocus=()=>void refreshCatalog()
    window.addEventListener('focus',onFocus)
    return ()=>window.removeEventListener('focus',onFocus)
  },[ready,pathname])

  async function post<T>(url:string,body:unknown):Promise<T> {
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data=await response.json().catch(()=>({})) as T&{error?:string}
    if(!response.ok) throw new Error(data.error??'Não foi possível concluir. Tente novamente.')
    return data
  }
  async function submitOrder(input:Checkout) {
    const data=current.current
    if(data.customerBlocked) throw new Error('Conta bloqueada. Acesse Ajuda para orientação de recuperação.')
    if(!data.customer.signedIn) throw new Error('Entre na sua conta antes de enviar o pedido.')
    const { order }=await post<{order:Order}>('/api/pedidos',{storeId:input.storeId,requestId:input.requestId,phone:input.phone,note:input.note,address:input.address,feeCents:input.fee,items:input.items.map(item=>({productId:item.product.id,quantity:item.quantity,note:item.note,unitPriceCents:item.product.priceCents}))})
    const next={...current.current,orders:[order,...current.current.orders.filter(o=>o.id!==order.id)],customer:{...current.current.customer,cart:[],storeId:null,note:'',requestId:''}}
    commit(next)
    return order
  }
  async function transition(id:string,to:OrderStatus,actor:Actor,reason?:string) {
    await post(`/api/pedidos/${encodeURIComponent(id)}/transicao`,{to,reason})
    await refreshOrders()
    if(actor.role==='admin') await refreshCatalog()
  }
  async function choosePayment(id:string,method:PaymentMethod,_actor:Actor,change?:number) {
    await post(`/api/pedidos/${encodeURIComponent(id)}/pagamento`,{method,changeForCents:change})
    await refreshOrders()
  }
  async function message(id:string,text:string,actor:Actor) {
    await post(`/api/pedidos/${encodeURIComponent(id)}/mensagem`,{text})
    await refreshOrders()
    if(actor.role==='admin') await refreshCatalog()
  }
  async function send(url:string,method:string,body:unknown) {
    const response=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data=await response.json().catch(()=>({})) as {error?:string}
    if(!response.ok) throw new Error(data.error??'Não foi possível salvar. Tente novamente.')
    await refreshCatalog()
  }
  async function saveStoreSettings(store:Store) {
    const estimate=parseRange(store.estimatedRange)
    if(!estimate) throw new Error('Informe uma faixa válida, com máximo maior ou igual ao mínimo.')
    const coverage=store.coverage.map(c=>({neighborhood:c.neighborhood,feeCents:c.feeCents,...(parseRange(c.estimatedRange)??{min:0,max:0})}))
    await send('/api/operador/loja','PUT',{isOpen:store.isOpen,deliveryAvailable:store.deliveryAvailable,estimate,coverage,schedule:getSchedule(store)})
  }
  async function changeStoreStatus(id:string,status:AdminStatus,reason:string,eligibilityConfirmed:boolean) {
    await send('/api/admin/batedeiras/situacao','POST',{id,status,reason,eligibilityConfirmed})
  }
  async function saveProduct(product:Product) {
    await send('/api/operador/produtos','POST',{id:product.id,name:product.name,description:product.description??'',volumeMl:product.volumeMl,priceCents:product.priceCents,active:product.active,available:product.available,showUnavailable:product.showUnavailable})
  }
  function updateCustomer(patch:Partial<CustomerSession>) {
    if(patch.signedIn && current.current.customerBlocked) throw new Error('Conta bloqueada. Procure o suporte do AçaíConecta.')
    commit({...current.current,customer:{...current.current.customer,...patch}})
  }
  function configureSupport(email:string) {
    const value=email.trim()
    if(value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Informe um e-mail válido para o suporte.')
    const event={id:crypto.randomUUID(),at:new Date().toISOString(),author:adminActorName,entityId:'pilot',action:'Contato de suporte atualizado',reason:value?'Canal de atendimento configurado':'Canal removido'}
    commit({...current.current,supportEmail:value,audit:[...current.current.audit,event]})
  }
  function setCustomerBlocked(blocked:boolean,reason:string) {
    if(!reason.trim()) throw new Error('Informe o motivo administrativo.')
    const event={id:crypto.randomUUID(),at:new Date().toISOString(),author:adminActorName,entityId:'customer-001',action:blocked?'Bloqueio de conta':'Reativação de conta',reason:reason.trim()}
    commit({...current.current,customerBlocked:blocked,customer:{...current.current.customer,signedIn:blocked?false:current.current.customer.signedIn},audit:[...current.current.audit,event]})
  }
  function requestAccessRecovery(contact:string,reason:string) {
    if(!contact.trim()||!reason.trim()) throw new Error('Informe um contato e o motivo da solicitação.')
    if(contact.length>254||reason.length>255) throw new Error('Revise o tamanho dos campos.')
    const request:AccessRequest={id:crypto.randomUUID(),contact:contact.trim(),reason:reason.trim(),createdAt:new Date().toISOString(),resolved:false}
    commit({...current.current,accessRequests:[request,...current.current.accessRequests]})
  }
  function resolveAccessRequest(id:string) {
    const data=current.current
    const request=data.accessRequests.find(item=>item.id===id)
    if(!request) throw new Error('Solicitação não encontrada.')
    if(request.resolved) throw new Error('Solicitação já concluída.')
    const at=new Date().toISOString()
    const event={id:crypto.randomUUID(),at,author:adminActorName,entityId:'customer-001',action:'Recuperação de acesso concedida',reason:`Solicitação de ${request.contact}: ${request.reason}`}
    commit({...data,customerBlocked:false,accessRequests:data.accessRequests.map(item=>item.id===id?{...item,resolved:true,resolvedAt:at}:item),audit:[...data.audit,event]})
  }
  function trackCartStarted() {
    if(!current.current.customer.cart.length) commit({...current.current,cartsStarted:current.current.cartsStarted+1})
  }
  const value={...state,now,updateCustomer,configureSupport,setCustomerBlocked,requestAccessRecovery,resolveAccessRequest,trackCartStarted,submitOrder,transition,choosePayment,message,refreshOrders,saveStoreSettings,changeStoreStatus,saveProduct,refreshCatalog,audit:[...state.serverAudit,...state.audit].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))}
  return <Context.Provider value={value}>{storageWarning&&<p role="alert" className="bg-accent/20 p-3 text-sm">{storageWarning}</p>}{ready?children:<p role="status" className="p-8">Carregando…</p>}</Context.Provider>
}
export function useApp() {
  const context=useContext(Context)
  if(!context) throw new Error('AppProvider ausente.')
  return context
}
