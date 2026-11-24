'use client'

import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { Modal } from './modal'
import { useApp } from './app-provider'

export function SupportButton({ orderId }: { orderId?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { supportEmail } = useApp()
  return <>
    <button type="button" className="btn inline-flex items-center gap-2" onClick={() => setOpen(true)}><LifeBuoy className="size-4" aria-hidden />Preciso de ajuda</button>
    {open && <Modal title="Ajuda e atendimento" onClose={() => setOpen(false)}>
      <div className="space-y-4 text-sm leading-6">
        <section><h3 className="font-black">Cancelamento</h3><p className="text-muted-foreground">Antes do aceite, você pode cancelar diretamente no pedido. Depois do aceite, o suporte avalia sua solicitação; abrir este contato não cancela o pedido.</p></section>
        <section><h3 className="font-black">Atraso, falha ou divergência</h3><p className="text-muted-foreground">Informe o código do pedido e o que aconteceu ao responsável pelo atendimento.</p></section>
        {orderId && <div className="rounded-2xl bg-muted p-4"><p className="break-all font-bold">Pedido {orderId}</p><button className="btn mt-2" onClick={async () => { try { await navigator.clipboard.writeText(orderId); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Código copiado' : 'Copiar código'}</button><p className="text-xs">Você também pode selecionar e copiar o código acima.</p></div>}
        {supportEmail ? <a className="btn-primary inline-flex items-center" href={`mailto:${supportEmail}?subject=${encodeURIComponent(orderId ? `Ajuda com o pedido ${orderId}` : 'Ajuda com acesso ao AçaíConecta')}`}>Abrir e-mail para o suporte</a> : <div className="rounded-xl border border-border p-4"><p className="font-bold">Canal de atendimento</p><p>O contato de suporte ainda não foi configurado. Procure diretamente a batedeira informando o código do pedido.</p></div>}
        <p className="text-xs text-muted-foreground">Problemas de acesso também são tratados pelo suporte. A recuperação de acesso é assistida pelo suporte.</p>
      </div>
    </Modal>}
  </>
}
