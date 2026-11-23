'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

// Lê a sessão do perfil; sem sessão, envia para a tela única de entrada (/entrar).
export function useRoleSignIn(storageKey: string) {
  const router = useRouter()
  const [signedIn, setSignedInState] = useState(false)
  const [checked, setChecked] = useState(false)
  useEffect(() => { try { setSignedInState(sessionStorage.getItem(storageKey) === '1') } catch {} setChecked(true) }, [storageKey])
  useEffect(() => { if (checked && !signedIn) router.replace('/entrar') }, [checked, signedIn, router])
  const setSignedIn = (value: boolean) => {
    setSignedInState(value)
    try { if (value) sessionStorage.setItem(storageKey, '1'); else sessionStorage.removeItem(storageKey) } catch {}
  }
  return [signedIn, setSignedIn] as const
}

export function RoleSignedInBar({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-3 text-sm shadow-sm"><span>{children}</span><button className="demo-button inline-flex items-center gap-2" onClick={onSignOut}><LogOut className="size-4" aria-hidden />Sair</button></div>
}
