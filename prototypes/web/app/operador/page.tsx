'use client'

import { useEffect, useState } from 'react'
import { AppFrame, SectionHeading, useToast } from '@/components/app-shell'
import { usePrototype } from '@/components/prototype-provider'
import { OrderPanel } from '@/components/order-panel'
import { PhotoField } from '@/components/photo-field'
import { Modal } from '@/components/modal'
import { RoleLogin, RoleSignedInBar, useRoleSignIn } from '@/components/role-login'
import { useView } from '@/lib/use-view'
import { storeDailyMetrics } from '@/lib/order-presentation'
import { adminActorName, allowedProductVolumesMl, getSchedule, cents, isStoreOpenNow, operatorStoreId, parseMoney, type Product, type Store } from '@/lib/mock-data'

const operatorSessionKey='acaiconecta-operator-store'
function useOperatorStore(stores:Store[]) {
  const [id,setId]=useState(operatorStoreId)
  useEffect(()=>{try{setId(sessionStorage.getItem(operatorSessionKey)||operatorStoreId)}catch{}},[])
  const setStoreId=(value:string)=>{setId(value);try{sessionStorage.setItem(operatorSessionKey,value)}catch{}}
  return [stores.find(s=>s.id===id)??stores[0],setStoreId] as const
}

function OperatorLogin({stores,onSignIn}:{stores:Store[];onSignIn:(storeId:string)=>void}) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  return <RoleLogin title="Entrar no painel da batedeira" description="Acesse com o e-mail cadastrado para o operador. Esta etapa ainda não realiza autenticação no servidor; use uma senha de teste, nunca uma senha real." error={error} onSubmit={event=>{
    event.preventDefault()
    const store=stores.find(s=>s.operatorEmail.toLowerCase()===email.trim().toLowerCase())
    if(!store){setError('E-mail não encontrado entre os operadores cadastrados.');return}
    setError('');onSignIn(store.id)
  }}>
    <label>E-mail do operador<input className="demo-field" required type="email" maxLength={254} autoComplete="off" value={email} onChange={event=>setEmail(event.target.value)} /></label>
    <label>Senha<input className="demo-field" required type="password" autoComplete="off" value={password} onChange={event=>setPassword(event.target.value)} /><span className="text-xs text-muted-foreground">Use uma senha de teste — não a sua senha real.</span></label>
    <details className="text-xs text-muted-foreground"><summary>E-mails cadastrados para teste</summary><ul className="mt-2 space-y-1">{stores.map(s=><li key={s.id}>{s.operatorEmail} · {s.name}</li>)}</ul></details>
  </RoleLogin>
}

export default function OperadorPage() {
  const demo=usePrototype()
  const notify=useToast()
  const [view,setView]=useView()
  const [store,setStoreId]=useOperatorStore(demo.stores)
  const [signedIn,setSignedIn]=useRoleSignIn('acaiconecta-operator-signed-in')
  const [confirmToggle,setConfirmToggle]=useState<'isOpen'|'deliveryAvailable'|null>(null)
  const orders=demo.orders.filter(o=>o.storeId===store.id).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt))
  const pending=orders.filter(o=>o.status==='AGUARDANDO_ACEITE')
  const active=orders.filter(o=>['ACEITO','EM_PREPARO','PRONTO','SAIU_PARA_ENTREGA'].includes(o.status))
  const daily=storeDailyMetrics(demo.orders,store.id,demo.now)
  const actor={role:'operador' as const,name:store.operator,storeId:store.id}
  function toggle(key:'isOpen'|'deliveryAvailable') {try{demo.updateStore({...store,[key]:!store[key]});notify('Disponibilidade atualizada.')}catch(error){notify(String(error),'error')}}
  if(!signedIn) return <AppFrame profile="operador"><OperatorLogin stores={demo.stores} onSignIn={id=>{setStoreId(id);setSignedIn(true)}} /></AppFrame>
  return <AppFrame profile="operador"><div className="mx-auto max-w-6xl">
    <RoleSignedInBar onSignOut={()=>setSignedIn(false)}>Operando como <b>{store.operator}</b> · {store.name}</RoleSignedInBar>
    <SectionHeading eyebrow={`Painel da batedeira · ${store.name}`} title={view==='produtos'?'Catálogo':view==='config'?'Configurações':'Pedidos e operação'} />
    {store.adminStatus!=='ATIVA'&&<p role="alert" className="mb-4 rounded-xl bg-accent/20 p-4">Batedeira {store.adminStatus.toLowerCase()}: novos pedidos bloqueados. O histórico e os pedidos existentes permanecem disponíveis.</p>}
    <nav aria-label="Seções da batedeira" className="mb-4 flex flex-wrap gap-2">{[['overview','Visão geral'],['pedidos','Pedidos'],['produtos','Catálogo'],['config','Configurações']].map(([key,label])=><button key={key} className="demo-button" aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}</nav>
    {(view==='overview'||view==='pedidos')&&<>
      {view==='overview'&&<><div className="mb-3 flex flex-wrap gap-3"><button className={store.isOpen?'status-toggle-open':'status-toggle-closed'} aria-pressed={store.isOpen} onClick={()=>setConfirmToggle('isOpen')}>{store.isOpen?'Aberta · Fechar batedeira':'Fechada · Abrir batedeira'}</button><button className={store.deliveryAvailable?'status-toggle-open':'status-toggle-closed'} aria-pressed={store.deliveryAvailable} onClick={()=>setConfirmToggle('deliveryAvailable')}>{store.deliveryAvailable?'Entregas disponíveis · Pausar entregas':'Entregas pausadas · Disponibilizar entregas'}</button></div><dl className="compact-metrics mb-4"><div><dt>Aguardando</dt><dd>{pending.length}</dd></div><div><dt>Em operação</dt><dd>{active.length}</dd></div><div><dt>Entregues</dt><dd>{orders.filter(o=>o.status==='ENTREGUE').length}</dd></div><div><dt>Lucro do dia</dt><dd>R$ {cents(daily.revenueCents)}</dd></div><div><dt>Entregas hoje</dt><dd>{daily.deliveredToday}</dd></div><div><dt>Pedidos aceitos hoje</dt><dd>{daily.acceptedToday}</dd></div></dl>
      {confirmToggle&&<Modal title={confirmToggle==='isOpen'?(store.isOpen?'Fechar a batedeira?':'Abrir a batedeira?'):(store.deliveryAvailable?'Pausar as entregas?':'Disponibilizar as entregas?')} onClose={()=>setConfirmToggle(null)}><p className="mb-4">{confirmToggle==='isOpen'?(store.isOpen?'Enquanto fechada, a batedeira não recebe novos pedidos.':'Ao abrir, a batedeira volta a receber novos pedidos.'):(store.deliveryAvailable?'Enquanto pausada, os clientes não poderão solicitar entrega. O atendimento presencial não é afetado.':'Ao disponibilizar, os clientes voltam a poder solicitar entrega.')}</p><div className="flex flex-wrap gap-2"><button className="demo-button" onClick={()=>setConfirmToggle(null)}>Cancelar</button><button className="demo-primary" onClick={()=>{toggle(confirmToggle);setConfirmToggle(null)}}>{confirmToggle==='isOpen'?(store.isOpen?'Confirmar fechamento':'Confirmar abertura'):(store.deliveryAvailable?'Confirmar pausa':'Confirmar disponibilização')}</button></div></Modal>}</>}
      {pending.length>0&&<p role="status" className="mb-3 rounded-xl border border-accent bg-accent/10 p-3 font-bold">{pending.length} pedido(s) aguardando resposta. Prazo de 5 minutos.</p>}
      <p className="mb-3 text-xs text-muted-foreground">{isStoreOpenNow(store)?'Batedeira aberta no horário atual.':'Batedeira fechada agora (horário ou fechamento manual).'} {store.deliveryAvailable?'Entregas habilitadas.':'Entregas pausadas.'} Mantenha o painel aberto.</p>
      {orders.some(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author===adminActorName))&&<details className="mb-3 rounded-xl border p-3"><summary>Cancelamentos e intervenções administrativas</summary>{orders.filter(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author===adminActorName)).map(o=><p key={o.id} className="mt-2 break-all text-sm">{o.id}: {o.status==='CANCELADO'?'Cancelado':'Intervenção registrada'} — consulte Pedidos para o histórico.</p>)}</details>}
      <div className="grid gap-4">{(view==='overview'?[...pending,...active].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)):orders).map(order=><OrderPanel key={order.id} order={order} actor={actor}/>)}{(view==='overview'?pending.length+active.length===0:orders.length===0)&&<p className="rounded-xl border p-4">Nenhum pedido {view==='overview'?'aguardando ou em operação':'registrado ainda'}.</p>}</div>
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
    {editing&&<Modal title="Produto" onClose={()=>setEditing(null)}><form className="space-y-4" onSubmit={e=>{e.preventDefault();save()}}><label>Nome<input required maxLength={150} className="demo-field" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><PhotoField value={editing.image} onChange={image=>setEditing({...editing,image})}/><label>Descrição<textarea maxLength={500} className="demo-field" value={editing.description??''} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><label>Tamanho<select required className="demo-field" value={editing.volumeMl} onChange={e=>setEditing({...editing,volumeMl:Number(e.target.value)})}>{allowedProductVolumesMl.map(volume=><option key={volume} value={volume}>{volume} ml {volume===1000?'(1 litro)':'(meio litro)'}</option>)}</select></label><label>Preço (R$)<input required inputMode="decimal" className="demo-field" value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="flex gap-2"><input type="checkbox" checked={editing.showUnavailable} onChange={e=>setEditing({...editing,showUnavailable:e.target.checked})}/>Exibir quando indisponível</label>{error&&<p role="alert">{error}</p>}<button className="demo-primary">Salvar produto</button></form></Modal>}
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
