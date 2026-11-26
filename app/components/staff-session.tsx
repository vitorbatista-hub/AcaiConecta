'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountChangeEvent } from './account-settings'

export type StaffInfo = { email: string; role: 'admin' | 'operador'; storeId?: string; name: string; store?: { id: string; name: string; address: string; neighborhood?: string } }

// A sessão vive em cookie httpOnly emitido pelo servidor; aqui só se consulta quem está conectado.
export function useStaffSession(role: StaffInfo['role']) {
  const router = useRouter()
  const [session, setSession] = useState<StaffInfo | null>(null)
  useEffect(() => {
    let active = true
    const load = () => fetch('/api/auth/me', { cache: 'no-store' })
      .then(response => (response.ok ? (response.json() as Promise<StaffInfo>) : null))
      .then(info => { if (!active) return; if (info && info.role === role) setSession(info); else router.replace('/entrar') })
      .catch(() => { if (active) router.replace('/entrar') })
    void load()
    window.addEventListener(accountChangeEvent, load)
    return () => { active = false; window.removeEventListener(accountChangeEvent, load) }
  }, [role, router])
  return session
}

/** Saudação das telas iniciais de cada perfil. */
export function WelcomeBar({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 break-words rounded-2xl border bg-card px-4 py-3 text-xl leading-tight tracking-tight shadow-sm sm:text-2xl">{children}</p>
}
