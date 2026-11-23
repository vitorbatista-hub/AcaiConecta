'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** Tempo restante para responder (PRD §12.4). O servidor é quem decide: aqui é só exibição. */
export function Contagem({ expiraEm }: { expiraEm: string }) {
  const router = useRouter()
  const alvo = new Date(expiraEm).getTime()
  const [restante, setRestante] = useState<number | null>(null)
  useEffect(() => {
    const calc = () => Math.max(0, Math.ceil((alvo - Date.now()) / 1000))
    setRestante(calc())
    const t = setInterval(() => {
      const r = calc()
      setRestante(r)
      if (r === 0) {
        clearInterval(t)
        router.refresh()
      }
    }, 1000)
    return () => clearInterval(t)
  }, [alvo, router])
  if (restante === null) return null
  if (restante === 0) return <span className="font-bold text-red-700 dark:text-red-400">Prazo encerrado</span>
  const m = Math.floor(restante / 60)
  const s = String(restante % 60).padStart(2, '0')
  return <span className={`font-black ${restante <= 60 ? 'text-red-700 dark:text-red-400' : ''}`}>Responder em {m}:{s}</span>
}
