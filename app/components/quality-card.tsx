'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cents, type Product } from '@/lib/mock-data'

const volumeLabel = (ml: number) => (ml >= 1000 ? `${ml / 1000} litro${ml >= 2000 ? 's' : ''}` : `${ml} ml`)

// Primeiro o cliente escolhe a qualidade (o cartão); depois a quantidade (500 ml ou 1 litro).
export function QualityCard({ title, options, canOrder, onAdd }: { title: string; options: Product[]; canOrder: boolean; onAdd: (product: Product) => void }) {
  const sorted = [...options].sort((a, b) => a.volumeMl - b.volumeMl)
  const [selectedId, setSelectedId] = useState(sorted[sorted.length - 1].id)
  const selected = sorted.find(p => p.id === selectedId) ?? sorted[0]
  return <article className="flex gap-3 rounded-2xl border bg-card p-3">
    <Image src={selected.image || '/placeholder.svg'} width={96} height={96} sizes="96px" alt={title} className={`${selected.available ? '' : 'opacity-60 grayscale '}size-20 shrink-0 rounded-xl object-cover sm:size-24`} />
    <div className="flex min-w-0 flex-1 flex-col">
      <h3 className="font-black leading-tight">{title}</h3>
      {selected.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{selected.description}</p>}
      {sorted.length > 1 && <fieldset className="mt-2"><legend className="sr-only">Quantidade de {title}</legend><div className="flex flex-wrap gap-2">{sorted.map(p => <label key={p.id} className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-3 text-sm font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${p.id === selected.id ? 'border-primary bg-primary/10 text-primary' : 'bg-card'}`}><input type="radio" className="sr-only" name={`qtd-${title}`} checked={p.id === selected.id} onChange={() => setSelectedId(p.id)} />{volumeLabel(p.volumeMl)}</label>)}</div></fieldset>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2"><p className="text-lg font-black tabular-nums">R$ {cents(selected.priceCents)}{sorted.length === 1 && <span className="ml-2 text-xs font-bold text-muted-foreground">{volumeLabel(selected.volumeMl)}</span>}</p><button className="demo-primary" disabled={!selected.available || !canOrder} onClick={() => onAdd(selected)}>{selected.available ? 'Adicionar' : 'Indisponível'}</button></div>
    </div>
  </article>
}
