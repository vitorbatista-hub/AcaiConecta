'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LogOut, MapPin, UserRound } from 'lucide-react'
import { usePrototype } from './prototype-provider'
import { maxSavedAddresses, removeAddress, saveAddress, type SavedAddress } from '@/lib/customer-session'
import { guestCustomerName } from '@/lib/mock-data'
import { adminLoginEmail, resolveAccess, startRoleSession } from '@/lib/access'

export function CustomerAccount({ onDone, initialMode = 'login' }: { onDone?: () => void; initialMode?: 'login' | 'register' }) {
  const demo = usePrototype()
  const router = useRouter()
  const customer = demo.customer
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [recoveryContact, setRecoveryContact] = useState('')
  const [recoveryReason, setRecoveryReason] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  if (customer.signedIn) return <section className="surface space-y-5">
    <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden><UserRound className="size-7" /></span><div className="min-w-0"><h2 className="text-xl font-black leading-tight">{customer.name}</h2><p className="truncate text-sm text-muted-foreground">{customer.email}</p></div></div>
    <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Os dados desta conta e dos pedidos ficam somente nesta aba do navegador.</p>
    <div><h3 className="section-label flex items-center gap-2"><MapPin className="size-4" aria-hidden />Endereços salvos</h3><p className="mt-2 text-sm text-muted-foreground">Até {maxSavedAddresses} endereços: um principal e um secundário.</p></div>
    {customer.addresses.length === 0 && <p className="empty-state">Salve um endereço ao confirmar seu próximo pedido.</p>}
    <div className="grid gap-3">{customer.addresses.map(address => <AddressCard key={address.id} address={address} />)}</div>
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between"><button className="demo-button inline-flex items-center justify-center gap-2" onClick={() => demo.updateCustomer({ signedIn: false })}><LogOut className="size-4" aria-hidden />Sair da conta</button>{onDone && <button className="demo-primary sm:min-w-48" onClick={onDone}>Continuar pedido</button>}</div>
  </section>
  return <section className="surface">
    <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden><KeyRound className="size-5" /></span><h2 className="text-xl font-black">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2></div>
    <p className="my-3 text-sm text-muted-foreground">Seu perfil (cliente, batedeira ou administrador) é definido pelo cadastro do e-mail. Esta etapa ainda não realiza autenticação no servidor; use dados e uma senha de teste, nunca dados reais.</p>
    {demo.customerBlocked && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3">Conta bloqueada pelo administrador. Acesse a ajuda para orientação.</p>}
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault()
      try {
        if (mode === 'register' && !/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) throw new Error('Informe telefone com DDD.')
        const access = resolveAccess(email, demo.stores)
        if (mode === 'register' && access.role !== 'cliente') throw new Error('Este e-mail já pertence a outra conta. Use outro e-mail ou entre.')
        if (mode === 'login' && access.role !== 'cliente') {
          startRoleSession(access, email)
          setPassword(''); setError(''); router.replace(access.role === 'admin' ? '/admin' : '/operador')
          return
        }
        demo.updateCustomer({ signedIn: true, name: name.trim() || guestCustomerName, email: email.trim(), phone: phone || customer.phone })
        setPassword(''); setError(''); onDone?.()
      } catch (error) { setError(error instanceof Error ? error.message : 'Revise os dados.') }
    }}>
      {mode === 'register' && <><label>Nome<input className="demo-field" required maxLength={150} autoComplete="off" value={name} onChange={event => setName(event.target.value)} /></label><label>Telefone com DDD<input className="demo-field" required type="tel" maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} /></label></>}
      <label>E-mail<input className="demo-field" required type="email" maxLength={254} autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Senha<input className="demo-field" required type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} /><span className="text-xs text-muted-foreground">Use uma senha de teste — não a sua senha real.</span></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={demo.customerBlocked} className="demo-primary w-full">{mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
    </form>
    <details className="mt-4 text-xs text-muted-foreground"><summary>Contas de teste (batedeiras e administrador)</summary><ul className="mt-2 space-y-1"><li>{adminLoginEmail} · administrador</li>{demo.stores.map(store => <li key={store.id}>{store.operatorEmail} · {store.name}</li>)}<li>Qualquer outro e-mail entra como cliente.</li></ul></details>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><button className="demo-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setPassword(''); setError('') }}>{mode === 'login' ? 'Criar conta' : 'Já tenho uma conta'}</button><button className="demo-button" onClick={() => { setRecovery(open => !open); setRecoverySent(false) }}>Esqueci meu acesso</button></div>
    {recovery && (recoverySent
      ? <p role="status" className="mt-4 rounded-xl bg-secondary/10 p-3 text-sm">Solicitação registrada. O administrador do piloto vai analisar e conceder acesso; esta etapa não envia e-mail nem SMS.</p>
      : <form className="mt-4 space-y-3 rounded-2xl border bg-muted/40 p-4" onSubmit={event => {
        event.preventDefault()
        try { demo.requestAccessRecovery(recoveryContact, recoveryReason); setRecoverySent(true); setRecoveryContact(''); setRecoveryReason('') }
        catch (error) { setError(error instanceof Error ? error.message : 'Revise os dados.') }
      }}>
        <p className="text-sm text-muted-foreground">Recuperação assistida pelo administrador. Informe um contato para retorno e o que aconteceu.</p>
        <label>Telefone ou e-mail de contato<input className="demo-field" required maxLength={254} value={recoveryContact} onChange={event => setRecoveryContact(event.target.value)} /></label>
        <label>O que aconteceu<textarea className="demo-field" required maxLength={255} value={recoveryReason} onChange={event => setRecoveryReason(event.target.value)} /></label>
        <button className="demo-primary">Enviar solicitação</button>
      </form>)}
  </section>
}

function AddressCard({ address }: { address: SavedAddress }) {
  const demo = usePrototype()
  const addresses = demo.customer.addresses
  const [draft, setDraft] = useState<SavedAddress | null>(null)
  const [error, setError] = useState('')
  const label = address.primary ? 'Principal' : 'Secundário'
  if (draft) return <form className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4" onSubmit={event => {
    event.preventDefault()
    try { demo.updateCustomer({ addresses: saveAddress(addresses, draft) }); setDraft(null); setError('') }
    catch (error) { setError(error instanceof Error ? error.message : 'Revise o endereço.') }
  }}>
    <p className="font-bold">Editar endereço {label.toLowerCase()}</p>
    <label>Rua<input className="demo-field" required maxLength={180} value={draft.street} onChange={event => setDraft({ ...draft, street: event.target.value })} /></label>
    <label>Número<input className="demo-field" required maxLength={20} value={draft.number} onChange={event => setDraft({ ...draft, number: event.target.value })} /></label>
    <label>Complemento (opcional)<input className="demo-field" maxLength={100} value={draft.complement ?? ''} onChange={event => setDraft({ ...draft, complement: event.target.value })} /></label>
    <label>Ponto de referência (opcional)<input className="demo-field" maxLength={255} value={draft.reference ?? ''} onChange={event => setDraft({ ...draft, reference: event.target.value })} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><button className="demo-primary">Salvar endereço</button><button type="button" className="demo-button" onClick={() => { setDraft(null); setError('') }}>Cancelar</button></div>
  </form>
  return <div className={`rounded-2xl border p-4 ${address.primary ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold">{address.street}, {address.number}<span className="block text-sm font-normal text-muted-foreground">Centro, Cametá/PA{address.complement ? ` · ${address.complement}` : ''}</span></p><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${address.primary ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{label}</span></div><div className="mt-3 flex flex-wrap gap-2">
    <button className="demo-button" onClick={() => setDraft(address)}>Editar</button>
    <button className="demo-button" onClick={() => demo.updateCustomer({ addresses: saveAddress(addresses, { ...address, primary: true }), address })} disabled={address.primary}>Tornar principal</button>
    <button className="demo-button" onClick={() => demo.updateCustomer({ addresses: removeAddress(addresses, address.id) })}>Remover endereço</button>
  </div></div>
}
