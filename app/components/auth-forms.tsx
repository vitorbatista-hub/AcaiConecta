'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { useApp } from './app-provider'
import { sessionPatchFromProfile, type SavedAddress } from '@/lib/customer-session'
import { neighborhoodLabel, officialNeighborhoods } from '@/lib/neighborhoods'

type Result = { role?: string; redirect?: string; error?: string; message?: string }

export async function postJson(url: string, payload: object): Promise<{ ok: boolean; data: Result }> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  return { ok: response.ok, data: (await response.json().catch(() => ({}))) as Result }
}

const panelFor = (role?: string) => (role === 'admin' ? '/admin' : role === 'operador' ? '/operador' : '/cliente')

// Quem já tem sessão válida vai direto ao próprio painel; as telas de acesso só aparecem depois dessa checagem.
export function useRedirectIfSignedIn(enabled = true) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (!enabled) { setChecked(true); return }
    let active = true
    fetch('/api/auth/me', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then((me: { role?: string } | null) => {
      if (!active) return
      if (me?.role) router.replace(panelFor(me.role)); else setChecked(true)
    }).catch(() => { if (active) setChecked(true) })
    return () => { active = false }
  }, [router, enabled])
  return checked
}

function Heading({ title }: { title: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden><KeyRound className="size-5" /></span><h1 id="auth-titulo" className="text-xl font-black">{title}</h1></div>
}

export function LoginForm() {
  const ctx = useApp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true); setError('')
    try {
      const { ok, data } = await postJson('/api/auth/login', { email, password })
      if (!ok || !data.redirect) { setError(data.error ?? 'Não foi possível entrar. Tente novamente.'); setPassword(''); return }
      if (data.role === 'cliente') {
        const me = (await fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json())) as { name: string; email: string; phone?: string; addresses?: SavedAddress[] }
        ctx.updateCustomer(sessionPatchFromProfile(me, ctx.customer))
      }
      router.replace(data.redirect)
    } catch { setError('Sem conexão. Tente novamente.') } finally { setPending(false) }
  }

  return <section className="surface" aria-labelledby="auth-titulo">
    <Heading title="Entrar" />
    <form className="mt-4 space-y-4" onSubmit={submit}>
      <label>E-mail<input className="form-field" required type="email" maxLength={254} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<input className="form-field" required type="password" maxLength={200} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <p className="text-right text-sm"><Link href="/esqueci-senha" className="font-semibold text-primary underline-offset-4 hover:underline">Esqueceu a senha?</Link></p>
      <p role="alert" className="min-h-5 text-sm text-destructive">{error}</p>
      <button disabled={pending} className="btn-primary w-full">{pending ? 'Entrando…' : 'Entrar'}</button>
    </form>
    <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">Ainda não tem conta?<Link href="/cadastro" className="btn mt-2 inline-flex w-full items-center justify-center">Criar conta</Link></div>
  </section>
}

function BairroSelect({ value, onChange, label }: { value: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void; label: string }) {
  return <label>{label}<select className="form-field" required value={value} onChange={onChange}><option value="">Escolha o bairro</option>{officialNeighborhoods.map(item => <option key={item.name} value={item.name}>{neighborhoodLabel(item.name)}</option>)}</select></label>
}

type Kind = 'cliente' | 'batedeira'
export function RegisterForm() {
  const ctx = useApp()
  const router = useRouter()
  const [kind, setKind] = useState<Kind>('cliente')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', storeName: '', address: '', document: '', street: '', number: '', neighborhood: '', complement: '', reference: '' })
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value })

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true); setError('')
    try {
      const { ok, data } = await postJson('/api/auth/register', { tipo: kind, ...form })
      if (!ok || !data.redirect) { setError(data.error ?? 'Não foi possível concluir. Tente novamente.'); setForm(f => ({ ...f, password: '' })); return }
      if (data.role === 'cliente') {
        const me = (await fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json())) as { name: string; email: string; phone?: string; addresses?: SavedAddress[] }
        ctx.updateCustomer(sessionPatchFromProfile(me, ctx.customer))
      }
      router.replace(data.redirect)
    } catch { setError('Sem conexão. Tente novamente.') } finally { setPending(false) }
  }

  return <section className="surface" aria-labelledby="auth-titulo">
    <Heading title="Criar conta" />
    <div role="group" aria-label="Tipo de conta" className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" className="btn" aria-pressed={kind === 'cliente'} onClick={() => setKind('cliente')}>Sou cliente</button>
      <button type="button" className="btn" aria-pressed={kind === 'batedeira'} onClick={() => setKind('batedeira')}>Sou batedeira</button>
    </div>
    <form className="mt-4 space-y-4" onSubmit={submit}>
      {kind === 'batedeira' && <>
        <label>CPF ou CNPJ<input className="form-field" required inputMode="numeric" maxLength={18} autoComplete="off" value={form.document} onChange={set('document')} /><span className="text-xs text-muted-foreground">Usado apenas pela administração para conferir a elegibilidade da batedeira.</span></label>
        <label>Nome da batedeira<input className="form-field" required maxLength={150} autoComplete="organization" value={form.storeName} onChange={set('storeName')} /></label>
        <label>Endereço (rua e número)<input className="form-field" required maxLength={180} autoComplete="street-address" value={form.address} onChange={set('address')} /></label>
        <BairroSelect value={form.neighborhood} onChange={set('neighborhood')} label="Bairro da batedeira" />
      </>}
      <label>{kind === 'batedeira' ? 'Nome do responsável' : 'Nome'}<input className="form-field" required maxLength={150} autoComplete="name" value={form.name} onChange={set('name')} /></label>
      <label>Telefone com DDD<input className="form-field" required type="tel" maxLength={20} autoComplete="tel-national" value={form.phone} onChange={set('phone')} /></label>
      {kind === 'cliente' && <fieldset className="space-y-4 rounded-2xl border p-4"><legend className="px-1 text-sm font-bold">Endereço de entrega</legend>
        <label>Rua<input className="form-field" required maxLength={180} autoComplete="address-line1" value={form.street} onChange={set('street')} /></label>
        <label>Número<input className="form-field" required maxLength={20} value={form.number} onChange={set('number')} /></label>
        <label>Complemento (opcional)<input className="form-field" maxLength={100} value={form.complement} onChange={set('complement')} /></label>
        <label>Ponto de referência (opcional)<input className="form-field" maxLength={255} value={form.reference} onChange={set('reference')} /></label>
        <BairroSelect value={form.neighborhood} onChange={set('neighborhood')} label="Bairro" />
        <p className="text-xs text-muted-foreground">Atendemos os bairros da zona urbana de Cametá/PA. Você poderá editar o endereço depois.</p>
      </fieldset>}
      <label>E-mail<input className="form-field" required type="email" maxLength={254} autoComplete="username" value={form.email} onChange={set('email')} /></label>
      <label>Senha<input className="form-field" required type="password" maxLength={200} autoComplete="new-password" value={form.password} onChange={set('password')} /><span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span></label>
      {kind === 'batedeira' && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Depois do cadastro, a administração analisa e ativa sua batedeira. Até lá você acessa o painel, mas não recebe pedidos.</p>}
      <p role="alert" className="min-h-5 text-sm text-destructive">{error}</p>
      <button disabled={pending} className="btn-primary w-full">{pending ? 'Aguarde…' : 'Criar conta'}</button>
    </form>
    <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">Já tem conta?<Link href="/entrar" className="btn mt-2 inline-flex w-full items-center justify-center">Entrar</Link></div>
  </section>
}
