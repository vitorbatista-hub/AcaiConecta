'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brand } from '@/components/app-shell'
import { CustomerAccount } from '@/components/customer-account'
import { usePrototype } from '@/components/prototype-provider'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useView } from '@/lib/use-view'

export default function EntrarPage() {
  const demo = usePrototype()
  const router = useRouter()
  const [view] = useView('login')
  useEffect(() => { if (demo.customer.signedIn) router.replace('/cliente') }, [demo.customer.signedIn, router])
  if (demo.customer.signedIn) return null
  return <main className="min-h-screen bg-background">
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      <header className="flex h-20 items-center justify-between"><Brand /><ThemeSwitcher /></header>
      <h1 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">{view === 'cadastro' ? 'Crie sua conta' : 'Entre na sua conta'}</h1>
      <CustomerAccount key={view} initialMode={view === 'cadastro' ? 'register' : 'login'} onDone={() => router.replace('/cliente')} />
    </div>
  </main>
}
