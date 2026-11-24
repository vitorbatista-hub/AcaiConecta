'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MapPin, Plus } from 'lucide-react'
import { AppFrame, SectionHeading, StatusPill, useToast } from '@/components/app-shell'
import { useApp } from '@/components/app-provider'
import { OrderPanel } from '@/components/order-panel'
import { PhotoField } from '@/components/photo-field'
import { Modal } from '@/components/modal'
import { StaffSignedInBar, useStaffSession } from '@/components/staff-session'
import { useView } from '@/lib/use-view'
import { storeDailyMetrics } from '@/lib/order-presentation'
import { adminActorName, allowedProductVolumesMl, getSchedule, cents, isStoreOpenNow, parseMoney, type Product, type Store } from '@/lib/domain'

export default function OperadorPage() {
  const ctx=useApp()
  const [session,signOut]=useStaffSession('operador')
  const store=ctx.stores.find(s=>s.id===session?.storeId)
  const profile=session?.store
  const { registerStore }=ctx
  useEffect(()=>{ if(profile&&!ctx.stores.some(s=>s.id===profile.id)) registerStore({id:profile.id,name:profile.name,operator:session?.name??'',address:profile.address}) },[profile,session?.name,ctx.stores,registerStore])
  if(!session) return null
  if(!store) return <AppFrame profile="operador"><p role="alert" className="mx-auto max-w-xl rounded-2xl border bg-card p-6">Sua conta não está vinculada a uma batedeira cadastrada. Procure o administrador.</p></AppFrame>
  return <OperatorPanel store={store} signOut={signOut}/>
}

function OperatorPanel({store,signOut}:{store:Store;signOut:()=>void}) {
  const ctx=useApp()
  const notify=useToast()
  const [view,setView]=useView()
  const [confirmToggle,setConfirmToggle]=useState<'isOpen'|'deliveryAvailable'|null>(null)
  const orders=ctx.orders.filter(o=>o.storeId===store.id).sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt))
  const pending=orders.filter(o=>o.status==='AGUARDANDO_ACEITE')
  const active=orders.filter(o=>['ACEITO','EM_PREPARO','PRONTO','SAIU_PARA_ENTREGA'].includes(o.status))
  const daily=storeDailyMetrics(ctx.orders,store.id,ctx.now)
  const actor={role:'operador' as const,name:store.operator,storeId:store.id}
  function toggle(key:'isOpen'|'deliveryAvailable') {try{ctx.updateStore({...store,[key]:!store[key]});notify('Disponibilidade atualizada.')}catch(error){notify(String(error),'error')}}
  return <AppFrame profile="operador"><div className="mx-auto max-w-6xl">
    <StaffSignedInBar onSignOut={signOut}>Operando como <b>{store.operator}</b> · {store.name}</StaffSignedInBar>
    <SectionHeading eyebrow={`Painel da batedeira · ${store.name}`} title={view==='produtos'?'Catálogo':view==='config'?'Configurações':'Pedidos e operação'} />
    {store.adminStatus!=='ATIVA'&&<p role="alert" className="mb-4 rounded-xl bg-accent/20 p-4">Batedeira {store.adminStatus.toLowerCase()}: novos pedidos bloqueados. O histórico e os pedidos existentes permanecem disponíveis.</p>}
    <nav aria-label="Seções da batedeira" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [&>button]:shrink-0">{[['overview','Visão geral'],['pedidos','Pedidos'],['produtos','Catálogo'],['config','Configurações']].map(([key,label])=><button key={key} className="btn" aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}</nav>
    {(view==='overview'||view==='pedidos')&&<>
      {view==='overview'&&<><div className="mb-3 flex flex-wrap gap-3"><button className={store.isOpen?'status-toggle-open':'status-toggle-closed'} aria-pressed={store.isOpen} onClick={()=>setConfirmToggle('isOpen')}>{store.isOpen?'Aberta · Fechar batedeira':'Fechada · Abrir batedeira'}</button><button className={store.deliveryAvailable?'status-toggle-open':'status-toggle-closed'} aria-pressed={store.deliveryAvailable} onClick={()=>setConfirmToggle('deliveryAvailable')}>{store.deliveryAvailable?'Entregas disponíveis · Pausar entregas':'Entregas pausadas · Disponibilizar entregas'}</button></div><dl className="compact-metrics mb-4"><div><dt>Aguardando</dt><dd>{pending.length}</dd></div><div><dt>Em operação</dt><dd>{active.length}</dd></div><div><dt>Entregues</dt><dd>{orders.filter(o=>o.status==='ENTREGUE').length}</dd></div><div><dt>Faturamento do dia</dt><dd>R$ {cents(daily.revenueCents)}</dd></div><div><dt>Entregas hoje</dt><dd>{daily.deliveredToday}</dd></div><div><dt>Pedidos aceitos hoje</dt><dd>{daily.acceptedToday}</dd></div></dl>
      {confirmToggle&&<Modal title={confirmToggle==='isOpen'?(store.isOpen?'Fechar a batedeira?':'Abrir a batedeira?'):(store.deliveryAvailable?'Pausar as entregas?':'Disponibilizar as entregas?')} onClose={()=>setConfirmToggle(null)}><p className="mb-4">{confirmToggle==='isOpen'?(store.isOpen?'Enquanto fechada, a batedeira não recebe novos pedidos.':'Ao abrir, a batedeira volta a receber novos pedidos.'):(store.deliveryAvailable?'Enquanto pausada, os clientes não poderão solicitar entrega. O atendimento presencial não é afetado.':'Ao disponibilizar, os clientes voltam a poder solicitar entrega.')}</p><div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>setConfirmToggle(null)}>Cancelar</button><button className="btn-primary" onClick={()=>{toggle(confirmToggle);setConfirmToggle(null)}}>{confirmToggle==='isOpen'?(store.isOpen?'Confirmar fechamento':'Confirmar abertura'):(store.deliveryAvailable?'Confirmar pausa':'Confirmar disponibilização')}</button></div></Modal>}</>}
      {pending.length>0&&<p role="status" className="mb-3 flex items-center gap-3 rounded-2xl bg-accent p-4 font-black text-accent-foreground shadow-md"><span aria-hidden className="relative flex size-3"><span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60"/><span className="relative inline-flex size-3 rounded-full bg-current"/></span>{pending.length} pedido(s) aguardando resposta · prazo de 5 minutos</p>}
      <p className="mb-3 text-xs text-muted-foreground">{isStoreOpenNow(store)?'Batedeira aberta no horário atual.':'Batedeira fechada agora (horário ou fechamento manual).'} {store.deliveryAvailable?'Entregas habilitadas.':'Entregas pausadas.'} Mantenha o painel aberto.</p>
      {orders.some(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author===adminActorName))&&<details className="mb-3 rounded-xl border p-3"><summary>Cancelamentos e intervenções administrativas</summary>{orders.filter(o=>o.status==='CANCELADO'||o.timeline.some(e=>e.author===adminActorName)).map(o=><p key={o.id} className="mt-2 break-all text-sm">{o.id}: {o.status==='CANCELADO'?'Cancelado':'Intervenção registrada'} — consulte Pedidos para o histórico.</p>)}</details>}
      <div className="grid gap-4">{(view==='overview'?[...pending,...active].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)):orders).map(order=><OrderPanel key={order.id} order={order} actor={actor}/>)}{(view==='overview'?pending.length+active.length===0:orders.length===0)&&<p className="rounded-xl border p-4">Nenhum pedido {view==='overview'?'aguardando ou em operação':'registrado ainda'}.</p>}</div>
    </>}
    {view==='produtos'&&<Catalog storeId={store.id}/>}
    {view==='config'&&<Settings store={store}/>}
  </div></AppFrame>
}

function Catalog({storeId}:{storeId:string}) {
  const ctx=useApp()
  const notify=useToast()
  const [editing,setEditing]=useState<Product|null>(null)
  const [price,setPrice]=useState('')
  const [error,setError]=useState('')
  function edit(product:Product) {setEditing({...product});setPrice(cents(product.priceCents));setError('')}
  function save() {
    try{if(!editing)return;ctx.saveProduct({...editing,priceCents:parseMoney(price)});setEditing(null);notify('Catálogo atualizado. Pedidos anteriores preservados.')}
    catch(error){setError(error instanceof Error?error.message:'Revise os dados.')}
  }
  const products=ctx.products.filter(p=>p.storeId===storeId)
  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{products.filter(p=>p.active).length} produto(s) ativo(s) · tamanhos de 500 ml ou 1 L</p><button className="btn-primary inline-flex items-center gap-2" onClick={()=>edit({id:crypto.randomUUID(),storeId,name:'',description:'',volumeMl:1000,priceCents:0,active:true,available:true,showUnavailable:false})}><Plus className="size-4" aria-hidden/>Adicionar produto</button></div>
    {products.length===0&&<p className="empty-state">Nenhum produto cadastrado ainda.</p>}
    <div className="grid gap-4 md:grid-cols-2">{products.map(p=><article key={p.id} className={`flex flex-col rounded-3xl border bg-card p-4 shadow-sm ${p.active?'':'border-dashed'}`}><div className="flex gap-4"><Image src={p.image||'/images/acai-tradicional.webp'} width={96} height={96} sizes="96px" alt={`Foto de ${p.name}`} className={`size-24 shrink-0 rounded-2xl object-cover ${p.active?'':'opacity-60 grayscale'}`}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="text-lg font-black leading-tight">{p.name}</h2><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{p.volumeMl>=1000?`${p.volumeMl/1000} L`:`${p.volumeMl} ml`}</span></div><p className="mt-1 text-xl font-black tabular-nums">R$ {cents(p.priceCents)}</p><p className="mt-2 flex flex-wrap gap-1.5"><StatusPill status={!p.active?'closed':p.available?'open':'negative'} label={!p.active?'Arquivado':p.available?'Disponível':'Indisponível'}/>{!p.available&&p.active&&<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{p.showUnavailable?'Visível para consulta':'Oculto no catálogo'}</span>}</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t pt-3"><button className="btn" onClick={()=>edit(p)}>Editar</button><button className="btn" onClick={()=>ctx.saveProduct({...p,available:!p.available})}>{p.available?'Indisponibilizar':'Disponibilizar'}</button><button className="btn" onClick={()=>ctx.saveProduct({...p,active:!p.active})}>{p.active?'Arquivar':'Restaurar'}</button></div>{p.updatedAt&&<p className="mt-3 text-xs text-muted-foreground">Atualizado em {new Date(p.updatedAt).toLocaleString('pt-BR')}</p>}</article>)}</div>
    {editing&&<Modal title="Produto" onClose={()=>setEditing(null)}><form className="space-y-4" onSubmit={e=>{e.preventDefault();save()}}><label>Nome<input required maxLength={150} className="form-field" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><PhotoField value={editing.image} onChange={image=>setEditing({...editing,image})}/><label>Descrição<textarea maxLength={500} className="form-field" value={editing.description??''} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><label>Tamanho<select required className="form-field" value={editing.volumeMl} onChange={e=>setEditing({...editing,volumeMl:Number(e.target.value)})}>{allowedProductVolumesMl.map(volume=><option key={volume} value={volume}>{volume} ml {volume===1000?'(1 litro)':'(meio litro)'}</option>)}</select></label><label>Preço (R$)<input required inputMode="decimal" className="form-field" value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="flex items-center gap-2"><input type="checkbox" className="size-5" checked={editing.showUnavailable} onChange={e=>setEditing({...editing,showUnavailable:e.target.checked})}/>Exibir quando indisponível</label>{error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button className="btn-primary w-full">Salvar produto</button></form></Modal>}
  </>
}
function Settings({store}:{store:Store}) {
  const ctx=useApp()
  const notify=useToast()
  const [fee,setFee]=useState(cents(store.deliveryFeeCents))
  const [min,setMin]=useState(store.estimatedRange.match(/\d+/g)?.[0]??'25')
  const [max,setMax]=useState(store.estimatedRange.match(/\d+/g)?.[1]??'35')
  const [accepts500ml,setAccepts500ml]=useState(store.accepts500ml)
  const [pixKey,setPixKey]=useState(store.pixKey??'')
  const [schedule,setSchedule]=useState(getSchedule(store))
  const [error,setError]=useState('')
  const dayNames=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  return <form className="surface max-w-2xl space-y-6" onSubmit={e=>{e.preventDefault();try{if(!Number.isInteger(Number(min))||!Number.isInteger(Number(max))||Number(min)<1||Number(max)<Number(min))throw new Error('Informe uma faixa válida, com máximo maior ou igual ao mínimo.');if(pixKey.length>77)throw new Error('A chave Pix deve ter até 77 caracteres.');ctx.updateStore({...store,pixKey:pixKey.trim()||undefined,accepts500ml,deliveryFeeCents:parseMoney(fee),estimatedRange:`${min}–${max} min`,schedule,hours:'Consulte os horários por dia'});setError('');notify('Configurações salvas. Pedidos anteriores preservam taxa e estimativa.')}catch(error){setError(error instanceof Error?error.message:'Revise os dados.')}}}>
    <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm"><MapPin className="size-4 shrink-0" aria-hidden/>Área do piloto: Centro, Cametá/PA.</div>
    <section className="space-y-4"><h2 className="section-label">Entrega</h2><label>Chave Pix (opcional)<input maxLength={77} autoComplete="off" className="form-field" value={pixKey} onChange={e=>setPixKey(e.target.value)}/><span className="text-xs text-muted-foreground">Usada para gerar o QR Code do cliente. O pagamento vai direto para você; a plataforma não o confirma.</span></label><label>Taxa de entrega (R$)<input required inputMode="decimal" className="form-field" value={fee} onChange={e=>setFee(e.target.value)}/></label><label className="flex items-start gap-3 rounded-2xl border p-3"><input type="checkbox" className="mt-0.5 size-5" checked={accepts500ml} onChange={e=>setAccepts500ml(e.target.checked)}/><span><span className="block font-bold">Entregar porções de 500 ml</span><span className="block text-sm text-muted-foreground">{accepts500ml?'Os clientes veem as opções de 500 ml e de 1 litro.':'Desativado: os clientes veem apenas as opções de 1 litro.'} O pedido mínimo continua sendo de 1 litro.</span></span></label><div className="grid grid-cols-2 gap-3"><label>Estimativa mínima (min)<input required type="number" min={1} className="form-field" value={min} onChange={e=>setMin(e.target.value)}/></label><label>Estimativa máxima (min)<input required type="number" min={1} className="form-field" value={max} onChange={e=>setMax(e.target.value)}/></label></div></section>
    <fieldset className="space-y-2"><legend className="section-label mb-2 w-full">Horários regulares</legend>{schedule.map((entry,index)=><div key={entry.day} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border p-3 ${entry.active?'bg-background':'bg-muted/40'}`}><label className="flex min-h-11 w-32 items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-5" checked={entry.active} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,active:e.target.checked}:row))}/>{dayNames[entry.day]}</label><div className="flex items-center gap-2"><input aria-label={`Abertura ${dayNames[entry.day]}`} type="time" required disabled={!entry.active} className="form-field !mt-0 w-auto" value={entry.opens} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,opens:e.target.value}:row))}/><span aria-hidden className="text-muted-foreground">às</span><input aria-label={`Fechamento ${dayNames[entry.day]}`} type="time" required disabled={!entry.active} className="form-field !mt-0 w-auto" value={entry.closes} onChange={e=>setSchedule(rows=>rows.map((row,i)=>i===index?{...row,closes:e.target.value}:row))}/></div></div>)}</fieldset>
    {error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button className="btn-primary w-full sm:w-auto sm:min-w-48">Salvar configurações</button>
  </form>
}
