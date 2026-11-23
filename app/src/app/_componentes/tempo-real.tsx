'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const FALHAS_ATE_CONTINGENCIA = 4
const POLLING_MS = 10_000
const REPETIR_SSE_MS = 60_000

/**
 * Atualização em tempo real por SSE (ADR-002). Cada evento recebido reconsulta a página (`router.refresh`),
 * que continua sendo a fonte dos dados. O EventSource reconecta sozinho e retoma pelo Last-Event-ID.
 * Se a conexão falhar repetidamente (ex.: proxy de operadora), cai para reconsulta a cada 10 s e avisa;
 * a cada minuto tenta o SSE de novo.
 */
export function useTempoReal(url: string, ativo = true): { contingencia: boolean } {
  const router = useRouter()
  const [contingencia, setContingencia] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const refresco = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ativo) return
    let falhas = 0
    let fechado = false
    const atualizar = () => {
      // Vários eventos seguidos (ex.: aceite + mensagem) viram uma única reconsulta.
      if (refresco.current) clearTimeout(refresco.current)
      refresco.current = setTimeout(() => router.refresh(), 250)
    }
    const es = new EventSource(url)
    es.onopen = () => {
      falhas = 0
      setContingencia(false)
    }
    es.addEventListener('pedido', atualizar)
    es.addEventListener('encerrado', () => {
      es.close()
      router.refresh() // sessão inválida: a página redireciona para o login
    })
    es.onerror = () => {
      if (fechado) return
      falhas++
      if (falhas >= FALHAS_ATE_CONTINGENCIA) {
        es.close()
        setContingencia(true)
      }
    }
    return () => {
      fechado = true
      es.close()
      if (refresco.current) clearTimeout(refresco.current)
    }
  }, [url, ativo, router, tentativa])

  useEffect(() => {
    if (!ativo || !contingencia) return
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, POLLING_MS)
    const repetir = setTimeout(() => setTentativa(n => n + 1), REPETIR_SSE_MS)
    return () => {
      clearInterval(poll)
      clearTimeout(repetir)
    }
  }, [ativo, contingencia, router, tentativa])

  return { contingencia }
}

export function AvisoContingencia() {
  return (
    <p role="status" className="rounded-lg border border-borda bg-cartao px-3 py-2 text-sm text-suave">
      A atualização em tempo real está indisponível. A tela é atualizada a cada 10 segundos e pode atrasar.
    </p>
  )
}

/** Para telas que só precisam se manter atualizadas, sem lógica própria. */
export function TempoReal({ url, ativo = true }: { url: string; ativo?: boolean }) {
  const { contingencia } = useTempoReal(url, ativo)
  return contingencia ? <AvisoContingencia /> : null
}
