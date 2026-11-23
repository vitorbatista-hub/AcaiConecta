'use client'

import { useEffect, useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'

export function useRoleSignIn(storageKey: string) {
  const [signedIn, setSignedInState] = useState(false)
  useEffect(() => { try { setSignedInState(sessionStorage.getItem(storageKey) === '1') } catch {} }, [storageKey])
  const setSignedIn = (value: boolean) => {
    setSignedInState(value)
    try { if (value) sessionStorage.setItem(storageKey, '1'); else sessionStorage.removeItem(storageKey) } catch {}
  }
  return [signedIn, setSignedIn] as const
}

export function RoleLogin({ title, description, error, children, onSubmit }: {
  title: string
  description: string
  error?: string
  children: React.ReactNode
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return <section className="surface mx-auto mt-4 max-w-md sm:mt-12">
    <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden><ShieldCheck className="size-6" /></span>
    <h1 className="text-2xl font-black tracking-tight">{title}</h1>
    <p className="my-3 text-sm text-muted-foreground">{description}</p>
    <form className="space-y-4" onSubmit={onSubmit}>
      {children}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="demo-primary w-full">Simular entrada</button>
    </form>
  </section>
}

export function RoleSignedInBar({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-3 text-sm shadow-sm"><span>{children}</span><button className="demo-button inline-flex items-center gap-2" onClick={onSignOut}><LogOut className="size-4" aria-hidden />Sair</button></div>
}
