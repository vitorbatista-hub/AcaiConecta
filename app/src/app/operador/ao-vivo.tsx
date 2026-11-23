'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Alerta visual de novo pedido e reconsulta a cada 10 s, a contingência da ADR-002 até o SSE existir.
 * O alerta não depende de som e é anunciado a leitores de tela.
 */
export function AoVivo({ aguardando }: { aguardando: string[] }) {
  const router = useRouter()
  const vistos = useRef<Set<string> | null>(null)
  const [novos, setNovos] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, 10_000)
    return () => clearInterval(t)
  }, [router])

  useEffect(() => {
    const atual = new Set(aguardando)
    if (vistos.current) {
      const chegaram = [...atual].filter(c => !vistos.current?.has(c)).length
      if (chegaram > 0) setNovos(n => n + chegaram)
    }
    vistos.current = atual
  }, [aguardando])

  useEffect(() => {
    const base = 'Painel da batedeira — AçaíConecta'
    document.title = aguardando.length > 0 ? `(${aguardando.length}) Novo pedido — ${base}` : base
  }, [aguardando.length])

  return (
    <div role="status" aria-live="assertive">
      {novos > 0 ? (
        <button
          type="button"
          onClick={() => setNovos(0)}
          className="w-full animate-pulse rounded-xl bg-folha p-4 text-left text-lg font-black text-fundo"
        >
          Novo pedido recebido! Toque para dispensar o aviso.
        </button>
      ) : null}
    </div>
  )
}
