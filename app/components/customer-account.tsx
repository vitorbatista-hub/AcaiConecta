'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, MapPin, UserRound } from 'lucide-react'
import { useApp } from './app-provider'
import { maxSavedAddresses, removeAddress, saveAddress, type SavedAddress } from '@/lib/customer-session'
import { neighborhoodLabel, officialNeighborhoods } from '@/lib/neighborhoods'

export function CustomerAccount({ onDone }: { onDone?: () => void }) {
  const ctx = useApp()
  const customer = ctx.customer
  const router = useRouter()
  if (!customer.signedIn) return null
  return <section className="surface space-y-5">
    <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden><UserRound className="size-7" /></span><div className="min-w-0"><h2 className="text-xl font-black leading-tight">{customer.name}</h2><p className="truncate text-sm text-muted-foreground">{customer.email}</p></div></div>
    <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Seus dados e pedidos ficam somente neste navegador.</p>
    <div><h3 className="section-label flex items-center gap-2"><MapPin className="size-4" aria-hidden />Endereços salvos</h3><p className="mt-2 text-sm text-muted-foreground">Até {maxSavedAddresses} endereços: um principal e um secundário.</p></div>
    {customer.addresses.length === 0 && <p className="empty-state">Salve um endereço ao confirmar seu próximo pedido.</p>}
    <div className="grid gap-3">{customer.addresses.map(address => <AddressCard key={address.id} address={address} />)}</div>
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between"><button className="btn inline-flex items-center justify-center gap-2" onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST' }) } finally { ctx.updateCustomer({ signedIn: false }); router.replace('/entrar') } }}><LogOut className="size-4" aria-hidden />Sair da conta</button>{onDone && <button className="btn-primary sm:min-w-48" onClick={onDone}>Continuar pedido</button>}</div>
  </section>
}

function AddressCard({ address }: { address: SavedAddress }) {
  const ctx = useApp()
  const addresses = ctx.customer.addresses
  const [draft, setDraft] = useState<SavedAddress | null>(null)
  const [error, setError] = useState('')
  const label = address.primary ? 'Principal' : 'Secundário'
  if (draft) return <form className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4" onSubmit={event => {
    event.preventDefault()
    try { ctx.updateCustomer({ addresses: saveAddress(addresses, draft) }); setDraft(null); setError('') }
    catch (error) { setError(error instanceof Error ? error.message : 'Revise o endereço.') }
  }}>
    <p className="font-bold">Editar endereço {label.toLowerCase()}</p>
    <label>Rua<input className="form-field" required maxLength={180} value={draft.street} onChange={event => setDraft({ ...draft, street: event.target.value })} /></label>
    <label>Bairro<select className="form-field" required value={draft.neighborhood} onChange={event => setDraft({ ...draft, neighborhood: event.target.value })}>{officialNeighborhoods.map(item => <option key={item.name} value={item.name}>{neighborhoodLabel(item.name)}</option>)}</select></label>
    <label>Número<input className="form-field" required maxLength={20} value={draft.number} onChange={event => setDraft({ ...draft, number: event.target.value })} /></label>
    <label>Complemento (opcional)<input className="form-field" maxLength={100} value={draft.complement ?? ''} onChange={event => setDraft({ ...draft, complement: event.target.value })} /></label>
    <label>Ponto de referência (opcional)<input className="form-field" maxLength={255} value={draft.reference ?? ''} onChange={event => setDraft({ ...draft, reference: event.target.value })} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><button className="btn-primary">Salvar endereço</button><button type="button" className="btn" onClick={() => { setDraft(null); setError('') }}>Cancelar</button></div>
  </form>
  return <div className={`rounded-2xl border p-4 ${address.primary ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold">{address.street}, {address.number}<span className="block text-sm font-normal text-muted-foreground">{neighborhoodLabel(address.neighborhood)}, Cametá/PA{address.complement ? ` · ${address.complement}` : ''}</span></p><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${address.primary ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{label}</span></div><div className="mt-3 flex flex-wrap gap-2">
    <button className="btn" onClick={() => setDraft(address)}>Editar</button>
    <button className="btn" onClick={() => ctx.updateCustomer({ addresses: saveAddress(addresses, { ...address, primary: true }), address })} disabled={address.primary}>Tornar principal</button>
    <button className="btn" onClick={() => ctx.updateCustomer({ addresses: removeAddress(addresses, address.id) })}>Remover endereço</button>
  </div></div>
}
