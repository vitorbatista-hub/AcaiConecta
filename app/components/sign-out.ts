'use client'

import { useRouter } from 'next/navigation'
import { useApp } from './app-provider'

/** Encerra a sessão no servidor e volta para a página inicial do site. Usado pelos três perfis. */
export function useSignOut(profile: 'cliente' | 'operador' | 'admin') {
  const ctx = useApp()
  const router = useRouter()
  return async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) }
    finally {
      if (profile === 'cliente') ctx.updateCustomer({ signedIn: false })
      router.replace('/')
    }
  }
}
