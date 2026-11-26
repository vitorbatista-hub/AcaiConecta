'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, UserRound } from 'lucide-react'
import { StatusPill, useToast } from './app-shell'
import { useApp } from './app-provider'
import { Modal } from './modal'
import type { CustomerAccount } from '@/lib/customer-rules'

const statusLabel = { ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado', DESATIVADO: 'Desativado' } as const

/** Contas de cliente do banco, com bloqueio e reativação pelo administrador. */
export function CustomerAccounts() {
  const { refreshCatalog } = useApp()
  const notify = useToast()
  const [customers, setCustomers] = useState<CustomerAccount[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<CustomerAccount | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/clientes', { cache: 'no-store' })
      if (!response.ok) throw new Error()
      setCustomers((await response.json() as { customers: CustomerAccount[] }).customers); setLoadError('')
    } catch { setLoadError('Não foi possível carregar os clientes.') }
  }, [])
  useEffect(() => { void load() }, [load])

  function open(customer: CustomerAccount) { setSelected(customer); setReason(''); setError('') }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return
    setPending(true); setError('')
    try {
      const response = await fetch('/api/admin/clientes/situacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, status: selected.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO', reason }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) { setError(data.error ?? 'Não foi possível salvar. Tente novamente.'); void load(); return }
      setSelected(null); notify('Situação da conta atualizada e auditada.')
      await Promise.all([load(), refreshCatalog()])
    } catch { setError('Sem conexão. Tente novamente.') } finally { setPending(false) }
  }

  return <section>
    <h2 className="mb-3 text-xl font-black">Acesso de clientes</h2>
    <p className="mb-3 text-sm text-muted-foreground">O bloqueio encerra o acesso na hora e impede novas entradas e novos pedidos. O histórico é preservado e os pedidos em andamento não são cancelados automaticamente.</p>
    {loadError && <div role="alert" className="surface mb-3 space-y-3"><p>{loadError}</p><button className="btn" onClick={() => void load()}>Tentar novamente</button></div>}
    {customers === null ? !loadError && <p role="status">Carregando clientes…</p> : customers.length === 0 ? <p className="empty-state">Nenhum cliente cadastrado ainda.</p> : <ul className="grid gap-3 sm:grid-cols-2">{customers.map(customer => <li key={customer.id} className="flex flex-col rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden><UserRound className="size-5" /></span><div className="min-w-0 flex-1 text-sm"><p className="break-words font-bold">{customer.name}</p><p className="break-all text-muted-foreground">{customer.email}</p>{customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}</div><StatusPill status={customer.status === 'ATIVO' ? 'open' : 'negative'} label={statusLabel[customer.status]} /></div>
      {customer.status !== 'DESATIVADO' && <button className="btn mt-3 inline-flex items-center gap-2 self-start" onClick={() => open(customer)}><ShieldAlert className="size-4" aria-hidden />{customer.status === 'BLOQUEADO' ? 'Reativar conta' : 'Bloquear conta'}</button>}
    </li>)}</ul>}
    {selected && <Modal title={selected.status === 'BLOQUEADO' ? 'Reativar conta' : 'Bloquear conta'} onClose={() => setSelected(null)}><form className="space-y-4" onSubmit={submit}>
      <p className="break-words rounded-xl bg-muted p-3 text-sm"><b className="block">{selected.name}</b>{selected.email}</p>
      <label>Motivo administrativo<textarea required maxLength={255} className="form-field" value={reason} onChange={event => setReason(event.target.value)} /></label>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? 'Salvando…' : 'Confirmar e registrar auditoria'}</button>
    </form></Modal>}
  </section>
}
