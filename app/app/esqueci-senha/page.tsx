'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthPage } from '@/components/auth-page'
import { postJson } from '@/components/auth-forms'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true); setError('')
    try {
      const { ok, data } = await postJson('/api/auth/forgot', { email })
      if (ok) setMessage(data.message ?? ''); else setError(data.error ?? 'Não foi possível concluir. Tente novamente.')
    } catch { setError('Sem conexão. Tente novamente.') } finally { setPending(false) }
  }
  return <AuthPage><section className="surface" aria-labelledby="auth-titulo">
    <h1 id="auth-titulo" className="text-xl font-black">Esqueceu a senha?</h1>
    {message ? <p role="status" className="mt-4 rounded-xl bg-secondary/10 p-3 text-sm">{message} O link vale por 30 minutos.</p> : <>
      <p className="mt-2 text-sm text-muted-foreground">Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha.</p>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <label>E-mail<input className="form-field" required type="email" maxLength={254} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <p role="alert" className="min-h-5 text-sm text-destructive">{error}</p>
        <button disabled={pending} className="btn-primary w-full">{pending ? 'Enviando…' : 'Enviar link'}</button>
      </form></>}
    <p className="mt-5 text-center text-sm"><Link href="/entrar" className="font-semibold text-primary underline-offset-4 hover:underline">Voltar para o login</Link></p>
  </section></AuthPage>
}
