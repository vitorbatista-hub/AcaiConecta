'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Contingência da atualização em tempo real (ADR-002): reconsulta a cada 10 s com a aba visível. Será substituída por SSE. */
export function AtualizarPeriodicamente({ ativo }: { ativo: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!ativo) return
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, 10_000)
    return () => clearInterval(t)
  }, [ativo, router])
  return null
}
