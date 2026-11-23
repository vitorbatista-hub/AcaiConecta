'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FotoOuArte } from '../_componentes/arte'

const MAX = 5 * 1024 * 1024
const TIPOS = ['image/jpeg', 'image/png', 'image/webp']

/** Envio e remoção de foto. A conferência do navegador é só conveniência; o servidor valida o conteúdo de novo. */
export function EnviarFoto({
  alvo,
  produtoId,
  urlAtual,
  nome,
  variante = 0,
  disponivel = true,
}: {
  alvo: 'batedeira' | 'produto'
  produtoId?: string
  urlAtual: string | null
  nome: string
  variante?: number
  disponivel?: boolean
}) {
  const router = useRouter()
  const entrada = useRef<HTMLInputElement>(null)
  const ocupado = useRef(false)
  const [pendente, setPendente] = useState(false)
  const [mensagem, setMensagem] = useState<{ erro: boolean; texto: string } | null>(null)

  async function chamar(acao: 'enviar' | 'remover', arquivo?: File) {
    if (ocupado.current) return // evita envio duplo antes de a tela refletir o estado pendente
    ocupado.current = true
    setPendente(true)
    setMensagem(null)
    const form = new FormData()
    form.set('acao', acao)
    form.set('alvo', alvo)
    if (produtoId) form.set('produtoId', produtoId)
    if (arquivo) form.set('arquivo', arquivo)
    try {
      const r = await fetch('/api/operador/imagens', { method: 'POST', body: form })
      const corpo = (await r.json().catch(() => ({}))) as { erro?: string }
      if (!r.ok) setMensagem({ erro: true, texto: corpo.erro ?? 'Não foi possível concluir. Tente de novo.' })
      else {
        setMensagem({ erro: false, texto: acao === 'enviar' ? 'Foto atualizada.' : 'Foto removida.' })
        router.refresh()
      }
    } catch {
      setMensagem({ erro: true, texto: 'Sem conexão. Confira a internet e tente de novo.' })
    } finally {
      ocupado.current = false
      setPendente(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return
    if (!TIPOS.includes(arquivo.type)) return setMensagem({ erro: true, texto: 'Envie um arquivo JPEG, PNG ou WebP.' })
    if (arquivo.size > MAX) return setMensagem({ erro: true, texto: 'A imagem deve ter no máximo 5 MB.' })
    void chamar('enviar', arquivo)
  }

  const rotulo = `Foto de ${nome}`
  return (
    <div className="flex items-center gap-3">
      <FotoOuArte url={urlAtual} miniatura alt={rotulo} variante={variante} className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-col gap-1">
        {disponivel ? (
          <div className="flex flex-wrap gap-2">
            <label className={`min-h-11 cursor-pointer rounded-lg border border-borda px-3 py-2.5 text-sm font-bold ${pendente ? 'opacity-60' : ''}`}>
              {pendente ? 'Enviando…' : urlAtual ? 'Trocar foto' : 'Enviar foto'}
              <input
                ref={entrada}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={pendente}
                onChange={e => aoEscolher(e.target.files?.[0])}
                className="sr-only"
                aria-label={`${urlAtual ? 'Trocar' : 'Enviar'} ${rotulo.toLowerCase()}`}
              />
            </label>
            {urlAtual ? (
              <button type="button" disabled={pendente} onClick={() => window.confirm('Remover esta foto?') && void chamar('remover')} className="min-h-11 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-700 underline dark:text-red-400">
                Remover
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-suave">O envio de fotos não está disponível neste ambiente.</p>
        )}
        <p className="text-xs text-suave">JPEG, PNG ou WebP, até 5 MB. A localização da foto é apagada.</p>
        <p role="status" className={`min-h-4 text-sm font-semibold ${mensagem?.erro ? 'text-red-700 dark:text-red-400' : 'text-folha'}`}>{mensagem?.texto}</p>
      </div>
    </div>
  )
}
