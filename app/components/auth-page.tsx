'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Brand } from './app-shell'
import { ThemeSwitcher } from './theme-switcher'
import { useRedirectIfSignedIn } from './auth-forms'

// Moldura comum das telas de acesso (entrar, cadastro e redefinição de senha).
export function AuthPage({ children, requireSignedOut = true }: { children: React.ReactNode; requireSignedOut?: boolean }) {
  const checked = useRedirectIfSignedIn(requireSignedOut)
  return <main className="min-h-screen bg-background">
    <div className="mx-auto max-w-lg px-4 pb-10 sm:px-6">
      <header className="flex h-20 items-center justify-between gap-3"><div className="flex items-center gap-3"><Link href="/" aria-label="Voltar ao início do site" title="Voltar ao início" className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card transition hover:border-primary/40"><ArrowLeft className="size-5" aria-hidden /></Link><Brand /></div><ThemeSwitcher /></header>
      {(checked || !requireSignedOut) && children}
    </div>
  </main>
}
