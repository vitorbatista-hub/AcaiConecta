'use client'

import Image from 'next/image'
import { useState } from 'react'

export function PhotoField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const [error, setError] = useState('')
  return <fieldset className="space-y-3 rounded-2xl border bg-muted/30 p-4"><legend className="px-1 text-sm font-black">Foto ilustrativa</legend>
    <Image src={value || '/images/acai-tradicional.webp'} width={160} height={160} sizes="160px" alt="Prévia da foto" className="size-32 rounded-2xl border object-cover" />
    <label className="block text-sm">Escolher imagem<input className="form-field" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 512_000) { setError('Use JPEG, PNG ou WebP de até 500 KB.'); event.target.value = ''; return }
      const reader = new FileReader()
      reader.onload = () => { if (typeof reader.result === 'string') { onChange(reader.result); setError('') } }
      reader.onerror = () => setError('Não foi possível ler a imagem. Escolha outro arquivo.')
      reader.readAsDataURL(file)
    }} /></label>
    <p className="text-xs text-muted-foreground">Até 500 KB. Somente nesta sessão; use fotos sem dados pessoais.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className="btn" onClick={() => onChange('/images/acai-tradicional.webp')}>Usar foto ilustrativa</button><button type="button" className="btn" onClick={() => onChange('/images/acai-tradicional.webp')}>Remover foto</button></div>
  </fieldset>
}
