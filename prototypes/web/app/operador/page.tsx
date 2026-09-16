'use client'

import { useEffect, useState } from 'react'
import { AppFrame, DemoNotice, SectionHeading, useToast } from '@/components/app-shell'
import { usePrototype } from '@/components/prototype-provider'
import { OrderPanel } from '@/components/order-panel'
import { PhotoField } from '@/components/photo-field'
import { Modal } from '@/components/modal'
import { useView } from '@/lib/use-view'
import { getSchedule, cents, isStoreOpenNow, operatorStoreId, parseMoney, type Product, type Store } from '@/lib/mock-data'

const operatorSessionKey='acaiconecta-operator-store'
function useOperatorStore(stores:Store[]) {
  const [id,setId]=useState(operatorStoreId)
  useEffect(()=>{try{setId(sessionStorage.getItem(operatorSessionKey)||operatorStoreId)}catch{}},[])
  const setStoreId=(value:string)=>{setId(value);try{sessionStorage.setItem(operatorSessionKey,value)}catch{}}
  return [stores.find(s=>s.id===id)??stores[0],setStoreId] as const
}

export default function OperadorPage() {
  const demo=usePrototype()
  const notify=useToast()
  const [view,setView]=useView()
  const [store,setStoreId]=useOperatorStore(demo.stores)
  const orders=demo.orders.filter(o=>o.storeId===store.id).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt))
  const pending=orders.filter(o=>o.status==='AGUARDANDO_ACEITE')
  const active=orders.filter(o=>['ACEITO','EM_PREPARO','PRONTO','SAIU_PARA_ENTREGA'].includes(o.status))
  const actor={role:'operador' as const,name:store.operator,storeId:store.id}
  function toggle(key:'isOpen'|'deliveryAvailable') {try{demo.updateStore({...store,[key]:!store[key]});notify('Disponibilidade atualizada.')}catch(error){notify(String(error),'error')}}
  return <AppFrame profile="operador"><div className="mx-auto max-w-6xl"><DemoNotice>Operação simulada · {store.name}.</DemoNotice>
    <label className="mb-4 block max-w-sm text-sm">Operando como (simulação de acesso; a implementação real exige autenticação própria por operador)<select className="demo-field" value={store.id} onChange={event=>setStoreId(event.target.value)}>{demo.stores.map(s=><option key={s.id} value={s.id}>{s.operator} · {s.name}</option>)}</select></label>
    <SectionHeading eyebrow="Painel da batedeira" title={view==='produtos'?'Catálogo':view==='config'?'Configurações':'Pedidos e operação'} />
    {store.adminStatus!=='ATIVA'&&<p role="alert" className="mb-4 rounded-xl bg-accent/20 p-4">Batedeira {store.adminStatus.toLowerCase()}: novos pedidos bloqueados. O histórico e os pedidos existentes permanecem disponíveis.</p>}
    <nav aria-label="Seções da batedeira" className="mb-4 flex flex-wrap gap-2">{[['overview','Visão geral'],['pedidos','Pedidos'],['produtos','Catálogo'],['config','Configurações']].map(([key,label])=><button key={key} className="demo-button" aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}</nav>
    {(view==='overview'||view==='pedidos')&&<>
      {view==='overview'&&<><div className="mb-3 flex flex-wrap gap-3"><button className="demo-button" aria-pressed={store.isOpen} onClick={()=>toggle('isOpen')}>{store.isOpen?'Fechar batedeira':'Abrir batedeira'}</button><button className="demo-button" aria-pressed={store.deliveryAvailable} onClick={()=>toggle('deliveryAvailable')}>{store.deliveryAvailable?'Pausar entregas':'Disponibilizar entregas'}</button></div><dl className="compact-metrics mb-4"><div><dt>Aguardando</dt><dd>{pending.length}</dd></div><div><dt>Em operação</dt><dd>{active.length}</dd></div><div><dt>Entregues</dt><dd>{orders.filter(o=>o.status==='ENTREGUE').length}</dd></div></dl></>}
      {pending.length>0&&<p role="status" className="mb-3 rounded-xl border border-accent bg-accent/10 p-3 font-bold">{pending.length} pedido(s) aguardando resposta. Prazo de 5 minutos.</p>}
      <p className="mb-3 text-xs text-muted-foreground">{isStoreOpenNow(store)?'Batedeira aberta no horário atual.':'Batedeira fechada agora (horário ou fechamento manual).'} {store.deliveryAvailable?'Entregas habilitadas.':'Entregas pausadas.'} Mantenha o painel aberto.</p>
      {orders.some(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author==='Administrador da demonstração'))&&<details className="mb-3 rounded-xl border p-3"><summary>Cancelamentos e intervenções administrativas</summary>{orders.filter(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author==='Administrador da demonstração')).map(o=><p key={o.id} className="mt-2 break-all text-sm">{o.id}: {o.status==='CANCELADO'?'Cancelado':'Intervenção registrada'} — consulte Pedidos para o histórico.</p>)}</details>}
      <div className="grid gap-4">{(view==='overview'?[...pending,...active].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)):orders).map(order=><OrderPanel key={order.id} order={order} actor={actor}/>)}{(view==='overview'?pending.length+active.length===0:orders.length===0)&&<p className="rounded-xl border p-4">Nenhum pedido {view==='overview'?'aguardando ou em operação':'nesta demonstração'}.</p>}</div>
    </>}
    {view==='produtos'&&<Catalog storeId={store.id}/>}
    {view==='config'&&<Settings store={store}/>}
  </div></AppFrame>
}

function Catalog({storeId}:{storeId:string}) {
  const demo=usePrototype()
  const notify=useToast()
  const [editing,setEditing]=useState<Product|null>(null)
  const [price,setPrice]=useState('')
  const [error,setError]=useState('')
  function edit(product:Product) {setEditing({...product});setPrice(cents(product.priceCents));setError('')}
  function save() {
    try{if(!editing)return;demo.saveProduct({...editing,priceCents:parseMoney(price)});setEditing(null);notify('Catálogo atualizado. Pedidos anteriores preservados.')}
    catch(error){setError(error instanceof Error?error.message:'Revise os dados.')}
  }
  return <><button className="demo-primary mb-5" onClick={()=>edit({id:crypto.randomUUID(),storeId,name:'',description:'',volumeMl:1000,priceCents:0,active:true,available:true,showUnavailable:false})}>Adicionar produto</button><div className="grid gap-4 sm:grid-cols-2">{demo.products.filter(p=>p.storeId===storeId).map(p=><article key={p.id} className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-bold">{p.name}</h2><p>{p.volumeMl} ml · R$ {cents(p.priceCents)}</p><p className="mt-2 text-sm">{!p.active?'Arquivado':p.available?'Disponível':'Indisponível'}{!p.available&&p.active&&` · ${p.showUnavailable?'Visível para consulta':'Oculto no catálogo público'}`}</p><div className="mt-3 flex flex-wrap gap-2"><button className="demo-button" onClick={()=>edit(p)}>Editar produto</button><button className="demo-button" onClick={()=>demo.saveProduct({...p,available:!p.available})}>{p.available?'Indisponibilizar':'Disponibilizar'}</button><button className="demo-button" onClick={()=>demo.saveProduct({...p,active:!p.active})}>{p.active?'Arquivar':'Restaurar'}</button></div>{p.updatedAt&&<p className="mt-3 text-xs">Atualizado em {new Date(p.updatedAt).toLocaleString('pt-BR')}</p>}</article>)}</div>
    {editing&&<Modal title="Produto" onClose={()=>setEditing(null)}><form className="space-y-4" onSubmit={e=>{e.preventDefault();save()}}><label>Nome<input required maxLength={150} className="demo-field" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><PhotoField value={editing.image} onChange={image=>setEditing({...editing,image})}/><label>Descrição<textarea maxLength={500} className="demo-field" value={editing.description??''} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><label>Volume (ml)<input required type="number" min={1} max={65535} step={1} className="demo-field" value={editing.volumeMl} onChange={e=>setEditing({...editing,volumeMl:Number(e.target.value)})}/></label><label>Preço (R$)<input required inputMode="decimal" className="demo-field" value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="flex gap-2"><input type="checkbox" checked={editing.showUnavailable} onChange={e=>setEditing({...editing,showUnavailable:e.target.checked})}/>Exibir quando indisponível</label>{error&&<p role="alert">{error}</p>}<button className="demo-primary">Salvar produto</button></form></Modal>}
  </>
}
function Settings({store}:{store:Store}) {
  const demo=usePrototype()
  const notify=useToast()
  const [fee,setFee]=useState(cents(store.deliveryFeeCents))
  const [min,setMin]=useState(store.estimatedRange.match(/\d+/g)?.[0]??'25')
  const [max,setMax]=useState(store.estimatedRange.match(/\d+/g)?.[1]??'35')
  const [schedule,setSchedule]=useState(getSchedule(store))
  const [error,setError]=useState('')
  return <form className="max-w-xl space-y-4 rounded-2xl border bg-card p-5" onSubmit={e=>{e.preventDefault();try{if(!Number.isInteger(Number(min))||!Number.isInteger(Number(max))||Number(min)<1||Number(max)<Number(min))throw new Error('Informe uma faixa válida, com máximo maior ou igual ao mínimo.');demo.updateStore({...store,deliveryFeeCents:parseMoney(fee),estimatedRange:`${min}–${max} min`,schedule,hours:'Consulte os horários por dia'});setError('');notify('Configurações salvas. Pedidos anteriores preservam taxa e estimativa.')}catch(error){setError(error instanceof Error?error.message:'Revise os dados.')}}}>
    <p>Área do piloto: Centro, Cametá/PA.</p><label>Taxa de entrega (R$)<input required inputMode="decimal" className="demo-field" value={fee} onChange={e=>setFee(e.target.value)}/></label><label>Estimativa mínima (minutos)<input required type="number" min={1} className="demo-field" value={min} onChange={e=>setMin(e.target.value)}/></label><label>Estimativa máxima (minutos)<input required type="number" min={1} className="demo-field" value={max} onChange={e=>setMax(e.target.value)}/></label><fieldset className="space-y-3"><legend className="font-bold">Horários regulares</legend>{schedule.map((entry,index)=><div key={entry.day} className="flex flex-wrap items-center gap-2"><label className="w-28"><input type="checkbox" checked={entry.active} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,active:e.target.checked}:row))}/> {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][entry.day]}</label><input aria-label={`Abertura ${['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][entry.day]}`} type="time" required className="rounded border p-2" value={entry.opens} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,opens:e.target.value}:row))}/><input aria-label={`Fechamento ${['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][entry.day]}`} type="time" required className="rounded border p-2" value={entry.closes} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,closes:e.target.value}:row))}/></div>)}</fieldset>{error&&<p role="alert">{error}</p>}<button className="demo-primary">Salvar configurações</button>
  </form>
}
