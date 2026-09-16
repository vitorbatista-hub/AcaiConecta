import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isStoreOpenNow, nextOpeningText, appendOrder, applyTransition, createOrderSnapshot, expireOrders, mockProducts, mockStores, parseMoney } from '../lib/mock-data.ts'
const address={street:'Rua de teste',number:'10',neighborhood:'Centro'}
const phone='91900000000'
const store={...mockStores[0],deliveryFeeCents:250,schedule:Array.from({length:7},(_,day)=>({day,active:true,opens:'00:00',closes:'23:59'}))}
const items=[{product:mockProducts[1],quantity:1}]
const create=(entries=items,s=store,a=address,payment='PIX',change,note)=>createOrderSnapshot(entries,s,a,phone,payment,change,note)
const operator={role:'operador',name:'Operador',storeId:store.id}
const customer={role:'cliente',name:'Cliente',customerId:'customer-001'}
const admin={role:'admin',name:'Administrador'}

test('total em centavos, taxa e snapshot independente do endereço original',()=>{
  const original={...address};const o=create(items,store,original)
  original.street='Alterada'
  assert.equal(o.totalCents,3450);assert.equal(o.address.street,address.street)
  assert.equal(Date.parse(o.acceptedDeadline)-Date.parse(o.createdAt),300000)
})
test('Pix não leva troco; dinheiro exige valor suficiente e inteiro',()=>{
  assert.equal(create(items,store,address,'PIX',5000).changeForCents,undefined)
  assert.throws(()=>create(items,store,address,'DINHEIRO',3000))
  assert.throws(()=>create(items,store,address,'DINHEIRO',NaN))
  assert.equal(create(items,store,address,'DINHEIRO',5000).changeForCents,5000)
})
test('1 litro é validado pelo volume, com múltiplos itens',()=>{
  assert.throws(()=>create([{product:mockProducts[0],quantity:1}]))
  assert.equal(create([{product:mockProducts[0],quantity:2}]).items[0].quantity,2)
})
test('bloqueia mistura de batedeiras, itens inativos e quantidades inválidas',()=>{
  for(const quantity of [0,-1,0.5,NaN,65536])assert.throws(()=>create([{product:mockProducts[1],quantity}]))
  for(const product of [mockProducts[4],{...mockProducts[1],active:false},{...mockProducts[1],available:false}]) assert.throws(()=>create([{product,quantity:1}]))
})
test('disponibilidade e bairro são revalidados',()=>{
  for(const s of [{...store,isOpen:false},{...store,deliveryAvailable:false},{...store,adminStatus:'SUSPENSA'}])assert.throws(()=>create(items,s))
  assert.throws(()=>create(items,store,{...address,neighborhood:'Outro'}))
})
test('limites de observações e campos obrigatórios',()=>{
  assert.throws(()=>create(items,store,address,'PIX',undefined,'x'.repeat(501)))
  assert.throws(()=>create([{...items[0],note:'x'.repeat(301)}]))
  assert.throws(()=>create(items,store,{...address,street:' '}))
})
test('matriz completa aceita os caminhos esperados e preserva eventos',()=>{
  let order=create()
  for(const next of ['ACEITO','EM_PREPARO','PRONTO','SAIU_PARA_ENTREGA','ENTREGUE'])order=applyTransition(order,next,operator)
  assert.equal(order.timeline.length,6)
  assert.throws(()=>applyTransition(order,'ACEITO',operator))
})
test('impede saltos e perfis sem vínculo',()=>{
  const order=create()
  assert.throws(()=>applyTransition(order,'ENTREGUE',operator))
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
  for(const status of ['ACEITO','EM_PREPARO','PRONTO']){
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
