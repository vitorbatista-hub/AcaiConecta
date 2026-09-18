'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { adminActorName, allowedProductVolumesMl, appendOrder, applyTransition, createOrderSnapshot, expireOrders, mockOrders, mockProducts, mockStores, predefinedMessages, type Actor, type CartItem, type Order, type OrderStatus, type PaymentMethod, type Product, type Store } from '@/lib/mock-data'

import { emptyCustomerSession, restoreCustomerSession, type AccessRequest, type CustomerSession } from '@/lib/customer-session'

type AuditEvent = { id:string; at:string; author:string; entityId:string; action:string; reason:string }
type DemoState = { version:1; stores:Store[]; products:Product[]; orders:Order[]; audit:AuditEvent[]; customer:CustomerSession; supportEmail:string; customerBlocked:boolean; accessRequests:AccessRequest[]; cartsStarted:number }
type Checkout = { items:CartItem[]; storeId:string; address:Order['address']; phone:string; payment:PaymentMethod; change?:number; note?:string; requestId:string; fee:number }
type PrototypeContextValue = DemoState & {
  now:number
  updateCustomer:(patch:Partial<CustomerSession>)=>void
  configureSupport:(email:string)=>void
  setCustomerBlocked:(blocked:boolean,reason:string)=>void
  requestAccessRecovery:(contact:string,reason:string)=>void
  resolveAccessRequest:(id:string)=>void
  trackCartStarted:()=>void
  submitOrder:(input:Checkout)=>Order
  transition:(id:string,to:OrderStatus,actor:Actor,reason?:string)=>void
  message:(id:string,text:string,actor:Actor)=>void
  updateStore:(store:Store,reason?:string)=>void
  saveProduct:(product:Product)=>void
  reset:()=>void
}
const Context = createContext<PrototypeContextValue|null>(null)
const storageKey='acaiconecta-prototype-v1'
const initialState=():DemoState=>({version:1,stores:structuredClone(mockStores),products:structuredClone(mockProducts),orders:structuredClone(mockOrders),audit:[],customer:emptyCustomerSession(),supportEmail:'',customerBlocked:false,accessRequests:[],cartsStarted:0})

export function PrototypeProvider({children}:{children:React.ReactNode}) {
  const [state,setState]=useState<DemoState>(initialState)
  const current=useRef(state)
  const [ready,setReady]=useState(false)
  const [now,setNow]=useState(0)
  const [storageWarning,setStorageWarning]=useState('')
  function commit(next:DemoState) {
    current.current=next
    setState(next)
    try { sessionStorage.setItem(storageKey,JSON.stringify(next)) }
    catch { setStorageWarning('Armazenamento da sessão indisponível. A simulação será mantida somente enquanto esta página estiver aberta.') }
  }
  useEffect(()=>{
    try {
      const raw=sessionStorage.getItem(storageKey)
      if(raw) {
        const saved=JSON.parse(raw) as DemoState
        if(saved.version!==1 || !Array.isArray(saved.stores) || !Array.isArray(saved.products) || !Array.isArray(saved.orders) || !Array.isArray(saved.audit)) throw new Error('Sessão inválida')
        current.current={...initialState(),...saved,customer:restoreCustomerSession(saved.customer),orders:expireOrders(saved.orders)}
        const migrateImage=(image?:string)=>image?.startsWith('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/')?'/images/acai-tradicional.webp':image
        current.current={...current.current,stores:current.current.stores.map(store=>({...store,image:migrateImage(store.image)??'/placeholder.svg',operatorEmail:store.operatorEmail??''})),products:current.current.products.map(product=>({...product,image:migrateImage(product.image)}))}
        commit(current.current)
      }
    } catch { setStorageWarning('A sessão anterior não pôde ser restaurada. Usando os dados fictícios iniciais.') }
    setReady(true)
    setNow(Date.now())
    const timer=window.setInterval(()=>{
      const time=Date.now()
      setNow(time)
      const previous=current.current
      const orders=expireOrders(previous.orders,time)
      if(orders.some((order,index)=>order!==previous.orders[index])) commit({...previous,orders})
    },1000)
    return ()=>window.clearInterval(timer)
  },[])

  function submitOrder(input:Checkout) {
    const data=current.current
    if(data.customerBlocked) throw new Error('Conta bloqueada. Acesse Ajuda para orientação de recuperação.')
    if(!data.customer.signedIn) throw new Error('Entre na conta de demonstração antes de enviar.')
    const previous=data.orders.find(o=>o.requestId===input.requestId&&o.customerId==='customer-001')
    if(previous) return previous
    const store=data.stores.find(s=>s.id===input.storeId)
    if(!store) throw new Error('Batedeira não encontrada.')
    const items=input.items.map(item=>{
      const product=data.products.find(p=>p.id===item.product.id)
      if(!product) throw new Error('Um produto foi removido. Revise a sacola.')
      if(product.priceCents!==item.product.priceCents||product.volumeMl!==item.product.volumeMl||product.name!==item.product.name) throw new Error('O catálogo mudou. Remova e adicione novamente os itens para revisar os valores.')
      return {...item,product}
    })
    if(input.fee!==store.deliveryFeeCents) throw new Error('A taxa de entrega mudou. Revise o total antes de confirmar.')
    const order={...createOrderSnapshot(items,store,input.address,input.phone,input.payment,input.change,input.note),storeName:store.name}
    commit({...data,orders:appendOrder(data.orders,order,input.requestId),customer:{...data.customer,cart:[],storeId:null,note:'',change:'',requestId:''}})
    return order
  }
  function transition(id:string,to:OrderStatus,actor:Actor,reason?:string) {
    const data=current.current
    const order=data.orders.find(o=>o.id===id)
    if(!order) throw new Error('Pedido não encontrado.')
    const updated=applyTransition(order,to,actor,reason)
    const audit=actor.role==='admin'?[...data.audit,{id:crypto.randomUUID(),at:new Date().toISOString(),author:actor.name,entityId:id,action:'Cancelamento operacional',reason:reason??''}]:data.audit
    commit({...data,audit,orders:data.orders.map(o=>o.id===id?updated:o)})
  }
  function message(id:string,text:string,actor:Actor) {
    const data=current.current
    const order=data.orders.find(o=>o.id===id)
    if(!order) throw new Error('Pedido não encontrado.')
    if(actor.role!=='admin'&&(actor.role!=='operador'||actor.storeId!==order.storeId)) throw new Error('Perfil sem permissão para esta ação.')
    if(!text.trim()||text.length>500) throw new Error('Informe uma intervenção de até 500 caracteres.')
    if(actor.role==='operador'&&!predefinedMessages.includes(text)) throw new Error('Escolha uma mensagem predefinida.')
    const at=new Date().toISOString()
    const updated={...order,timeline:[...order.timeline,{to:order.status,at,author:actor.name,message:text}]}
    const audit=actor.role==='admin'?[...data.audit,{id:crypto.randomUUID(),at,author:actor.name,entityId:id,action:'Intervenção administrativa',reason:text}]:data.audit
    commit({...data,audit,orders:data.orders.map(o=>o.id===id?updated:o)})
  }
  function updateStore(store:Store,reason?:string) {
    const data=current.current
    const existing=data.stores.find(s=>s.id===store.id)
    if(!store.name.trim()||!store.operator.trim()||!store.address.trim()) throw new Error('Informe nome, endereço e operador responsável.')
    if(!store.operatorEmail?.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.operatorEmail.trim())) throw new Error('Informe um e-mail válido para o login do operador.')
    if(data.stores.some(s=>s.id!==store.id&&s.operatorEmail.toLowerCase()===store.operatorEmail.trim().toLowerCase())) throw new Error('Já existe um operador cadastrado com este e-mail.')
    if(store.schedule?.some(h=>!Number.isInteger(h.day)||h.day<0||h.day>6||!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes)||h.opens>=h.closes)) throw new Error('Revise os horários: o fechamento deve ser após a abertura, no mesmo dia.')
    if(!Number.isSafeInteger(store.deliveryFeeCents)||store.deliveryFeeCents<0) throw new Error('Informe uma taxa válida em centavos.')
    if((!existing||existing.adminStatus!==store.adminStatus)&&!reason?.trim()) throw new Error('Informe o motivo administrativo.')
    const audit=reason?[...data.audit,{id:crypto.randomUUID(),at:new Date().toISOString(),author:adminActorName,entityId:store.id,action:existing?'Alteração da batedeira':'Cadastro assistido',reason}]:data.audit
    const normalized={...store,operatorEmail:store.operatorEmail.trim()}
    commit({...data,audit,stores:existing?data.stores.map(s=>s.id===store.id?normalized:s):[...data.stores,normalized]})
  }
  function saveProduct(product:Product) {
    if(!product.name.trim()||product.name.length>150||!(allowedProductVolumesMl as readonly number[]).includes(product.volumeMl)||!Number.isSafeInteger(product.priceCents)||product.priceCents<1) throw new Error('Informe nome, um dos tamanhos padrão (500 ml ou 1.000 ml) e preço maior que zero.')
    const data=current.current
    const updated={...product,updatedAt:new Date().toISOString()}
    commit({...data,products:data.products.some(p=>p.id===product.id)?data.products.map(p=>p.id===product.id?updated:p):[...data.products,updated]})
  }
  function updateCustomer(patch:Partial<CustomerSession>) {
    if(patch.signedIn && current.current.customerBlocked) throw new Error('Conta bloqueada. Procure o suporte do piloto.')
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
  const value={...state,now,updateCustomer,configureSupport,setCustomerBlocked,requestAccessRecovery,resolveAccessRequest,trackCartStarted,submitOrder,transition,message,updateStore,saveProduct,reset:()=>commit(initialState())}
  return <Context.Provider value={value}>{storageWarning&&<p role="alert" className="bg-accent/20 p-3 text-sm">{storageWarning}</p>}{ready?children:<p role="status" className="p-8">Carregando demonstração…</p>}</Context.Provider>
}
export function usePrototype() {
  const context=useContext(Context)
  if(!context) throw new Error('PrototypeProvider ausente.')
  return context
}
