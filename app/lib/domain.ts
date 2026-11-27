import { isOfficialNeighborhood } from './neighborhoods.ts'

export type AdminStatus = 'EM_ANALISE' | 'ATIVA' | 'SUSPENSA' | 'DESATIVADA'
export type OrderStatus = 'AGUARDANDO_ACEITE' | 'ACEITO' | 'AGUARDANDO_PAGAMENTO' | 'EM_PREPARO' | 'PRONTO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO' | 'FALHA_NA_ENTREGA'
export type PaymentMethod = 'DINHEIRO' | 'PIX'
// Conta conectada da batedeira no provedor de pagamento (DEC-058). Só `VERIFICADA` permite oferecer Pix.
export type PaymentAccountStatus = 'NAO_CADASTRADA' | 'PENDENTE' | 'VERIFICADA' | 'RECUSADA'
export type Coverage = { neighborhood:string; feeCents:number; estimatedRange:string }
export type Product = { id:string; storeId:string; name:string; description?:string; image?:string; volumeMl:number; priceCents:number; active:boolean; available:boolean; showUnavailable:boolean; updatedAt?:string }
export type OpeningHours = { day:number; opens:string; closes:string; active:boolean }
export type Store = { id:string; name:string; owner:string; operator:string;  address:string; neighborhood:string; image:string; adminStatus:AdminStatus; isOpen:boolean; deliveryAvailable:boolean; document?:string; hours:string; schedule?:OpeningHours[]; nextOpening?:string; estimatedRange:string; coverage:Coverage[]; paymentAccountStatus:PaymentAccountStatus; createdAt:string }
export type OrderItem = { productId:string; name:string; quantity:number; volumeMl:number; unitPriceCents:number; note?:string }
export type TimelineEvent = { from?:OrderStatus; to:OrderStatus; at:string; author:string; reason?:string; message?:string }
export type Order = { id:string; requestId?:string; customerId:string; storeId:string; storeName?:string; items:OrderItem[]; subtotalCents:number; deliveryFeeCents:number; totalCents:number; address:{street:string;number:string;complement?:string;neighborhood:string;reference?:string}; phone:string; payment?:PaymentMethod; changeForCents?:number; note?:string; status:OrderStatus; createdAt:string; estimatedRange:string; acceptedDeadline:string; paymentDeadline?:string; pixDeadline?:string; paidAt?:string; timeline:TimelineEvent[] }
export const traditionalAcaiImages={spoon:'/images/acai-tradicional.webp',baskets:'/images/acai-tradicional.webp',machine:'/images/acai-tradicional.webp',bowl:'/images/acai-tradicional.webp',ceramicBowl:'/images/acai-tradicional.webp',metalBowl:'/images/acai-tradicional.webp',pouring:'/images/acai-tradicional.webp'} as const
export const predefinedMessages=['O entregador chegou.','Não encontramos o endereço.','Seu pedido está atrasado.','Precisamos confirmar uma informação do pedido.','Um item ficou indisponível; aguarde contato do suporte.']
export const adminActorName='Administração AçaíConecta'
export const guestCustomerName='Cliente'
export const requiredVolumeMl=1000;export const orderMinVolumeMessage='Adicione pelo menos 1.000 ml para enviar o pedido.'
export const allowedProductVolumesMl=[500,1000] as const


export const getOrderStatusLabel=(s:OrderStatus)=>({AGUARDANDO_ACEITE:'Aguardando resposta',ACEITO:'Aceito',AGUARDANDO_PAGAMENTO:'Aguardando pagamento',EM_PREPARO:'Em preparo',PRONTO:'Pronto',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Entregue',RECUSADO:'Recusado',EXPIRADO:'Expirado',CANCELADO:'Cancelado',FALHA_NA_ENTREGA:'Falha na entrega'} as Record<OrderStatus,string>)[s]
export const getStoreAvailabilityText=(s:Store)=>`${isStoreOpenNow(s)?'Aberta agora':`Fechada · ${nextOpeningText(s)}`} · ${s.deliveryAvailable?'Entrega disponível':'Entrega indisponível'}`
export const coverageFor=(s:Pick<Store,'coverage'>,neighborhood:string)=>s.coverage.find(c=>c.neighborhood===neighborhood)
// Com o bairro do cliente mostra a taxa dele; sem bairro, mostra a menor taxa entre os bairros atendidos.
export const getFeeText=(s:Store,neighborhood?:string)=>{if(!s.deliveryAvailable)return 'Sem entrega disponível';const c=neighborhood?coverageFor(s,neighborhood):undefined;if(neighborhood&&!c)return `Não entrega em ${neighborhood}`;const fees=c?[c.feeCents]:s.coverage.map(x=>x.feeCents);if(!fees.length)return 'Nenhum bairro atendido';const fee=Math.min(...fees);return fee?`${c||fees.every(f=>f===fee)?'Taxa':'Taxa a partir de'} R$ ${cents(fee)}`:'Entrega grátis'}
export const servesNeighborhood=(s:Store,neighborhood:string)=>s.deliveryAvailable&&!!coverageFor(s,neighborhood)
// Produtos que o cliente enxerga: ativos e disponíveis (ou indisponíveis marcados para exibição).
export const visibleProducts=(products:Product[])=>products.filter(p=>p.active&&(p.available||p.showUnavailable))
export const isStoreOrderable=(s:Store)=>s.adminStatus==='ATIVA'&&isStoreOpenNow(s)&&s.deliveryAvailable&&s.coverage.length>0
export function calculateTotals(items:{product:Product;quantity:number}[],fee:number){const subtotalCents=items.reduce((sum,i)=>sum+i.product.priceCents*i.quantity,0);const volumeMl=items.reduce((sum,i)=>sum+i.product.volumeMl*i.quantity,0);return{subtotalCents,deliveryFeeCents:fee,totalCents:subtotalCents+fee,volumeMl}}
export const cents=(value:number)=>(value/100).toFixed(2).replace('.',',');export const isAddressCovered=(a:{neighborhood:string},s:Pick<Store,'coverage'>)=>isOfficialNeighborhood(a.neighborhood)&&!!coverageFor(s,a.neighborhood);
export const createOrderId=()=>`AC-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`
export function createOrderSnapshot(items:{product:Product;quantity:number;note?:string}[],store:Store,addressValue:Order['address'],phone:string,note?:string):Order{validateCheckout(items,store,addressValue,phone,note);const timestamp=Date.now();const coverage=coverageFor(store,addressValue.neighborhood)!;const totals=calculateTotals(items,coverage.feeCents);return{id:createOrderId(),customerId:'customer-001',storeId:store.id,items:items.map(i=>({productId:i.product.id,name:i.product.name,quantity:i.quantity,volumeMl:i.product.volumeMl,unitPriceCents:i.product.priceCents,note:i.note})),subtotalCents:totals.subtotalCents,deliveryFeeCents:totals.deliveryFeeCents,totalCents:totals.totalCents,address:{...addressValue},phone,note,status:'AGUARDANDO_ACEITE',createdAt:new Date(timestamp).toISOString(),estimatedRange:coverage.estimatedRange,acceptedDeadline:new Date(timestamp+300000).toISOString(),timeline:[{to:'AGUARDANDO_ACEITE',at:new Date(timestamp).toISOString(),author:'cliente'}]}}
export type Actor = { role:'cliente'|'operador'|'admin'|'sistema'; name:string; storeId?:string; customerId?:string }
// Prazos do pagamento depois do aceite (DEC-056, DEC-059): 10 minutos para escolher a forma e 10 para pagar o Pix.
export const paymentChoiceWindowMs=600000
export const pixPaymentWindowMs=600000
export const paymentNotChosenReason='Forma de pagamento não escolhida'
export const paymentExpiredReason='Pagamento expirado'
const iso=(ms:number)=>new Date(ms).toISOString()
export function applyTransition(order:Order,to:OrderStatus,actor:Actor,reason?:string,nowMs=Date.now()):Order {
  const from=order.status
  if (!canTransition(from,to)) throw new Error('Transição não permitida para este estado.')
  if (!actor.name.trim()) throw new Error('Informe o responsável.')
  const expired=nowMs>=Date.parse(order.acceptedDeadline)
  if(from==='AGUARDANDO_ACEITE' && expired && to!=='EXPIRADO') throw new Error('O prazo de aceite terminou.')
  const choiceOpen=!!order.paymentDeadline&&nowMs<Date.parse(order.paymentDeadline)
  const choiceExpired=from==='ACEITO'&&!order.payment&&!!order.paymentDeadline&&nowMs>=Date.parse(order.paymentDeadline)
  const pixExpired=from==='AGUARDANDO_PAGAMENTO'&&!!order.pixDeadline&&nowMs>=Date.parse(order.pixDeadline)
  // A escolha da forma de pagamento e a confirmação do Pix não são ações da batedeira nem do administrador.
  const choosing=from==='ACEITO'&&(to==='EM_PREPARO'||to==='AGUARDANDO_PAGAMENTO')
  const confirmingPix=from==='AGUARDANDO_PAGAMENTO'&&to==='EM_PREPARO'
  const allowed=to==='EXPIRADO' ? actor.role==='sistema' && expired
    : actor.role==='sistema' ? to==='CANCELADO' && (choiceExpired||pixExpired) || confirmingPix && order.payment==='PIX' && !!order.paidAt && !pixExpired
    : choosing ? actor.role==='cliente' && actor.customerId===order.customerId && choiceOpen && order.payment===(to==='EM_PREPARO'?'DINHEIRO':'PIX')
    : actor.role==='cliente' ? actor.customerId===order.customerId && from==='AGUARDANDO_ACEITE' && to==='CANCELADO'
    : actor.role==='admin' ? to==='CANCELADO' && ['ACEITO','AGUARDANDO_PAGAMENTO','EM_PREPARO','PRONTO'].includes(from)
    : actor.role==='operador' && actor.storeId===order.storeId && !confirmingPix && !(to==='CANCELADO' && from==='AGUARDANDO_ACEITE')
  if(!allowed) throw new Error('Este perfil não pode realizar essa ação.')
  if(['RECUSADO','FALHA_NA_ENTREGA'].includes(to) || (to==='CANCELADO' && from!=='AGUARDANDO_ACEITE')) {
    if(!reason?.trim()) throw new Error('Informe o motivo da operação.')
  }
  if((reason?.length??0)>255) throw new Error('O motivo deve ter até 255 caracteres.')
  const accepted=to==='ACEITO'?{paymentDeadline:iso(nowMs+paymentChoiceWindowMs)}:{}
  return {...order,...accepted,status:to,timeline:[...order.timeline,{from,to,at:iso(nowMs),author:actor.name,reason:reason?.trim()}]}
}
export const canTransition=(from:OrderStatus,to:OrderStatus)=>({AGUARDANDO_ACEITE:['ACEITO','RECUSADO','EXPIRADO','CANCELADO'],ACEITO:['EM_PREPARO','AGUARDANDO_PAGAMENTO','CANCELADO'],AGUARDANDO_PAGAMENTO:['EM_PREPARO','CANCELADO'],EM_PREPARO:['PRONTO','CANCELADO'],PRONTO:['SAIU_PARA_ENTREGA','CANCELADO'],SAIU_PARA_ENTREGA:['ENTREGUE','FALHA_NA_ENTREGA']} as Record<string,string[]>)[from]?.includes(to)??false
const withLastMessage=(order:Order,message:string):Order=>({...order,timeline:order.timeline.map((event,index)=>index===order.timeline.length-1?{...event,message}:event)})
/** Depois do aceite o cliente escolhe a forma de pagamento (DEC-056). Dinheiro vai direto ao preparo; Pix aguarda a confirmação do provedor. */
export function choosePayment(order:Order,method:PaymentMethod,store:Pick<Store,'paymentAccountStatus'>,actor:Actor,changeForCents?:number,nowMs=Date.now()):Order {
  if(order.status!=='ACEITO') throw new Error('A forma de pagamento só pode ser escolhida depois do aceite.')
  if(order.payment) throw new Error('A forma de pagamento já foi escolhida.')
  if(!order.paymentDeadline||nowMs>=Date.parse(order.paymentDeadline)) throw new Error('O prazo para escolher a forma de pagamento terminou.')
  if(method!=='DINHEIRO'&&method!=='PIX') throw new Error('Escolha Pix ou dinheiro na entrega.')
  if(method==='PIX'&&store.paymentAccountStatus!=='VERIFICADA') throw new Error('Esta batedeira ainda não recebe Pix. Escolha dinheiro na entrega.')
  if(method==='PIX'&&changeForCents!==undefined) throw new Error('Troco só vale para dinheiro.')
  if(method==='DINHEIRO'&&changeForCents!==undefined&&(!Number.isSafeInteger(changeForCents)||changeForCents<order.totalCents)) throw new Error('O valor para troco deve ser igual ou maior que o total.')
  const chosen:Order={...order,payment:method,changeForCents:method==='DINHEIRO'?changeForCents:undefined,pixDeadline:method==='PIX'?iso(nowMs+pixPaymentWindowMs):undefined}
  const moved=applyTransition(chosen,method==='PIX'?'AGUARDANDO_PAGAMENTO':'EM_PREPARO',actor,undefined,nowMs)
  return withLastMessage(moved,method==='PIX'?'Pix escolhido; aguardando o pagamento.':'Dinheiro na entrega escolhido; pedido em preparo.')
}
/** Confirmação do pagamento pelo provedor (webhook). Idempotente: repetir a confirmação não altera o pedido. */
export function confirmPixPayment(order:Order,nowMs=Date.now()):Order {
  if(order.paidAt) return order
  if(order.status!=='AGUARDANDO_PAGAMENTO'||order.payment!=='PIX') throw new Error('Este pedido não aguarda pagamento.')
  const paid:Order={...order,paidAt:iso(nowMs)}
  return withLastMessage(applyTransition(paid,'EM_PREPARO',{role:'sistema',name:'Provedor de pagamento'},undefined,nowMs),'Pagamento Pix confirmado; pedido em preparo.')
}
export const adminStatusLabel=(s:AdminStatus)=>({EM_ANALISE:'Em análise',ATIVA:'Ativa',SUSPENSA:'Suspensa',DESATIVADA:'Desativada'}[s])
export type CartItem={product:Product;quantity:number;note?:string}
export function formatOrderDate(value:string){return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Belem'})}


// Regras da simulação; não substituem autorização ou transações no servidor.
export function parseMoney(value:string):number {
  if(!/^\d{1,8}([,.]\d{1,2})?$/.test(value.trim())) throw new Error('Informe um valor válido com até duas casas decimais.')
  const [whole,fraction='']=value.trim().replace(',','.').split('.')
  return Number(whole)*100+Number(fraction.padEnd(2,'0'))
}
export function validateCheckout(items:CartItem[],store:Store,address:Order['address'],phone:string,note?:string) {
  if(!isStoreOrderable(store)) throw new Error('A batedeira está indisponível para novos pedidos.')
  if(!items.length || items.some(i=>i.product.storeId!==store.id || !i.product.active || !i.product.available || !Number.isSafeInteger(i.quantity) || i.quantity<1 || i.quantity>65535)) throw new Error('Revise os produtos e as quantidades da sacola.')
  if(items.some(i=>!Number.isSafeInteger(i.product.priceCents)||i.product.priceCents<=0||!Number.isSafeInteger(i.product.volumeMl)||i.product.volumeMl<=0)) throw new Error('Produto com preço ou volume inválido.')
  if(!isAddressCovered(address,store)) throw new Error(isOfficialNeighborhood(address.neighborhood)?`Esta batedeira não entrega no bairro ${address.neighborhood}.`:'Escolha um bairro da zona urbana de Cametá.')
  const fee=coverageFor(store,address.neighborhood)!.feeCents
  const totals=calculateTotals(items,fee)
  if(!Number.isSafeInteger(fee)||fee<0||!Number.isSafeInteger(totals.totalCents)) throw new Error('Taxa ou total inválido.')
  if(totals.volumeMl<requiredVolumeMl) throw new Error(orderMinVolumeMessage)
  if(!address.street.trim()||!address.number.trim()||!/^\d{10,11}$/.test(phone.replace(/\D/g,''))) throw new Error('Informe rua, número e telefone com DDD.')
  if(address.street.length>180||address.number.length>20||(address.complement?.length??0)>100||(address.reference?.length??0)>255) throw new Error('Revise o tamanho dos campos do endereço.')
  if((note?.length??0)>500 || items.some(i=>(i.note?.length??0)>300)) throw new Error('Observações: até 300 caracteres por item e 500 por pedido.')
}
export function expireOrders(orders:Order[],nowMs=Date.now()):Order[] {
  const system:Actor={role:'sistema',name:'Expiração automática'}
  return orders.map(o=>{
    if(o.status==='AGUARDANDO_ACEITE' && nowMs>=Date.parse(o.acceptedDeadline)) return applyTransition(o,'EXPIRADO',system,undefined,nowMs)
    if(o.status==='ACEITO' && !o.payment && o.paymentDeadline && nowMs>=Date.parse(o.paymentDeadline)) return applyTransition(o,'CANCELADO',system,paymentNotChosenReason,nowMs)
    if(o.status==='AGUARDANDO_PAGAMENTO' && o.pixDeadline && nowMs>=Date.parse(o.pixDeadline)) return applyTransition(o,'CANCELADO',system,paymentExpiredReason,nowMs)
    return o
  })
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
