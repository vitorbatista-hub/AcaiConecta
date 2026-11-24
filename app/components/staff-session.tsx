'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export type StaffInfo = { email: string; role: 'admin' | 'operador'; storeId?: string; name: string; store?: { id: string; name: string; address: string } }

// A sessão vive em cookie httpOnly emitido pelo servidor; aqui só se consulta quem está conectado.
export function useStaffSession(role: StaffInfo['role']) {
  const router = useRouter()
  const [session, setSession] = useState<StaffInfo | null>(null)
  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(response => (response.ok ? (response.json() as Promise<StaffInfo>) : null))
      .then(info => { if (!active) return; if (info && info.role === role) setSession(info); else router.replace('/entrar') })
      .catch(() => { if (active) router.replace('/entrar') })
    return () => { active = false }
  }, [role, router])
  const signOut = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } finally { router.replace('/entrar') }
  }, [router])
  return [session, signOut] as const
}

export function StaffSignedInBar({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-3 text-sm shadow-sm"><span>{children}</span><button className="btn inline-flex items-center gap-2" onClick={onSignOut}><LogOut className="size-4" aria-hidden />Sair</button></div>
}
