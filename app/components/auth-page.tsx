'use client'

import { Brand } from './app-shell'
import { ThemeSwitcher } from './theme-switcher'
import { useRedirectIfSignedIn } from './auth-forms'

// Moldura comum das telas de acesso (entrar, cadastro e redefinição de senha).
export function AuthPage({ children, requireSignedOut = true }: { children: React.ReactNode; requireSignedOut?: boolean }) {
  const checked = useRedirectIfSignedIn(requireSignedOut)
  return <main className="min-h-screen bg-background">
    <div className="mx-auto max-w-lg px-4 pb-10 sm:px-6">
      <header className="flex h-20 items-center justify-between"><Brand /><ThemeSwitcher /></header>
      {(checked || !requireSignedOut) && children}
    </div>
  </main>
}
