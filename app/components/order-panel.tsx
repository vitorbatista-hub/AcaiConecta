'use client'
import { useState } from 'react'
import { useApp } from './app-provider'
import { Modal } from './modal'
import { StatusPill, useToast } from './app-shell'
import { orderTone } from '@/lib/order-presentation'
import { neighborhoodLabel } from '@/lib/neighborhoods'
import { cents, formatOrderDate, getOrderStatusLabel, predefinedMessages, type Actor, type Order, type OrderStatus } from '@/lib/domain'

// Depois do aceite, o preparo começa quando o cliente escolhe dinheiro ou o provedor confirma o Pix (DEC-056); não é ação da batedeira.
const nextStatus:Partial<Record<OrderStatus,OrderStatus>>={AGUARDANDO_ACEITE:'ACEITO',EM_PREPARO:'PRONTO',PRONTO:'SAIU_PARA_ENTREGA',SAIU_PARA_ENTREGA:'ENTREGUE'}
const actionLabel:Partial<Record<OrderStatus,string>>={ACEITO:'Aceitar',PRONTO:'Marcar pronto',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Confirmar entregue'}
const reasons=['Sem capacidade de atendimento','Produto indisponível','Endereço não localizado','Cliente ausente','Cliente não respondeu','Problema com entregador','Estabelecimento não conseguiu concluir','Outro']
export function OrderPanel({order,actor}:{order:Order;actor:Actor}) {
  const ctx=useApp()
  const notify=useToast()
  const [target,setTarget]=useState<OrderStatus|null>(null)
  const [reason,setReason]=useState('')
  const [other,setOther]=useState('')
  const [message,setMessage]=useState('Precisamos confirmar uma informação do pedido.')
  const [intervention,setIntervention]=useState('')
  const [error,setError]=useState('')
  const [confirmDelivery,setConfirmDelivery]=useState(false)
  const remaining=Math.max(0,Math.ceil((Date.parse(order.acceptedDeadline)-ctx.now)/1000))
  async function transition(to:OrderStatus,motive?:string) {
    try {await ctx.transition(order.id,to,actor,motive);setTarget(null);setError('');notify('Estado do pedido atualizado.')}
    catch(error){const text=error instanceof Error?error.message:'Não foi possível atualizar.';setError(text);notify(text,'error')}
  }
  async function send(text:string) {
    try{await ctx.message(order.id,text,actor);setIntervention('');notify('Registro adicionado à linha do tempo.')}
    catch(error){notify(error instanceof Error?error.message:'Não foi possível registrar.','error')}
  }
  const next=nextStatus[order.status]
  const operational=['ACEITO','AGUARDANDO_PAGAMENTO','EM_PREPARO','PRONTO'].includes(order.status)
  const waitingUntil=order.status==='ACEITO'?order.paymentDeadline:order.status==='AGUARDANDO_PAGAMENTO'?order.pixDeadline:undefined
  const waitingMs=waitingUntil?Math.max(0,Date.parse(waitingUntil)-ctx.now):0
  return <article className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${order.status==='AGUARDANDO_ACEITE'?'border-accent bg-accent/10 ring-2 ring-accent/30':'border-border bg-card'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-all text-base font-black">{order.id}</h2><p className="mt-0.5 text-xs text-muted-foreground">{order.storeName??ctx.stores.find(s=>s.id===order.storeId)?.name} · criado em {formatOrderDate(order.createdAt)}</p></div><StatusPill status={orderTone(order.status)} label={getOrderStatusLabel(order.status)}/></div>
    {order.status==='AGUARDANDO_ACEITE'&&<div role="status" className="mt-3"><p className={`flex items-center justify-between gap-2 text-sm font-black tabular-nums ${remaining<=60?'text-destructive':''}`}><span>{remaining<=60?'Atenção: próximo de expirar':'Prazo para responder'}</span><span>{Math.floor(remaining/60)}min {String(remaining%60).padStart(2,'0')}s</span></p><div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${remaining<=60?'bg-destructive':'bg-accent'}`} style={{width:`${Math.min(100,remaining/3)}%`}}/></div></div>}
    {waitingUntil&&<p role="status" className="mt-3 rounded-xl bg-muted p-3 text-sm">{order.status==='ACEITO'?'Aguardando o cliente escolher a forma de pagamento':'Aguardando o pagamento do Pix'} · <b className="tabular-nums">{Math.floor(waitingMs/60000)}min {String(Math.floor(waitingMs/1000)%60).padStart(2,'0')}s</b>. O preparo começa depois disso; se o prazo terminar, o pedido é encerrado sem custo.</p>}
    <ul className="mt-4 divide-y rounded-xl border bg-background/60 text-sm">{order.items.map(i=><li key={i.productId} className="flex items-start justify-between gap-3 px-3 py-2"><div><p className="font-semibold">{i.quantity} × {i.name} <span className="font-normal text-muted-foreground">· {i.volumeMl} ml</span></p>{i.note&&<p className="text-xs text-muted-foreground">Observação: {i.note}</p>}</div><span className="shrink-0 tabular-nums">R$ {cents(i.quantity*i.unitPriceCents)}</span></li>)}</ul>
    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Valores</dt><dd className="tabular-nums">Subtotal R$ {cents(order.subtotalCents)} · Entrega R$ {cents(order.deliveryFeeCents)}<br/><b className="text-base">Total R$ {cents(order.totalCents)}</b></dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pagamento e contato</dt><dd>{!order.payment?'A escolher depois do aceite':order.payment==='PIX'?(order.paidAt?'Pix on-line · pago':'Pix on-line · aguardando pagamento'):'Dinheiro na entrega'}{order.changeForCents!==undefined&&` · Troco para R$ ${cents(order.changeForCents)}`}<br/>{order.phone}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entregar em</dt><dd>{[(order.address.number?`${order.address.street}, ${order.address.number}`:order.address.street),neighborhoodLabel(order.address.neighborhood),order.address.complement,order.address.reference].filter(Boolean).join(' · ')}</dd></div></dl><p className="mt-2 text-xs text-muted-foreground">Faixa informada ao cliente: {order.estimatedRange}{order.note&&` · Observação do pedido: ${order.note}`}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {actor.role==='operador'&&next&&<button className="btn-primary" disabled={order.status==='AGUARDANDO_ACEITE'&&remaining===0} onClick={()=>next==='ENTREGUE'?setConfirmDelivery(true):transition(next)}>{actionLabel[next]}</button>}
      {actor.role==='operador'&&order.status==='AGUARDANDO_ACEITE'&&<button className="btn" onClick={()=>{setTarget('RECUSADO');setReason('');setOther('')}}>Recusar com motivo</button>}
      {operational&&<button className="btn" onClick={()=>{setTarget('CANCELADO');setReason('');setOther('')}}>Cancelar por impossibilidade operacional</button>}
      {actor.role==='operador'&&order.status==='SAIU_PARA_ENTREGA'&&<button className="btn" onClick={()=>{setTarget('FALHA_NA_ENTREGA');setReason('');setOther('')}}>Registrar falha na entrega</button>}
    </div>
    {actor.role==='operador'&&next&&<form className="mt-4 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();send(message)}}><label className="flex-1 text-sm">Mensagem operacional<select className="form-field" value={message} onChange={e=>setMessage(e.target.value)}>{predefinedMessages.filter(m=>order.status==='SAIU_PARA_ENTREGA'||!['O entregador chegou.','Não encontramos o endereço.'].includes(m)).map(m=><option key={m}>{m}</option>)}</select></label><button className="btn">Enviar mensagem</button></form>}
    {actor.role==='admin'&&<form className="mt-4" onSubmit={e=>{e.preventDefault();send(intervention)}}><label className="text-sm">Intervenção administrativa (visível ao cliente)<textarea required maxLength={500} className="form-field" value={intervention} onChange={e=>setIntervention(e.target.value)}/></label><button className="btn">Registrar intervenção</button></form>}
    <details className="mt-4"><summary className="cursor-pointer font-bold">Linha do tempo ({order.timeline.length})</summary><ol className="mt-2 space-y-2 text-sm">{order.timeline.map((event,index)=><li key={index}>{new Date(event.at).toLocaleString('pt-BR',{timeZone:'America/Belem'})} · {event.author} · {event.message??getOrderStatusLabel(event.to)}{event.reason&&` · ${event.reason}`}</li>)}</ol></details>
    {confirmDelivery&&<Modal title="Confirmar entrega" onClose={()=>setConfirmDelivery(false)}><p className="mb-4">O responsável pela entrega confirmou que o cliente recebeu o pedido? Esta ação encerra o atendimento.</p><div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>setConfirmDelivery(false)}>Voltar</button><button className="btn-primary" onClick={()=>{transition('ENTREGUE');setConfirmDelivery(false)}}>Sim, entrega confirmada</button></div></Modal>}
    {target&&<Modal title={target==='CANCELADO'?'Impossibilidade operacional':'Informe o motivo'} onClose={()=>setTarget(null)}><form className="space-y-4" onSubmit={e=>{e.preventDefault();transition(target,reason==='Outro'?other:reason)}}><label>Motivo<select required className="form-field" value={reason} onChange={e=>setReason(e.target.value)}><option value="">Selecione</option>{reasons.filter(r=>target==='FALHA_NA_ENTREGA'||!['Endereço não localizado','Cliente ausente','Cliente não respondeu','Problema com entregador'].includes(r)).map(r=><option key={r}>{r}</option>)}</select></label>{reason==='Outro'&&<label>Descrição obrigatória<textarea required maxLength={255} className="form-field" value={other} onChange={e=>setOther(e.target.value)}/></label>}{target==='CANCELADO'&&<p className="text-sm">Use somente quando a batedeira não puder concluir a operação. Solicitações do cliente seguem para o suporte.{order.paidAt&&' Este pedido já foi pago: o estorno em até 24 horas é obrigatório e ainda não está disponível nesta versão; faça-o pelo provedor e avise o administrador.'}</p>}{error&&<p role="alert">{error}</p>}<button className="btn-primary">Confirmar {getOrderStatusLabel(target).toLowerCase()}</button></form></Modal>}
  </article>
}
