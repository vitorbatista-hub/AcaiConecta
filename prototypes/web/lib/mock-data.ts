export type AdminStatus = 'EM_ANALISE' | 'ATIVA' | 'SUSPENSA' | 'DESATIVADA'
export type OrderStatus = 'AGUARDANDO_ACEITE' | 'ACEITO' | 'EM_PREPARO' | 'PRONTO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO' | 'FALHA_NA_ENTREGA'
export type PaymentMethod = 'DINHEIRO' | 'PIX'
export type Product = { id:string; storeId:string; name:string; description?:string; image?:string; volumeMl:number; priceCents:number; active:boolean; available:boolean; showUnavailable:boolean; updatedAt?:string }
export type OpeningHours = { day:number; opens:string; closes:string; active:boolean }
export type Store = { id:string; name:string; owner:string; operator:string; operatorEmail:string; address:string; neighborhood:'Centro'; image:string; adminStatus:AdminStatus; isOpen:boolean; deliveryAvailable:boolean; hours:string; schedule?:OpeningHours[]; nextOpening?:string; estimatedRange:string; deliveryFeeCents:number; createdAt:string }
export type OrderItem = { productId:string; name:string; quantity:number; volumeMl:number; unitPriceCents:number; note?:string }
export type TimelineEvent = { from?:OrderStatus; to:OrderStatus; at:string; author:string; reason?:string; message?:string }
export type Order = { id:string; requestId?:string; customerId:string; storeId:string; storeName?:string; items:OrderItem[]; subtotalCents:number; deliveryFeeCents:number; totalCents:number; address:{street:string;number:string;complement?:string;neighborhood:string;reference?:string}; phone:string; payment:PaymentMethod; changeForCents?:number; note?:string; status:OrderStatus; createdAt:string; estimatedRange:string; acceptedDeadline:string; timeline:TimelineEvent[] }
export type Notification = {id:string;orderId?:string;message:string;createdAt:string;read:boolean}
export const traditionalAcaiImages={spoon:'/images/acai-tradicional.webp',baskets:'/images/acai-tradicional.webp',machine:'/images/acai-tradicional.webp',bowl:'/images/acai-tradicional.webp',ceramicBowl:'/images/acai-tradicional.webp',metalBowl:'/images/acai-tradicional.webp',pouring:'/images/acai-tradicional.webp'} as const
export const mockStores:Store[]=[{id:'store-001',name:'Açaí do Seu João',owner:'João Silva',operator:'João Silva',operatorEmail:'joao.silva@batedeira.demo',address:'Rua das Flores, 42',neighborhood:'Centro',image:traditionalAcaiImages.ceramicBowl,adminStatus:'ATIVA',isOpen:true,deliveryAvailable:true,hours:'09h às 20h',estimatedRange:'25–35 min',deliveryFeeCents:0,createdAt:'2026-09-01'},{id:'store-002',name:'Açaí Amazônia',owner:'Maria Santos',operator:'Maria Santos',operatorEmail:'maria.santos@batedeira.demo',address:'Av. Principal, 128',neighborhood:'Centro',image:traditionalAcaiImages.baskets,adminStatus:'ATIVA',isOpen:true,deliveryAvailable:false,hours:'10h às 19h',estimatedRange:'30–40 min',deliveryFeeCents:0,createdAt:'2026-09-02'},{id:'store-003',name:'Puro Açaí',owner:'Carlos Oliveira',operator:'Carlos Oliveira',operatorEmail:'carlos.oliveira@batedeira.demo',address:'Rua do Comércio, 75',neighborhood:'Centro',image:traditionalAcaiImages.machine,adminStatus:'ATIVA',isOpen:false,deliveryAvailable:true,nextOpening:'Amanhã às 08h',hours:'08h às 18h',estimatedRange:'20–30 min',deliveryFeeCents:0,createdAt:'2026-09-03'},{id:'store-004',name:'Açaí da Ilha',owner:'Francisca Costa',operator:'Francisca Costa',operatorEmail:'francisca.costa@batedeira.demo',address:'Praça Central, 15',neighborhood:'Centro',image:traditionalAcaiImages.metalBowl,adminStatus:'EM_ANALISE',isOpen:false,deliveryAvailable:false,nextOpening:'Após ativação',hours:'09h às 18h',estimatedRange:'35–45 min',deliveryFeeCents:0,createdAt:'2026-09-04'}]
export const mockProducts:Product[]=[{id:'prod-001',storeId:'store-001',name:'Açaí puro 500 ml',description:'Polpa tradicional batida na hora.',image:traditionalAcaiImages.ceramicBowl,volumeMl:500,priceCents:1800,active:true,available:true,showUnavailable:false},{id:'prod-002',storeId:'store-001',name:'Açaí puro 1 litro',description:'Porção para compartilhar, sem misturas.',image:traditionalAcaiImages.metalBowl,volumeMl:1000,priceCents:3200,active:true,available:true,showUnavailable:false},{id:'prod-003',storeId:'store-001',name:'Açaí puro 300 ml',description:'Porção individual tradicional.',image:traditionalAcaiImages.spoon,volumeMl:300,priceCents:1200,active:true,available:false,showUnavailable:true},{id:'prod-004',storeId:'store-002',name:'Açaí puro 500 ml',description:'Açaí tradicional de Cametá.',image:traditionalAcaiImages.bowl,volumeMl:500,priceCents:2200,active:true,available:true,showUnavailable:false},{id:'prod-005',storeId:'store-002',name:'Açaí puro 1 litro',description:'Polpa encorpada batida na hora.',image:traditionalAcaiImages.pouring,volumeMl:1000,priceCents:3800,active:true,available:true,showUnavailable:false},{id:'prod-006',storeId:'store-003',name:'Açaí puro 500 ml',description:'Disponível quando a batedeira abrir.',image:traditionalAcaiImages.machine,volumeMl:500,priceCents:1600,active:true,available:true,showUnavailable:false}]
const now=new Date();const iso=(m:number)=>new Date(now.getTime()-m*60000).toISOString();const address={street:'Rua Nova',number:'120',complement:'Casa azul',neighborhood:'Centro',reference:'Perto da praça'}
export const mockOrders:Order[]=[{id:'AC-1040',customerId:'customer-001',storeId:'store-001',items:[{productId:'prod-002',name:'Açaí puro 1 litro',quantity:1,volumeMl:1000,unitPriceCents:3200}],subtotalCents:3200,deliveryFeeCents:0,totalCents:3200,address,phone:'(91) 98888-0000',payment:'PIX',status:'EM_PREPARO',createdAt:iso(12),estimatedRange:'25–35 min',acceptedDeadline:new Date(now.getTime()-7*60000).toISOString(),timeline:[{to:'AGUARDANDO_ACEITE',at:iso(12),author:'cliente'},{from:'AGUARDANDO_ACEITE',to:'ACEITO',at:iso(10),author:'João Silva'},{from:'ACEITO',to:'EM_PREPARO',at:iso(5),author:'João Silva'}]}]
export const mockNotifications:Notification[]=[{id:'n-1',orderId:'AC-1040',message:'Seu pedido está em preparo.',createdAt:iso(5),read:false},{id:'n-2',message:'O entregador chegou.',createdAt:iso(40),read:true}]
export const mockAdminMetrics={responseTime:'3m 12s',acceptance:'86%',completion:'78%',expiration:'4%',cancelledAfterAcceptance:'6%'}
export type NeighborhoodStatus={name:string;active:boolean}
export const mockNeighborhoods:NeighborhoodStatus[]=[{name:'Centro',active:true},{name:'Bairro Novo (exemplo, fora do piloto)',active:false},{name:'Beira-rio (exemplo, fora do piloto)',active:false}]
export const mockUsers=[{name:'João da Silva',email:'joao@email.com',role:'Cliente',status:'Ativo'},{name:'Maria Santos',email:'maria@acaia.com',role:'Operador',status:'Ativo'},{name:'Pedro Lima',email:'pedro@email.com',role:'Cliente',status:'Ativo'}]
export const pilotNotice='Protótipo de demonstração: dados e ações simulados, sem pagamentos reais.'
export const supportMessage='Precisa de ajuda ou deseja solicitar cancelamento após o aceite? Consulte as orientações de atendimento.'
export const predefinedMessages=['O entregador chegou.','Não encontramos o endereço.','Seu pedido está atrasado.','Precisamos confirmar uma informação do pedido.','Um item ficou indisponível; aguarde contato do suporte.']
export const operatorStoreId='store-001';export const requiredVolumeMl=1000;export const acceptanceWindowMinutes=5;export const orderMinVolumeMessage='Adicione pelo menos 1.000 ml para enviar o pedido.'
export const getStoreById=(id:string)=>mockStores.find(s=>s.id===id);export const getProductsByStoreId=(id:string)=>mockProducts.filter(p=>p.storeId===id);export const getProducts=getProductsByStoreId;export const getOrdersByCustomerId=(id:string)=>mockOrders.filter(o=>o.customerId===id);export const getNotificationsByCustomerId=()=>mockNotifications
export const getActiveStores=()=>mockStores.filter(s=>s.adminStatus==='ATIVA').sort((a,b)=>Number(b.isOpen)-Number(a.isOpen));export const getOperatorStore=()=>mockStores.find(s=>s.id===operatorStoreId)!;export const getAdminStores=()=>mockStores
export const getOrderStatusLabel=(s:OrderStatus)=>({AGUARDANDO_ACEITE:'Aguardando resposta',ACEITO:'Aceito',EM_PREPARO:'Em preparo',PRONTO:'Pronto',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Entregue',RECUSADO:'Recusado',EXPIRADO:'Expirado',CANCELADO:'Cancelado',FALHA_NA_ENTREGA:'Falha na entrega'} as Record<OrderStatus,string>)[s]
export const getStoreAvailabilityText=(s:Store)=>`${isStoreOpenNow(s)?'Aberta agora':`Fechada · ${nextOpeningText(s)}`} · ${s.deliveryAvailable?'Entrega disponível':'Entrega indisponível'}`
export const getFeeText=(s:Store)=>s.deliveryAvailable?(s.deliveryFeeCents?`Taxa R$ ${cents(s.deliveryFeeCents)}`:'Entrega grátis'):'Sem entrega disponível'
export const filterVisibleProducts=(id:string)=>getProductsByStoreId(id).filter(p=>p.active&&(p.available||p.showUnavailable));export const isStoreOrderable=(s:Store)=>s.adminStatus==='ATIVA'&&isStoreOpenNow(s)&&s.deliveryAvailable
export function calculateTotals(items:{product:Product;quantity:number}[],fee:number){const subtotalCents=items.reduce((sum,i)=>sum+i.product.priceCents*i.quantity,0);const volumeMl=items.reduce((sum,i)=>sum+i.product.volumeMl*i.quantity,0);return{subtotalCents,deliveryFeeCents:fee,totalCents:subtotalCents+fee,volumeMl}}
export const cents=(value:number)=>(value/100).toFixed(2).replace('.',',');export const isAddressCovered=(a:{neighborhood:string})=>a.neighborhood.trim().toLowerCase()==='centro';export const isCashChangeValid=(total:number,change?:number)=>change===undefined||change>=total
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
export const getStoreStatusColor=(s:AdminStatus)=>s==='ATIVA'?'text-secondary':s==='SUSPENSA'?'text-accent-foreground':'text-muted-foreground';export const adminStatusLabel=(s:AdminStatus)=>({EM_ANALISE:'Em análise',ATIVA:'Ativa',SUSPENSA:'Suspensa',DESATIVADA:'Desativada'}[s])
export const mockStore=mockStores[0];export const mockProduct=mockProducts[0];export const mockStoreIds=mockStores.map(s=>s.id);export const mockProductIds=mockProducts.map(p=>p.id);export const mockOrderIds=mockOrders.map(o=>o.id);export const allTraditionalImages=Object.values(traditionalAcaiImages);export const appName='AçaíConecta';export const cityLabel='Cametá, PA';export const version='2.5';export const sourceOfTruth='PRD 2.5';export const buildTarget='Fase 2 — Definição e Prototipação';export const noFavorites=true;export const noReviews=true;export const noPromotions=true;export const demoCustomer={id:'customer-001',name:'João da Silva',phone:'(91) 98888-0000',email:'joao@email.com'};export const paymentLabels={DINHEIRO:'Dinheiro na entrega',PIX:'Pix na entrega'};export type CartItem={product:Product;quantity:number;note?:string}
export function formatOrderDate(value:string){return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Belem'})}
export function formatTime(value:string){return new Date(value).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Belem'})}
export const mockAudit=[{at:iso(3),author:'admin',action:'Consulta de indicadores',reason:'Rotina do piloto'}]
export const mockExternalDiaryNote='Incidentes do piloto devem ser registrados no diário operacional externo.'
export const getOrderVolume=(o:Order)=>o.items.reduce((s,i)=>s+i.volumeMl*i.quantity,0)
export const getOrderById=(id:string)=>mockOrders.find(o=>o.id===id)
export const storeAdminStatusLabels:Record<AdminStatus,string>={EM_ANALISE:'Em análise',ATIVA:'Ativa',SUSPENSA:'Suspensa',DESATIVADA:'Desativada'}
export const orderStatusLabels=Object.fromEntries((Object.keys({AGUARDANDO_ACEITE:1,ACEITO:1,EM_PREPARO:1,PRONTO:1,SAIU_PARA_ENTREGA:1,ENTREGUE:1,RECUSADO:1,EXPIRADO:1,CANCELADO:1,FALHA_NA_ENTREGA:1}) as OrderStatus[]).map(s=>[s,getOrderStatusLabel(s)]))
export const mockStoresById=mockStores;export const getOrders=getOrdersByCustomerId;export const calculateOrderTotal=(items:OrderItem[])=>items.reduce((s,i)=>s+i.unitPriceCents*i.quantity,0);export const formatMoney=cents;export const getStoreStatusLabel=adminStatusLabel;export const getNotifications=()=>mockNotifications
export default {mockStores,mockProducts,mockOrders}

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
  const totals=calculateTotals(items,store.deliveryFeeCents)
  if(!Number.isSafeInteger(store.deliveryFeeCents)||store.deliveryFeeCents<0||!Number.isSafeInteger(totals.totalCents)) throw new Error('Taxa ou total inválido.')
  if(totals.volumeMl<requiredVolumeMl) throw new Error(orderMinVolumeMessage)
  if(!isAddressCovered(address)) throw new Error('A entrega está disponível somente no bairro Centro.')
  if(!address.street.trim()||!address.number.trim()||!/^\d{10,11}$/.test(phone.replace(/\D/g,''))) throw new Error('Informe rua, número e telefone com DDD.')
  if(address.street.length>180||address.number.length>20||(address.complement?.length??0)>100||(address.reference?.length??0)>255) throw new Error('Revise o tamanho dos campos do endereço.')
  if(!['PIX','DINHEIRO'].includes(payment)) throw new Error('Escolha dinheiro ou Pix na entrega.')
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
