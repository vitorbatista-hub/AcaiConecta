'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getSchedule, type Actor, type CartItem, type AdminStatus, type Order, type OrderStatus, type PaymentMethod, type Product, type Store } from '@/lib/domain'
import { usePathname } from 'next/navigation'
import { parseRange } from '@/lib/store-rules'

import { emptyCustomerSession, restoreCustomerSession, type CustomerSession } from '@/lib/customer-session'

type AuditEvent = { id:string; at:string; author:string; entityId:string; action:string; reason:string }
type AppState = { version:4; stores:Store[]; products:Product[]; serverAudit:AuditEvent[]; orders:Order[]; customer:CustomerSession; supportEmail:string }
type Checkout = { items:CartItem[]; storeId:string; address:Order['address']; phone:string; note?:string; requestId:string; fee:number }
type AppContextValue = AppState & {
  audit:AuditEvent[]
  now:number
  updateCustomer:(patch:Partial<CustomerSession>)=>void
  /** Administrador: define ou remove o e-mail de suporte (servidor, com auditoria). */
  configureSupport:(email:string)=>Promise<void>
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
const initialState=():AppState=>({version:4,stores:[],products:[],serverAudit:[],orders:[],customer:emptyCustomerSession(),supportEmail:''})

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
    // O restante vem da API: no navegador ficam só a sacola e o pedido em andamento.
    try { sessionStorage.setItem(storageKey,JSON.stringify({version:next.version,customer:next.customer})) }
    catch { setStorageWarning('Armazenamento da sessão indisponível. Seus dados serão mantidos somente enquanto esta página estiver aberta.') }
  }
  useEffect(()=>{
    try {
      const raw=sessionStorage.getItem(storageKey)
      if(raw) {
        const saved=JSON.parse(raw) as Partial<AppState>
        // Versões antigas (que guardavam catálogo no navegador) são descartadas sem aviso: o catálogo agora vem do servidor.
        if(saved.version===4) {
          current.current={...initialState(),customer:restoreCustomerSession(saved.customer)}
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
  async function refreshSupport() {
    try {
      const response=await fetch('/api/suporte',{cache:'no-store'})
      const data=response.ok?await response.json() as {email:string}:{email:''}
      current.current={...current.current,supportEmail:data.email}
      setState(current.current)
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
    void refreshSupport()
    const onFocus=()=>{ void refreshCatalog(); void refreshSupport() }
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
    commit({...current.current,customer:{...current.current.customer,...patch}})
  }
  async function configureSupport(email:string) {
    await send('/api/admin/suporte','PUT',{email})
    await refreshSupport()
  }
  const value={...state,now,updateCustomer,configureSupport,submitOrder,transition,choosePayment,message,refreshOrders,saveStoreSettings,changeStoreStatus,saveProduct,refreshCatalog,audit:state.serverAudit}
  return <Context.Provider value={value}>{storageWarning&&<p role="alert" className="bg-accent/20 p-3 text-sm">{storageWarning}</p>}{ready?children:<p role="status" className="p-8">Carregando…</p>}</Context.Provider>
}
export function useApp() {
  const context=useContext(Context)
  if(!context) throw new Error('AppProvider ausente.')
  return context
}
