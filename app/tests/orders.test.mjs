import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isStoreOpenNow, nextOpeningText, appendOrder, applyTransition, choosePayment, confirmPixPayment, createOrderSnapshot, expireOrders, getFeeText, parseMoney, visibleProducts, paymentChoiceWindowMs, pixPaymentWindowMs } from '../lib/domain.ts'
import { seedProducts, seedStores } from './fixtures.ts'
import { officialNeighborhoods, neighborhoodLabel } from '../lib/neighborhoods.ts'
const address={street:'Rua de teste',number:'10',neighborhood:'Centro'}
const phone='91900000000'
const store={...seedStores[0],coverage:[{neighborhood:'Centro',feeCents:250,estimatedRange:'25–35 min'},{neighborhood:'Aldeia',feeCents:400,estimatedRange:'30–40 min'}],schedule:Array.from({length:7},(_,day)=>({day,active:true,opens:'00:00',closes:'23:59'}))}
const items=[{product:seedProducts[1],quantity:1}]
const create=(entries=items,s=store,a=address,note)=>createOrderSnapshot(entries,s,a,phone,note)
const operator={role:'operador',name:'Operador',storeId:store.id}
const customer={role:'cliente',name:'Cliente',customerId:'customer-001'}
const admin={role:'admin',name:'Administrador'}

test('total em centavos, taxa e snapshot independente do endereço original',()=>{
  const original={...address};const o=create(items,store,original)
  original.street='Alterada'
  assert.equal(o.totalCents,1250);assert.equal(o.address.street,address.street)
  assert.equal(Date.parse(o.acceptedDeadline)-Date.parse(o.createdAt),300000)
})
test('taxa e estimativa vêm do bairro de entrega',()=>{
  const centro=create();const aldeia=create(items,store,{...address,neighborhood:'Aldeia'})
  assert.equal(centro.deliveryFeeCents,250);assert.equal(centro.estimatedRange,'25–35 min')
  assert.equal(aldeia.deliveryFeeCents,400);assert.equal(aldeia.totalCents,1400);assert.equal(aldeia.estimatedRange,'30–40 min')
  assert.equal(getFeeText(store,'Aldeia'),'Taxa R$ 4,00');assert.equal(getFeeText(store),'Taxa a partir de R$ 2,50')
  assert.match(getFeeText(store,'Matinha'),/Não entrega/)
})
test('a lista oficial tem 13 bairros urbanos e o Centro mostra o nome alternativo',()=>{
  assert.equal(officialNeighborhoods.length,13)
  assert.equal(neighborhoodLabel('Centro'),'Centro (São João Batista)');assert.equal(neighborhoodLabel('Aldeia'),'Aldeia')
})
test('pedido nasce sem forma de pagamento; ela é escolhida depois do aceite',()=>{
  const order=create();assert.equal(order.payment,undefined);assert.equal(order.paymentDeadline,undefined)
  assert.throws(()=>choosePayment(order,'DINHEIRO',store,customer))
})
test('1 litro é validado pelo volume, com múltiplos itens',()=>{
  assert.throws(()=>create([{product:seedProducts[0],quantity:1}]))
  assert.equal(create([{product:seedProducts[0],quantity:2}]).items[0].quantity,2)
})
test('bloqueia mistura de batedeiras, itens inativos e quantidades inválidas',()=>{
  for(const quantity of [0,-1,0.5,NaN,65536])assert.throws(()=>create([{product:seedProducts[1],quantity}]))
  for(const product of [seedProducts.find(p=>p.storeId==='store-002'),{...seedProducts[1],active:false},{...seedProducts[1],available:false}]) assert.throws(()=>create([{product,quantity:1}]))
})
test('disponibilidade e bairro são revalidados',()=>{
  for(const s of [{...store,isOpen:false},{...store,deliveryAvailable:false},{...store,adminStatus:'SUSPENSA'}])assert.throws(()=>create(items,s))
  assert.throws(()=>create(items,store,{...address,neighborhood:'Outro'}))
  assert.throws(()=>create(items,store,{...address,neighborhood:'Matinha'}),/não entrega/)
  assert.throws(()=>create(items,{...store,coverage:[]}))
})
test('limites de observações e campos obrigatórios',()=>{
  assert.throws(()=>create(items,store,address,'x'.repeat(501)))
  assert.throws(()=>create([{...items[0],note:'x'.repeat(301)}]))
  assert.throws(()=>create(items,store,{...address,street:' '}))
})
test('matriz completa aceita os caminhos esperados e preserva eventos',()=>{
  let order=create()
  order=applyTransition(order,'ACEITO',operator)
  order=choosePayment(order,'DINHEIRO',store,customer)
  for(const next of ['PRONTO','SAIU_PARA_ENTREGA','ENTREGUE'])order=applyTransition(order,next,operator)
  assert.equal(order.timeline.length,6)
  assert.throws(()=>applyTransition(order,'ACEITO',operator))
})
test('impede saltos e perfis sem vínculo',()=>{
  const order=create()
  assert.throws(()=>applyTransition(order,'ENTREGUE',operator))
  const accepted=applyTransition(order,'ACEITO',operator)
  assert.throws(()=>applyTransition(accepted,'EM_PREPARO',operator),'a batedeira não inicia o preparo antes da escolha')
  assert.throws(()=>applyTransition(order,'ACEITO',{...operator,storeId:'outra'}))
  assert.throws(()=>applyTransition(order,'ACEITO',customer))
  assert.throws(()=>applyTransition(order,'ACEITO',admin))
  assert.throws(()=>applyTransition(order,'CANCELADO',{...customer,customerId:'outra'}))
})
test('recusa e falha exigem motivo; estados terminais não reabrem',()=>{
  const order=create();assert.throws(()=>applyTransition(order,'RECUSADO',operator))
  const refused=applyTransition(order,'RECUSADO',operator,'Sem capacidade')
  assert.throws(()=>applyTransition(refused,'ACEITO',operator))
  const shipping={...order,status:'SAIU_PARA_ENTREGA'}
  assert.throws(()=>applyTransition(shipping,'FALHA_NA_ENTREGA',operator,' '))
  assert.equal(applyTransition(shipping,'FALHA_NA_ENTREGA',operator,'Cliente ausente').status,'FALHA_NA_ENTREGA')
})
test('cliente cancela só antes do aceite; operação cancela só antes da saída',()=>{
  const order=create();assert.equal(applyTransition(order,'CANCELADO',customer).status,'CANCELADO')
  assert.throws(()=>applyTransition(order,'CANCELADO',operator,'Motivo'))
  for(const status of ['ACEITO','AGUARDANDO_PAGAMENTO','EM_PREPARO','PRONTO']){
    const accepted={...order,status}
    assert.throws(()=>applyTransition(accepted,'CANCELADO',customer,'Motivo'))
    assert.throws(()=>applyTransition(accepted,'CANCELADO',admin))
    assert.equal(applyTransition(accepted,'CANCELADO',admin,'Impossibilidade operacional').status,'CANCELADO')
  }
  assert.throws(()=>applyTransition({...order,status:'SAIU_PARA_ENTREGA'},'CANCELADO',admin,'Motivo'))
})
test('expiração no limite de cinco minutos, automática e sem eventos duplicados',()=>{
  const order=create();const deadline=Date.parse(order.acceptedDeadline)
  assert.equal(applyTransition(order,'ACEITO',operator,undefined,deadline-1).status,'ACEITO')
  assert.throws(()=>applyTransition(order,'ACEITO',operator,undefined,deadline))
  assert.throws(()=>applyTransition(order,'EXPIRADO',{role:'sistema',name:'Sistema'},undefined,deadline-1))
  const expired=expireOrders([order],deadline)
  assert.equal(expired[0].status,'EXPIRADO')
  assert.equal(expireOrders(expired,deadline+1000)[0].timeline.length,2)
})
test('reenvio com mesma chave não duplica pedidos',()=>{
  const order=create();const first=appendOrder([],order,'request-1')
  assert.equal(appendOrder(first,create(),'request-1'),first)
  assert.equal(appendOrder(first,create(),'request-2').length,2)
})
test('conversão monetária exata sem aceitar negativos, notação exponencial ou NaN',()=>{
  assert.equal(parseMoney('18,05'),1805);assert.equal(parseMoney('0.01'),1)
  for(const value of ['-1','1e3','NaN','Infinity','1.234',''])assert.throws(()=>parseMoney(value))
})

test('horários usam o fuso de Cametá, domingo zero e fechamento manual prioritário',()=>{
  const scheduled={...store,isOpen:true,schedule:[{day:0,opens:'09:00',closes:'18:00',active:true}]}
  assert.equal(isStoreOpenNow(scheduled,new Date('2026-09-13T12:00:00Z')),true)
  assert.equal(isStoreOpenNow(scheduled,new Date('2026-09-13T21:00:00Z')),false)
  assert.equal(isStoreOpenNow({...scheduled,isOpen:false},new Date('2026-09-13T12:00:00Z')),false)
  assert.equal(isStoreOpenNow(scheduled,new Date('2026-09-14T12:00:00Z')),false)
  assert.match(nextOpeningText(scheduled,new Date('2026-09-13T11:00:00Z')),/hoje às 09:00/)
})


test('próxima abertura inclui a semana seguinte e ordena intervalos do mesmo dia',()=>{
  const sunday={...store,schedule:[{day:0,opens:'09:00',closes:'18:00',active:true}]}
  assert.match(nextOpeningText(sunday,new Date('2026-09-13T22:00:00Z')),/domingo às 09:00/)
  const intervals={...store,schedule:[{day:1,opens:'14:00',closes:'18:00',active:true},{day:1,opens:'09:00',closes:'12:00',active:true}]}
  assert.match(nextOpeningText(intervals,new Date('2026-09-13T22:00:00Z')),/amanhã às 09:00/)
})

test('o cliente vê só produtos ativos e disponíveis (ou indisponíveis marcados para exibição)',()=>{
  const base=seedProducts.filter(p=>p.storeId==='store-001')
  assert.equal(visibleProducts(base).length,base.length)
  const mixed=[{...base[0],active:false},{...base[1],available:false,showUnavailable:false},{...base[2],available:false,showUnavailable:true},base[3]]
  assert.deepEqual(visibleProducts(mixed).map(p=>p.id),[base[2].id,base[3].id])
})
const accept=(order=create(),at=Date.parse(order.createdAt)+1000)=>applyTransition(order,'ACEITO',operator,undefined,at)
test('aceite abre 10 minutos para escolher a forma de pagamento',()=>{
  const at=Date.parse(create().createdAt)+1000;const accepted=accept(create(),at)
  assert.equal(Date.parse(accepted.paymentDeadline)-at,paymentChoiceWindowMs)
  const cash=choosePayment(accepted,'DINHEIRO',store,customer,5000,at+60000)
  assert.equal(cash.status,'EM_PREPARO');assert.equal(cash.payment,'DINHEIRO');assert.equal(cash.changeForCents,5000)
  assert.throws(()=>choosePayment(accepted,'DINHEIRO',store,customer,1000,at+60000),/troco/i)
  assert.throws(()=>choosePayment(accepted,'DINHEIRO',store,customer,NaN,at+60000))
  assert.throws(()=>choosePayment(accepted,'CARTAO',store,customer,undefined,at+60000))
  assert.throws(()=>choosePayment(accepted,'DINHEIRO',store,{...customer,customerId:'outra'},undefined,at+60000))
  assert.throws(()=>choosePayment(accepted,'DINHEIRO',store,operator,undefined,at+60000))
  assert.throws(()=>choosePayment(cash,'PIX',store,customer),/já foi escolhida|aceite/)
})
test('Pix só para batedeira com conta verificada, sem troco, e aguarda 10 minutos pelo pagamento',()=>{
  const at=Date.parse(create().createdAt)+1000;const accepted=accept(create(),at)
  for(const paymentAccountStatus of ['NAO_CADASTRADA','PENDENTE','RECUSADA'])assert.throws(()=>choosePayment(accepted,'PIX',{paymentAccountStatus},customer,undefined,at+1),/não recebe Pix/)
  assert.throws(()=>choosePayment(accepted,'PIX',{paymentAccountStatus:'VERIFICADA'},customer,5000,at+1),/troco/i)
  const pix=choosePayment(accepted,'PIX',{paymentAccountStatus:'VERIFICADA'},customer,undefined,at+1000)
  assert.equal(pix.status,'AGUARDANDO_PAGAMENTO');assert.equal(Date.parse(pix.pixDeadline)-(at+1000),pixPaymentWindowMs)
  assert.throws(()=>applyTransition(pix,'EM_PREPARO',operator),'a batedeira não confirma o pagamento')
  assert.throws(()=>applyTransition(pix,'EM_PREPARO',{role:'sistema',name:'Sistema'},undefined,at+2000),'sem confirmação do provedor')
})
test('confirmação do Pix é idempotente e respeita o prazo',()=>{
  const at=Date.parse(create().createdAt)+1000
  const pix=choosePayment(accept(create(),at),'PIX',{paymentAccountStatus:'VERIFICADA'},customer,undefined,at+1000)
  const paid=confirmPixPayment(pix,at+5000)
  assert.equal(paid.status,'EM_PREPARO');assert.equal(paid.paidAt,new Date(at+5000).toISOString())
  const again=confirmPixPayment(paid,at+9000)
  assert.equal(again,paid);assert.equal(again.timeline.length,paid.timeline.length)
  assert.throws(()=>confirmPixPayment(pix,Date.parse(pix.pixDeadline)),/prazo|permitir|perfil/i)
  assert.throws(()=>confirmPixPayment(create()),/não aguarda/)
})
test('sem escolha em 10 minutos o pedido é encerrado sem custo',()=>{
  const at=Date.parse(create().createdAt)+1000;const accepted=accept(create(),at);const deadline=Date.parse(accepted.paymentDeadline)
  assert.equal(expireOrders([accepted],deadline-1)[0].status,'ACEITO')
  const [cancelled]=expireOrders([accepted],deadline)
  assert.equal(cancelled.status,'CANCELADO');assert.equal(cancelled.timeline.at(-1).reason,'Forma de pagamento não escolhida')
  assert.throws(()=>choosePayment(accepted,'DINHEIRO',store,customer,undefined,deadline),/prazo/)
  assert.equal(expireOrders([cancelled],deadline+1000)[0].timeline.length,cancelled.timeline.length)
})
test('Pix não pago em 10 minutos cancela com motivo "pagamento expirado"',()=>{
  const at=Date.parse(create().createdAt)+1000
  const pix=choosePayment(accept(create(),at),'PIX',{paymentAccountStatus:'VERIFICADA'},customer,undefined,at+1000);const deadline=Date.parse(pix.pixDeadline)
  assert.equal(expireOrders([pix],deadline-1)[0].status,'AGUARDANDO_PAGAMENTO')
  const [cancelled]=expireOrders([pix],deadline)
  assert.equal(cancelled.status,'CANCELADO');assert.equal(cancelled.timeline.at(-1).reason,'Pagamento expirado')
  assert.throws(()=>confirmPixPayment(pix,deadline),/./)
})
