'use client'

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Mail, MapPin, Store as StoreIcon, UserRound } from 'lucide-react'
import { useToast } from './app-shell'
import { useApp } from './app-provider'
import { maxSavedAddresses, type SavedAddress } from '@/lib/customer-session'
import { neighborhoodLabel, officialNeighborhoods } from '@/lib/neighborhoods'
import type { Profile } from '@/lib/profile'

/** Avisa as telas que mostram o nome ou o e-mail de quem está conectado. */
export const accountChangeEvent = 'acai-account-change'

async function send<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const data = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Não foi possível salvar. Tente novamente.')
  return data
}

/** "Minha conta" dos três perfis (DEC-063). */
export function AccountSettings() {
  const ctx = useApp()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setProfile((await send<{ profile: Profile }>('/api/conta', 'GET')).profile); setError('') }
    catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível carregar sua conta.') }
  }, [])
  useEffect(() => { void load() }, [load])

  async function saved() {
    await load()
    window.dispatchEvent(new Event(accountChangeEvent))
    if (profile?.role === 'operador') await ctx.refreshCatalog()
  }
  useEffect(() => {
    if (profile?.role === 'cliente') ctx.updateCustomer({ name: profile.name, email: profile.email, phone: profile.phone })
    // Só quando os dados vindos do servidor mudam.
  }, [profile?.role, profile?.name, profile?.email, profile?.phone])

  if (!profile) return error ? <div role="alert" className="surface space-y-3"><p>{error}</p><button className="btn" onClick={() => void load()}>Tentar novamente</button></div> : <p role="status">Carregando sua conta…</p>
  return <div className="max-w-2xl space-y-5">
    <Section icon={UserRound} title="Dados pessoais" description={profile.role === 'operador' ? 'Dados do responsável pela batedeira.' : undefined}>
      <SimpleForm section="pessoais" initial={{ name: profile.name, phone: profile.phone }} submit="Salvar dados pessoais" success="Dados pessoais atualizados." onSaved={saved}>{(draft, set) => <>
        <label>Nome<input className="form-field" required minLength={2} maxLength={150} autoComplete="name" value={draft.name} onChange={set('name')} /></label>
        <label>Telefone com DDD{profile.role === 'admin' && ' (opcional)'}<input className="form-field" type="tel" required={profile.role !== 'admin'} maxLength={20} autoComplete="tel" value={draft.phone} onChange={set('phone')} /></label>
      </>}</SimpleForm>
    </Section>
    {profile.store && <Section icon={StoreIcon} title="Dados da batedeira" description="As mudanças valem na hora e ficam registradas para a administração. Horários, bairros atendidos e entrega ficam em Configurações.">
      <SimpleForm section="batedeira" initial={{ name: profile.store.name, description: profile.store.description, phone: profile.store.phone, address: profile.store.address, neighborhood: profile.store.neighborhood, reference: profile.store.reference }} submit="Salvar dados da batedeira" success="Dados da batedeira atualizados." onSaved={saved}>{(draft, set) => <>
        <label>Nome da batedeira<input className="form-field" required minLength={2} maxLength={150} value={draft.name} onChange={set('name')} /></label>
        <label>Descrição (opcional)<textarea className="form-field" maxLength={500} value={draft.description} onChange={set('description')} /></label>
        <label>Telefone de atendimento (opcional)<input className="form-field" type="tel" maxLength={20} value={draft.phone} onChange={set('phone')} /></label>
        <label>Endereço (rua e número)<input className="form-field" required minLength={5} maxLength={180} value={draft.address} onChange={set('address')} /></label>
        <label>Bairro<NeighborhoodSelect value={draft.neighborhood} onChange={set('neighborhood')} /></label>
        <label>Ponto de referência (opcional)<input className="form-field" maxLength={255} value={draft.reference} onChange={set('reference')} /></label>
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Documento: <b>{profile.store!.document}</b>. Ele identifica quem foi aprovado e não pode ser alterado aqui; em caso de erro, procure o suporte.</p>
      </>}</SimpleForm>
    </Section>}
    {profile.addresses && <Addresses addresses={profile.addresses} onChange={addresses => {
      setProfile({ ...profile, addresses })
      const primary = addresses.find(address => address.primary)
      ctx.updateCustomer({ addresses, address: primary ? { street: primary.street, number: primary.number, neighborhood: primary.neighborhood, complement: primary.complement, reference: primary.reference } : { street: '', number: '', neighborhood: '', complement: '', reference: '' } })
    }} />}
    <Section icon={Mail} title="E-mail de acesso" description={`Atual: ${profile.email}. Você entra com este e-mail; confira bem antes de salvar.`}>
      <SimpleForm section="email" initial={{ email: '', currentPassword: '' }} submit="Alterar e-mail" success="E-mail alterado. Use o novo no próximo acesso." onSaved={saved}>{(draft, set) => <>
        <label>Novo e-mail<input className="form-field" type="email" required maxLength={254} autoComplete="email" value={draft.email} onChange={set('email')} /></label>
        <label>Senha atual<input className="form-field" type="password" required maxLength={200} autoComplete="current-password" value={draft.currentPassword} onChange={set('currentPassword')} /></label>
      </>}</SimpleForm>
    </Section>
    <Section icon={KeyRound} title="Senha" description="Ao trocar a senha, os outros aparelhos conectados saem da conta.">
      <SimpleForm section="senha" initial={{ currentPassword: '', newPassword: '', confirmation: '' }} submit="Alterar senha" success="Senha alterada." onSaved={saved} valid={draft => draft.newPassword.length >= 8 && draft.newPassword === draft.confirmation}>{(draft, set) => <>
        <label>Senha atual<input className="form-field" type="password" required maxLength={200} autoComplete="current-password" value={draft.currentPassword} onChange={set('currentPassword')} /></label>
        <label>Nova senha (mínimo de 8 caracteres)<input className="form-field" type="password" required minLength={8} maxLength={200} autoComplete="new-password" value={draft.newPassword} onChange={set('newPassword')} /></label>
        <label>Repita a nova senha<input className="form-field" type="password" required maxLength={200} autoComplete="new-password" value={draft.confirmation} onChange={set('confirmation')} /></label>
        {draft.confirmation && draft.confirmation !== draft.newPassword && <p role="status" className="text-sm text-destructive">As senhas não são iguais.</p>}
      </>}</SimpleForm>
    </Section>
  </div>
}

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description?: string; children: React.ReactNode }) {
  return <section className="surface space-y-3"><h2 className="flex items-center gap-2 text-xl font-black"><Icon className="size-5 text-primary" aria-hidden />{title}</h2>{description && <p className="text-sm text-muted-foreground">{description}</p>}{children}</section>
}

type Change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
/** Formulário de um bloco: o botão de salvar só fica disponível quando há mudança. */
function SimpleForm<T extends Record<string, string>>({ section, initial, submit, success, onSaved, valid, children }: { section: string; initial: T; submit: string; success: string; onSaved: () => Promise<void>; valid?: (draft: T) => boolean; children: (draft: T, set: (key: keyof T) => Change) => React.ReactNode }) {
  const notify = useToast()
  const [edited, setEdited] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const draft = edited ?? initial
  const changed = Object.keys(initial).some(key => draft[key] !== initial[key])
  const set = (key: keyof T): Change => event => { setEdited({ ...draft, [key]: event.target.value }); setError('') }
  async function save() {
    setSaving(true); setError('')
    try { await send('/api/conta', 'PATCH', { ...draft, section }); await onSaved(); setEdited(null); notify(success) }
    catch (error) { setError(error instanceof Error ? error.message : 'Revise os dados.') }
    finally { setSaving(false) }
  }
  return <form className="space-y-3" onSubmit={event => { event.preventDefault(); void save() }}>{children(draft, set)}
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <button className="btn-primary" disabled={saving || !changed || (valid ? !valid(draft) : false)}>{saving ? 'Salvando…' : submit}</button>
  </form>
}

function NeighborhoodSelect({ value, onChange }: { value: string; onChange: Change }) {
  return <select className="form-field" required value={value} onChange={onChange}><option value="">Escolha o bairro</option>{officialNeighborhoods.map(item => <option key={item.name} value={item.name}>{neighborhoodLabel(item.name)}</option>)}</select>
}

const emptyAddress: SavedAddress = { id: '', primary: false, street: '', number: '', neighborhood: '', complement: '', reference: '' }
function Addresses({ addresses, onChange }: { addresses: SavedAddress[]; onChange: (addresses: SavedAddress[]) => void }) {
  const notify = useToast()
  const [draft, setDraft] = useState<SavedAddress | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(method: 'POST' | 'DELETE', body: unknown, success: string) {
    setBusy(true); setError('')
    try { onChange((await send<{ addresses: SavedAddress[] }>('/api/conta/enderecos', method, body)).addresses); setDraft(null); notify(success) }
    catch (error) { const message = error instanceof Error ? error.message : 'Revise o endereço.'; setError(message); if (!draft) notify(message, 'error') }
    finally { setBusy(false) }
  }
  const field = (key: 'street' | 'number' | 'neighborhood' | 'complement' | 'reference'): Change => event => setDraft(draft && { ...draft, [key]: event.target.value })
  return <Section icon={MapPin} title="Endereços" description={`Até ${maxSavedAddresses} endereços de entrega: um principal e um secundário.`}>
    {addresses.length === 0 && <p className="empty-state">Nenhum endereço salvo.</p>}
    {addresses.map(address => <div key={address.id} className={`rounded-2xl border p-4 ${address.primary ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}>
      <p className="font-semibold">{address.street}, {address.number}<span className="block text-sm font-normal text-muted-foreground">{neighborhoodLabel(address.neighborhood ?? '')}, Cametá/PA{address.complement && ` · ${address.complement}`}{address.reference && ` · ${address.reference}`}</span></p>
      <p className="mt-1 text-xs font-bold text-primary">{address.primary ? 'Principal' : 'Secundário'}</p>
      <div className="mt-3 flex flex-wrap gap-2"><button className="btn" disabled={busy} onClick={() => { setDraft(address); setError('') }}>Editar</button>{!address.primary && <button className="btn" disabled={busy} onClick={() => void run('POST', { ...address, primary: true }, 'Endereço principal atualizado.')}>Tornar principal</button>}<button className="btn" disabled={busy} onClick={() => void run('DELETE', { id: address.id }, 'Endereço removido.')}>Remover</button></div>
    </div>)}
    {draft ? <form className="space-y-3 rounded-2xl border border-primary/40 p-4" onSubmit={event => { event.preventDefault(); void run('POST', draft, 'Endereço salvo.') }}>
      <p className="font-bold">{draft.id ? 'Editar endereço' : 'Novo endereço'}</p>
      <label>Rua<input className="form-field" required maxLength={180} value={draft.street} onChange={field('street')} /></label>
      <label>Número<input className="form-field" required maxLength={20} value={draft.number} onChange={field('number')} /></label>
      <label>Bairro<NeighborhoodSelect value={draft.neighborhood ?? ''} onChange={field('neighborhood')} /></label>
      <label>Complemento (opcional)<input className="form-field" maxLength={100} value={draft.complement ?? ''} onChange={field('complement')} /></label>
      <label>Ponto de referência (opcional)<input className="form-field" maxLength={255} value={draft.reference ?? ''} onChange={field('reference')} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><button className="btn-primary" disabled={busy}>Salvar endereço</button><button type="button" className="btn" onClick={() => { setDraft(null); setError('') }}>Cancelar</button></div>
    </form> : addresses.length < maxSavedAddresses && <button className="btn-primary" onClick={() => { setDraft(emptyAddress); setError('') }}>Adicionar endereço</button>}
  </Section>
}
