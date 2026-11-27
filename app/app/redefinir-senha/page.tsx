'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthPage } from '@/components/auth-page'
import { postJson } from '@/components/auth-forms'

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não conferem.'); return }
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    setPending(true)
    try {
      const { ok, data } = await postJson('/api/auth/reset', { token, password })
      if (ok) setDone(true); else { setError(data.error ?? 'Não foi possível redefinir a senha.'); setPassword(''); setConfirm('') }
    } catch { setError('Sem conexão. Tente novamente.') } finally { setPending(false) }
  }
  return <AuthPage requireSignedOut={false}><section className="surface" aria-labelledby="auth-titulo">
    <h1 id="auth-titulo" className="text-xl font-black">Criar nova senha</h1>
    {done ? <><p role="status" className="mt-4 rounded-xl bg-secondary/10 p-3 text-sm">Senha alterada. Entre com a nova senha.</p><Link href="/entrar" className="btn-primary mt-4 inline-flex w-full items-center justify-center">Ir para o login</Link></> :
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label>Nova senha<input className="form-field" required type="password" minLength={8} maxLength={200} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /><span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span></label>
        <label>Confirmar nova senha<input className="form-field" required type="password" minLength={8} maxLength={200} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        <p role="alert" className="min-h-5 text-sm text-destructive">{error}</p>
        <button disabled={pending} className="btn-primary w-full">{pending ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>}
  </section></AuthPage>
}
