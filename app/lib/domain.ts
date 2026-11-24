export type AdminStatus = 'EM_ANALISE' | 'ATIVA' | 'SUSPENSA' | 'DESATIVADA'
export type OrderStatus = 'AGUARDANDO_ACEITE' | 'ACEITO' | 'EM_PREPARO' | 'PRONTO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO' | 'FALHA_NA_ENTREGA'
export type PaymentMethod = 'DINHEIRO' | 'PIX_NA_ENTREGA'
export type Product = { id:string; grade?:number; storeId:string; name:string; description?:string; image?:string; volumeMl:number; priceCents:number; active:boolean; available:boolean; showUnavailable:boolean; updatedAt?:string }
export type OpeningHours = { day:number; opens:string; closes:string; active:boolean }
export type Store = { id:string; name:string; owner:string; operator:string;  address:string; neighborhood:'Centro'; image:string; adminStatus:AdminStatus; isOpen:boolean; deliveryAvailable:boolean; accepts500ml:boolean; pixKey?:string; document?:string; hours:string; schedule?:OpeningHours[]; nextOpening?:string; estimatedRange:string; deliveryFeeCents:number; createdAt:string }
export type OrderItem = { productId:string; name:string; quantity:number; volumeMl:number; unitPriceCents:number; note?:string }
export type TimelineEvent = { from?:OrderStatus; to:OrderStatus; at:string; author:string; reason?:string; message?:string }
export type Order = { id:string; requestId?:string; customerId:string; storeId:string; storeName?:string; items:OrderItem[]; subtotalCents:number; deliveryFeeCents:number; totalCents:number; address:{street:string;number:string;complement?:string;neighborhood:string;reference?:string}; phone:string; payment:PaymentMethod; changeForCents?:number; note?:string; status:OrderStatus; createdAt:string; estimatedRange:string; acceptedDeadline:string; timeline:TimelineEvent[] }
export const traditionalAcaiImages={spoon:'/images/acai-tradicional.webp',baskets:'/images/acai-tradicional.webp',machine:'/images/acai-tradicional.webp',bowl:'/images/acai-tradicional.webp',ceramicBowl:'/images/acai-tradicional.webp',metalBowl:'/images/acai-tradicional.webp',pouring:'/images/acai-tradicional.webp'} as const
export const seedStores:Store[]=[{id:'store-001',name:'Açaí do Seu João',owner:'João Silva',operator:'João Silva',address:'Rua das Flores, 42',neighborhood:'Centro',image:traditionalAcaiImages.ceramicBowl,adminStatus:'ATIVA',isOpen:true,deliveryAvailable:true,accepts500ml:true,hours:'09h às 20h',estimatedRange:'25–35 min',deliveryFeeCents:0,createdAt:'2026-09-01'},{id:'store-002',name:'Açaí Amazônia',owner:'Maria Santos',operator:'Maria Santos',address:'Av. Principal, 128',neighborhood:'Centro',image:traditionalAcaiImages.baskets,adminStatus:'ATIVA',isOpen:true,deliveryAvailable:false,accepts500ml:false,hours:'10h às 19h',estimatedRange:'30–40 min',deliveryFeeCents:0,createdAt:'2026-09-02'},{id:'store-003',name:'Puro Açaí',owner:'Carlos Oliveira',operator:'Carlos Oliveira',address:'Rua do Comércio, 75',neighborhood:'Centro',image:traditionalAcaiImages.machine,adminStatus:'ATIVA',isOpen:false,deliveryAvailable:true,accepts500ml:true,nextOpening:'Amanhã às 08h',hours:'08h às 18h',estimatedRange:'20–30 min',deliveryFeeCents:0,createdAt:'2026-09-03'},{id:'store-004',name:'Açaí da Ilha',owner:'Francisca Costa',operator:'Francisca Costa',address:'Praça Central, 15',neighborhood:'Centro',image:traditionalAcaiImages.metalBowl,adminStatus:'EM_ANALISE',isOpen:false,deliveryAvailable:false,accepts500ml:false,nextOpening:'Após ativação',hours:'09h às 18h',estimatedRange:'35–45 min',deliveryFeeCents:0,createdAt:'2026-09-04'}]
export const acaiGrades=[{grade:10,pricePerLiterCents:1000,description:'Açaí tradicional batido na hora, qualidade 10.'},{grade:15,pricePerLiterCents:1500,description:'Açaí tradicional batido na hora, qualidade 15.'},{grade:20,pricePerLiterCents:2000,description:'Açaí tradicional batido na hora, qualidade 20.'}] as const
// O preço do produto é proporcional ao volume: 1 L custa o valor do tipo e 500 ml, a metade.
export const priceForVolume=(pricePerLiterCents:number,volumeMl:number)=>Math.round(pricePerLiterCents*volumeMl/1000)
const catalogStoreIds=['store-001','store-002','store-003']
export const seedProducts:Product[]=catalogStoreIds.flatMap(storeId=>acaiGrades.flatMap(({grade,pricePerLiterCents,description})=>([500,1000] as const).map(volumeMl=>({id:`${storeId}-tipo${grade}-${volumeMl}`,grade,storeId,name:`Açaí de ${grade} · ${volumeMl===1000?'1 litro':'500 ml'}`,description,image:traditionalAcaiImages.ceramicBowl,volumeMl,priceCents:priceForVolume(pricePerLiterCents,volumeMl),active:true,available:true,showUnavailable:false}))))
export type NeighborhoodStatus={name:string;active:boolean}
export const seedNeighborhoods:NeighborhoodStatus[]=[{name:'Centro',active:true},{name:'Bairro Novo',active:false},{name:'Beira-rio',active:false}]
export const predefinedMessages=['O entregador chegou.','Não encontramos o endereço.','Seu pedido está atrasado.','Precisamos confirmar uma informação do pedido.','Um item ficou indisponível; aguarde contato do suporte.']
export const adminActorName='Administrador do piloto'
export const guestCustomerName='Cliente'
export const requiredVolumeMl=1000;export const orderMinVolumeMessage='Adicione pelo menos 1.000 ml para enviar o pedido.'
export const allowedProductVolumesMl=[500,1000] as const


export const getOrderStatusLabel=(s:OrderStatus)=>({AGUARDANDO_ACEITE:'Aguardando resposta',ACEITO:'Aceito',EM_PREPARO:'Em preparo',PRONTO:'Pronto',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Entregue',RECUSADO:'Recusado',EXPIRADO:'Expirado',CANCELADO:'Cancelado',FALHA_NA_ENTREGA:'Falha na entrega'} as Record<OrderStatus,string>)[s]
export const getStoreAvailabilityText=(s:Store)=>`${isStoreOpenNow(s)?'Aberta agora':`Fechada · ${nextOpeningText(s)}`} · ${s.deliveryAvailable?'Entrega disponível':'Entrega indisponível'}`
export const getFeeText=(s:Store)=>s.deliveryAvailable?(s.deliveryFeeCents?`Taxa R$ ${cents(s.deliveryFeeCents)}`:'Entrega grátis'):'Sem entrega disponível'
export const getStoreById=(id:string)=>seedStores.find(s=>s.id===id)
export const getProductsByStoreId=(id:string)=>seedProducts.filter(p=>p.storeId===id)
export const filterVisibleProducts=(id:string)=>{const store=getStoreById(id);return getProductsByStoreId(id).filter(p=>p.active&&(p.available||p.showUnavailable)&&(!store||isProductOffered(p,store)))};export const isStoreOrderable=(s:Store)=>s.adminStatus==='ATIVA'&&isStoreOpenNow(s)&&s.deliveryAvailable
export function calculateTotals(items:{product:Product;quantity:number}[],fee:number){const subtotalCents=items.reduce((sum,i)=>sum+i.product.priceCents*i.quantity,0);const volumeMl=items.reduce((sum,i)=>sum+i.product.volumeMl*i.quantity,0);return{subtotalCents,deliveryFeeCents:fee,totalCents:subtotalCents+fee,volumeMl}}
export const cents=(value:number)=>(value/100).toFixed(2).replace('.',',');export const isProductOffered=(p:Product,s:Pick<Store,'accepts500ml'>)=>p.volumeMl!==500||s.accepts500ml;export const isAddressCovered=(a:{neighborhood:string})=>a.neighborhood.trim().toLowerCase()==='centro';
export const createOrderId=()=>`AC-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`
export function createOrderSnapshot(items:{product:Product;quantity:number;note?:string}[],store:Store,addressValue:Order['address'],phone:string,payment:PaymentMethod,changeForCents?:number,note?:string):Order{validateCheckout(items,store,addressValue,phone,payment,changeForCents,note);const timestamp=Date.now();const totals=calculateTotals(items,store.deliveryFeeCents);return{id:createOrderId(),customerId:'customer-001',storeId:store.id,items:items.map(i=>({productId:i.product.id,name:i.product.name,quantity:i.quantity,volumeMl:i.product.volumeMl,unitPriceCents:i.product.priceCents,note:i.note})),subtotalCents:totals.subtotalCents,deliveryFeeCents:totals.deliveryFeeCents,totalCents:totals.totalCents,address:{...addressValue},phone,payment,changeForCents:payment==='DINHEIRO'?changeForCents:undefined,note,status:'AGUARDANDO_ACEITE',createdAt:new Date(timestamp).toISOString(),estimatedRange:store.estimatedRange,acceptedDeadline:new Date(timestamp+300000).toISOString(),timeline:[{to:'AGUARDANDO_ACEITE',at:new Date(timestamp).toISOString(),author:'cliente'}]}}
export type Actor = { role:'cliente'|'operador'|'admin'|'sistema'; name:string; storeId?:string; customerId?:string }
export function applyTransition(order:Order,to:OrderStatus,actor:Actor,reason?:string,nowMs=Date.now()):Order {
  if (!canTransition(order.status,to)) throw new Error('Transição não permitida para este estado.')
  if (!actor.name.trim()) throw new Error('Informe o responsável.')
  const expired=nowMs>=Date.parse(order.acceptedDeadline)
  if(order.status==='AGUARDANDO_ACEITE' && expired && to!=='EXPIRADO') throw new Error('O prazo de aceite terminou.')
  const allowed=to==='EXPIRADO' ? actor.role==='sistema' && expired
    : actor.role==='cliente' ? actor.customerId===order.customerId && order.status==='AGUARDANDO_ACEITE' && to==='CANCELADO'
    : actor.role==='admin' ? to==='CANCELADO' && ['ACEITO','EM_PREPARO','PRONTO'].includes(order.status)
    : actor.role==='operador' && actor.storeId===order.storeId && !(to==='CANCELADO' && order.status==='AGUARDANDO_ACEITE')
  if(!allowed) throw new Error('Este perfil não pode realizar essa ação.')
  if(['RECUSADO','FALHA_NA_ENTREGA'].includes(to) || (to==='CANCELADO' && order.status!=='AGUARDANDO_ACEITE')) {
    if(!reason?.trim()) throw new Error('Informe o motivo da operação.')
  }
  if((reason?.length??0)>255) throw new Error('O motivo deve ter até 255 caracteres.')
  return {...order,status:to,timeline:[...order.timeline,{from:order.status,to,at:new Date(nowMs).toISOString(),author:actor.name,reason:reason?.trim()}]}
}
export const canTransition=(from:OrderStatus,to:OrderStatus)=>({AGUARDANDO_ACEITE:['ACEITO','RECUSADO','EXPIRADO','CANCELADO'],ACEITO:['EM_PREPARO','CANCELADO'],EM_PREPARO:['PRONTO','CANCELADO'],PRONTO:['SAIU_PARA_ENTREGA','CANCELADO'],SAIU_PARA_ENTREGA:['ENTREGUE','FALHA_NA_ENTREGA']} as Record<string,string[]>)[from]?.includes(to)??false
export const adminStatusLabel=(s:AdminStatus)=>({EM_ANALISE:'Em análise',ATIVA:'Ativa',SUSPENSA:'Suspensa',DESATIVADA:'Desativada'}[s])
export type CartItem={product:Product;quantity:number;note?:string}
export function formatOrderDate(value:string){return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Belem'})}


// Regras da simulação; não substituem autorização ou transações no servidor.
export function parseMoney(value:string):number {
  if(!/^\d{1,8}([,.]\d{1,2})?$/.test(value.trim())) throw new Error('Informe um valor válido com até duas casas decimais.')
  const [whole,fraction='']=value.trim().replace(',','.').split('.')
  return Number(whole)*100+Number(fraction.padEnd(2,'0'))
}
export function validateCheckout(items:CartItem[],store:Store,address:Order['address'],phone:string,payment:PaymentMethod,change?:number,note?:string) {
  if(!isStoreOrderable(store)) throw new Error('A batedeira está indisponível para novos pedidos.')
  if(!items.length || items.some(i=>i.product.storeId!==store.id || !i.product.active || !i.product.available || !Number.isSafeInteger(i.quantity) || i.quantity<1 || i.quantity>65535)) throw new Error('Revise os produtos e as quantidades da sacola.')
  if(items.some(i=>!Number.isSafeInteger(i.product.priceCents)||i.product.priceCents<=0||!Number.isSafeInteger(i.product.volumeMl)||i.product.volumeMl<=0)) throw new Error('Produto com preço ou volume inválido.')
  if(items.some(i=>!isProductOffered(i.product,store))) throw new Error('Esta batedeira não entrega porções de 500 ml no momento. Remova esses itens da sacola.')
  const totals=calculateTotals(items,store.deliveryFeeCents)
  if(!Number.isSafeInteger(store.deliveryFeeCents)||store.deliveryFeeCents<0||!Number.isSafeInteger(totals.totalCents)) throw new Error('Taxa ou total inválido.')
  if(totals.volumeMl<requiredVolumeMl) throw new Error(orderMinVolumeMessage)
  if(!isAddressCovered(address)) throw new Error('A entrega está disponível somente no bairro Centro.')
  if(!address.street.trim()||!address.number.trim()||!/^\d{10,11}$/.test(phone.replace(/\D/g,''))) throw new Error('Informe rua, número e telefone com DDD.')
  if(address.street.length>180||address.number.length>20||(address.complement?.length??0)>100||(address.reference?.length??0)>255) throw new Error('Revise o tamanho dos campos do endereço.')
  if(!['PIX_NA_ENTREGA','DINHEIRO'].includes(payment)) throw new Error('Escolha Pix ou dinheiro na entrega.')
  if(payment==='DINHEIRO' && change!==undefined && (!Number.isSafeInteger(change)||change<totals.totalCents)) throw new Error('O valor para troco deve ser igual ou maior que o total.')
  if((note?.length??0)>500 || items.some(i=>(i.note?.length??0)>300)) throw new Error('Observações: até 300 caracteres por item e 500 por pedido.')
}
export function expireOrders(orders:Order[],nowMs=Date.now()):Order[] {
  return orders.map(o=>o.status==='AGUARDANDO_ACEITE' && nowMs>=Date.parse(o.acceptedDeadline)
    ?applyTransition(o,'EXPIRADO',{role:'sistema',name:'Expiração automática'},undefined,nowMs):o)
}
export function appendOrder(orders:Order[],order:Order,requestId:string):Order[] {
  if(orders.some(o=>o.customerId===order.customerId&&o.requestId===requestId)) return orders
  return [{...order,requestId},...orders]
}

export function getSchedule(store:Store):OpeningHours[] {
  if(store.schedule) return store.schedule
  const hours=store.hours.match(/\d+/g)??['9','18']
  return Array.from({length:7},(_,day)=>({day,opens:`${hours[0].padStart(2,'0')}:00`,closes:`${hours[1].padStart(2,'0')}:00`,active:true}))
}
function localTime(now:Date) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Belem',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now)
  const part=(type:string)=>parts.find(p=>p.type===type)?.value??''
  return {day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(part('weekday')),time:`${part('hour')}:${part('minute')}`}
}
export function isStoreOpenNow(store:Store,now=new Date()):boolean {
  const {day,time}=localTime(now)
  return store.isOpen&&getSchedule(store).some(h=>h.day===day&&h.active&&h.opens<=time&&time<h.closes)
}
export function nextOpeningText(store:Store,now=new Date()):string {
  const {day,time}=localTime(now)
  const schedule=getSchedule(store)
  for(let offset=0;offset<=7;offset++) {
    const entry=schedule.filter(h=>h.active&&h.day===(day+offset)%7&&(offset>0||h.opens>time)).sort((a,b)=>a.opens.localeCompare(b.opens))[0]
    if(entry) return `Previsão: ${offset===0?'hoje':offset===1?'amanhã':['domingo','segunda','terça','quarta','quinta','sexta','sábado'][entry.day]} às ${entry.opens}`
  }
  return 'Sem previsão de abertura'
}
