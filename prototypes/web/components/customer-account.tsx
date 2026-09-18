'use client'

import { useState } from 'react'
import { usePrototype } from './prototype-provider'
import { removeAddress, saveAddress } from '@/lib/customer-session'
import { guestCustomerName } from '@/lib/mock-data'

export function CustomerAccount({ onDone }: { onDone?: () => void }) {
  const demo = usePrototype()
  const customer = demo.customer
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [recoveryContact, setRecoveryContact] = useState('')
  const [recoveryReason, setRecoveryReason] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  if (customer.signedIn) return <section className="space-y-4 rounded-2xl border bg-card p-5">
    <h2 className="text-xl font-bold">Sua conta</h2>
    <p>{customer.name} · {customer.email}</p>
    <p className="text-sm text-muted-foreground">Os dados desta conta e dos pedidos ficam somente nesta aba do navegador.</p>
    <button className="demo-button" onClick={() => demo.updateCustomer({ signedIn: false })}>Sair da conta</button>
    <h3 className="font-bold">Endereços salvos</h3>
    {customer.addresses.length === 0 && <p className="text-sm">Salve um endereço ao confirmar seu próximo pedido.</p>}
    {customer.addresses.map(address => <div key={address.id} className="rounded-xl border p-3"><p>{address.street}, {address.number} · Centro {address.primary && '· Principal'}</p><div className="mt-2 flex flex-wrap gap-2"><button className="demo-button" onClick={() => demo.updateCustomer({ addresses: saveAddress(customer.addresses, { ...address, primary: true }), address })} disabled={address.primary}>Tornar principal</button><button className="demo-button" onClick={() => demo.updateCustomer({ addresses: removeAddress(customer.addresses, address.id) })}>Remover endereço</button></div></div>)}
    {onDone && <button className="demo-primary" onClick={onDone}>Continuar pedido</button>}
  </section>
  return <section className="rounded-2xl border bg-card p-5">
    <h2 className="text-xl font-bold">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
    <p className="my-3 text-sm text-muted-foreground">Esta etapa ainda não realiza autenticação no servidor; use dados e uma senha de teste, nunca dados reais.</p>
    {demo.customerBlocked && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3">Conta bloqueada pelo administrador. Acesse a ajuda para orientação.</p>}
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault()
      try {
        if (mode === 'register' && !/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) throw new Error('Informe telefone com DDD.')
        demo.updateCustomer({ signedIn: true, name: name.trim() || guestCustomerName, email: email.trim(), phone: phone || customer.phone })
        setPassword(''); setError(''); onDone?.()
      } catch (error) { setError(error instanceof Error ? error.message : 'Revise os dados.') }
    }}>
      {mode === 'register' && <><label>Nome<input className="demo-field" required maxLength={150} autoComplete="off" value={name} onChange={event => setName(event.target.value)} /></label><label>Telefone com DDD<input className="demo-field" required type="tel" maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} /></label></>}
      <label>E-mail<input className="demo-field" required type="email" maxLength={254} autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Senha<input className="demo-field" required type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} /><span className="text-xs text-muted-foreground">Use uma senha de teste — não a sua senha real.</span></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={demo.customerBlocked} className="demo-primary">{mode === 'login' ? 'Simular entrada' : 'Simular cadastro'}</button>
    </form>
    <div className="mt-4 flex flex-wrap gap-2"><button className="demo-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setPassword(''); setError('') }}>{mode === 'login' ? 'Criar conta' : 'Já tenho uma conta'}</button><button className="demo-button" onClick={() => { setRecovery(open => !open); setRecoverySent(false) }}>Esqueci meu acesso</button></div>
    {recovery && (recoverySent
      ? <p role="status" className="mt-4 rounded-xl bg-secondary/10 p-3 text-sm">Solicitação registrada. O administrador do piloto vai analisar e conceder acesso; esta etapa não envia e-mail nem SMS.</p>
      : <form className="mt-4 space-y-3 rounded-xl border p-4" onSubmit={event => {
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
