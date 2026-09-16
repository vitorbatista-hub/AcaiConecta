'use client'
import { useState } from 'react'
import { usePrototype } from './prototype-provider'
import { Modal } from './modal'
import { useToast } from './app-shell'
import { cents, formatOrderDate, getOrderStatusLabel, predefinedMessages, type Actor, type Order, type OrderStatus } from '@/lib/mock-data'

const nextStatus:Partial<Record<OrderStatus,OrderStatus>>={AGUARDANDO_ACEITE:'ACEITO',ACEITO:'EM_PREPARO',EM_PREPARO:'PRONTO',PRONTO:'SAIU_PARA_ENTREGA',SAIU_PARA_ENTREGA:'ENTREGUE'}
const actionLabel:Partial<Record<OrderStatus,string>>={ACEITO:'Aceitar',EM_PREPARO:'Iniciar preparo',PRONTO:'Marcar pronto',SAIU_PARA_ENTREGA:'Saiu para entrega',ENTREGUE:'Confirmar entregue'}
const reasons=['Sem capacidade de atendimento','Produto indisponível','Endereço não localizado','Cliente ausente','Cliente não respondeu','Problema com entregador','Estabelecimento não conseguiu concluir','Outro']
export function OrderPanel({order,actor}:{order:Order;actor:Actor}) {
  const demo=usePrototype()
  const notify=useToast()
  const [target,setTarget]=useState<OrderStatus|null>(null)
  const [reason,setReason]=useState('')
  const [other,setOther]=useState('')
  const [message,setMessage]=useState('Precisamos confirmar uma informação do pedido.')
  const [intervention,setIntervention]=useState('')
  const [error,setError]=useState('')
  const [confirmDelivery,setConfirmDelivery]=useState(false)
  const remaining=Math.max(0,Math.ceil((Date.parse(order.acceptedDeadline)-demo.now)/1000))
  function transition(to:OrderStatus,motive?:string) {
    try {demo.transition(order.id,to,actor,motive);setTarget(null);setError('');notify('Estado do pedido atualizado.')}
    catch(error){const text=error instanceof Error?error.message:'Não foi possível atualizar.';setError(text);notify(text,'error')}
  }
  function send(text:string) {
    try{demo.message(order.id,text,actor);setIntervention('');notify('Registro adicionado à linha do tempo.')}
    catch(error){notify(error instanceof Error?error.message:'Não foi possível registrar.','error')}
  }
  const next=nextStatus[order.status]
  const operational=['ACEITO','EM_PREPARO','PRONTO'].includes(order.status)
  return <article className={`rounded-2xl border p-5 ${order.status==='AGUARDANDO_ACEITE'?'border-accent bg-accent/10':'border-border bg-card'}`}>
    <p className="mb-2 font-bold">{order.storeName??demo.stores.find(s=>s.id===order.storeId)?.name}</p><p className="mb-2 text-xs text-muted-foreground">Criado em {formatOrderDate(order.createdAt)}</p><div className="flex flex-wrap justify-between gap-2"><h2 className="break-all font-bold">{order.id}</h2><strong>{getOrderStatusLabel(order.status)}</strong></div>
    {order.status==='AGUARDANDO_ACEITE'&&<p role="status" className="mt-2 font-bold">{remaining<=60?'Atenção: próximo de expirar. ':''}Resposta em até {Math.floor(remaining/60)}min {remaining%60}s</p>}
    <ul className="mt-3 text-sm">{order.items.map(i=><li key={i.productId}>{i.quantity} × {i.name} · {i.volumeMl} ml · R$ {cents(i.unitPriceCents)}{i.note&&<p>Observação: {i.note}</p>}</li>)}</ul>
    <p className="mt-2 text-sm">Subtotal R$ {cents(order.subtotalCents)} · Entrega R$ {cents(order.deliveryFeeCents)} · Total R$ {cents(order.totalCents)}</p>
    <p className="mt-2 text-sm">{order.address.street}, {order.address.number} · {order.address.neighborhood} · {order.address.complement} · {order.address.reference}</p>
    <p className="text-sm">Contato: {order.phone} · {order.payment==='PIX'?'Pix na entrega':'Dinheiro na entrega'}{order.changeForCents!==undefined&&` · Troco para R$ ${cents(order.changeForCents)}`}</p>
    <p className="text-sm">Faixa informada: {order.estimatedRange}{order.note&&` · Observação: ${order.note}`}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {actor.role==='operador'&&next&&<button className="demo-primary" disabled={order.status==='AGUARDANDO_ACEITE'&&remaining===0} onClick={()=>next==='ENTREGUE'?setConfirmDelivery(true):transition(next)}>{actionLabel[next]}</button>}
      {actor.role==='operador'&&order.status==='AGUARDANDO_ACEITE'&&<button className="demo-button" onClick={()=>{setTarget('RECUSADO');setReason('');setOther('')}}>Recusar com motivo</button>}
      {operational&&<button className="demo-button" onClick={()=>{setTarget('CANCELADO');setReason('');setOther('')}}>Cancelar por impossibilidade operacional</button>}
      {actor.role==='operador'&&order.status==='SAIU_PARA_ENTREGA'&&<button className="demo-button" onClick={()=>{setTarget('FALHA_NA_ENTREGA');setReason('');setOther('')}}>Registrar falha na entrega</button>}
    </div>
    {actor.role==='operador'&&next&&<form className="mt-4 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();send(message)}}><label className="flex-1 text-sm">Mensagem operacional<select className="demo-field" value={message} onChange={e=>setMessage(e.target.value)}>{predefinedMessages.filter(m=>order.status==='SAIU_PARA_ENTREGA'||!['O entregador chegou.','Não encontramos o endereço.'].includes(m)).map(m=><option key={m}>{m}</option>)}</select></label><button className="demo-button">Enviar mensagem</button></form>}
    {actor.role==='admin'&&<form className="mt-4" onSubmit={e=>{e.preventDefault();send(intervention)}}><label className="text-sm">Intervenção administrativa (visível ao cliente)<textarea required maxLength={500} className="demo-field" value={intervention} onChange={e=>setIntervention(e.target.value)}/></label><button className="demo-button">Registrar intervenção</button></form>}
    <details className="mt-4"><summary className="cursor-pointer font-bold">Linha do tempo ({order.timeline.length})</summary><ol className="mt-2 space-y-2 text-sm">{order.timeline.map((event,index)=><li key={index}>{new Date(event.at).toLocaleString('pt-BR',{timeZone:'America/Belem'})} · {event.author} · {event.message??getOrderStatusLabel(event.to)}{event.reason&&` · ${event.reason}`}</li>)}</ol></details>
    {confirmDelivery&&<Modal title="Confirmar entrega" onClose={()=>setConfirmDelivery(false)}><p className="mb-4">O responsável pela entrega confirmou que o cliente recebeu o pedido? Esta ação encerra o atendimento.</p><div className="flex flex-wrap gap-2"><button className="demo-button" onClick={()=>setConfirmDelivery(false)}>Voltar</button><button className="demo-primary" onClick={()=>{transition('ENTREGUE');setConfirmDelivery(false)}}>Sim, entrega confirmada</button></div></Modal>}
    {target&&<Modal title={target==='CANCELADO'?'Impossibilidade operacional':'Informe o motivo'} onClose={()=>setTarget(null)}><form className="space-y-4" onSubmit={e=>{e.preventDefault();transition(target,reason==='Outro'?other:reason)}}><label>Motivo<select required className="demo-field" value={reason} onChange={e=>setReason(e.target.value)}><option value="">Selecione</option>{reasons.filter(r=>target==='FALHA_NA_ENTREGA'||!['Endereço não localizado','Cliente ausente','Cliente não respondeu','Problema com entregador'].includes(r)).map(r=><option key={r}>{r}</option>)}</select></label>{reason==='Outro'&&<label>Descrição obrigatória<textarea required maxLength={255} className="demo-field" value={other} onChange={e=>setOther(e.target.value)}/></label>}{target==='CANCELADO'&&<p className="text-sm">Use somente quando a batedeira não puder concluir a operação. Solicitações do cliente seguem para o suporte.</p>}{error&&<p role="alert">{error}</p>}<button className="demo-primary">Confirmar {getOrderStatusLabel(target).toLowerCase()}</button></form></Modal>}
  </article>
}
