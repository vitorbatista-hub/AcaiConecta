'use client'

import { useEffect, useRef, useState } from 'react'
import { AvisoContingencia, useTempoReal } from '../_componentes/tempo-real'

/**
 * Alerta visual de novo pedido (PRD §8.2) sobre a atualização em tempo real por SSE (ADR-002).
 * O alerta não depende de som e é anunciado a leitores de tela.
 */
export function AoVivo({ aguardando, desde }: { aguardando: string[]; desde: string }) {
  const { contingencia } = useTempoReal(`/api/eventos/batedeira?desde=${desde}`)
  const vistos = useRef<Set<string> | null>(null)
  const [novos, setNovos] = useState(0)

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
    <div className="flex flex-col gap-3">
      {contingencia ? <AvisoContingencia /> : null}
      <div role="status" aria-live="assertive">
        {novos > 0 ? (
          <button type="button" onClick={() => setNovos(0)} className="w-full animate-pulse rounded-xl bg-folha p-4 text-left text-lg font-black text-fundo">
            Novo pedido recebido! Toque para dispensar o aviso.
          </button>
        ) : null}
      </div>
    </div>
  )
}
