'use client'
import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { cents } from '@/lib/mock-data'
import { buildPixPayload } from '@/lib/pix'

export function PixQrCode({ totalCents, storeName }: { totalCents: number; storeName: string }) {
  const [image, setImage] = useState('')
  const [copied, setCopied] = useState(false)
  let payload = ''
  try { payload = buildPixPayload(totalCents, storeName) } catch { payload = '' }
  useEffect(() => {
    let active = true
    setImage('')
    if (payload) QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: 'M' }).then(url => { if (active) setImage(url) }).catch(() => { if (active) setImage('') })
    return () => { active = false }
  }, [payload])
  async function copy() {
    try { await navigator.clipboard.writeText(payload); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { setCopied(false) }
  }
  if (!payload) return null
  return <section aria-label="Pagamento por Pix" className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center">
    <p className="text-sm font-bold">Pague R$ {cents(totalCents)} com Pix</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {image ? <img src={image} width={240} height={240} alt={`QR Code Pix de R$ ${cents(totalCents)} para ${storeName}`} className="size-60 rounded-xl bg-white p-2" /> : <div className="size-60 animate-pulse rounded-xl bg-muted" aria-hidden />}
    <button type="button" className="demo-button inline-flex items-center gap-2" onClick={copy}><Copy className="size-4" aria-hidden />{copied ? 'Código copiado' : 'Copiar Pix copia e cola'}</button>
    <p className="text-xs text-muted-foreground">Simulação do protótipo: o QR Code usa uma chave fictícia e nenhum pagamento é processado ou confirmado.</p>
  </section>
}
