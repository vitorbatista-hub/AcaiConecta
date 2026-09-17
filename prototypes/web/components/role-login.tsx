'use client'

import { useEffect, useState } from 'react'

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
  return <section className="mx-auto max-w-md rounded-2xl border bg-card p-6">
    <h1 className="text-xl font-bold">{title}</h1>
    <p className="my-3 text-sm text-muted-foreground">{description}</p>
    <form className="space-y-4" onSubmit={onSubmit}>
      {children}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="demo-primary w-full">Simular entrada</button>
    </form>
  </section>
}

export function RoleSignedInBar({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm"><span>{children}</span><button className="demo-button" onClick={onSignOut}>Sair</button></div>
}
