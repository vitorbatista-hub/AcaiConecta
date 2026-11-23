'use client'

import { useActionState } from 'react'
import { cancelarPedidoAction } from './actions'

export function BotaoCancelar({ codigo }: { codigo: string }) {
  const [estado, enviar, pendente] = useActionState(cancelarPedidoAction, {})
  return (
    <form action={enviar} className="flex flex-col gap-2">
      <input type="hidden" name="codigo" value={codigo} />
      <button
        type="submit"
        disabled={pendente}
        onClick={e => {
          if (!confirm('Cancelar este pedido? Esta ação não pode ser desfeita.')) e.preventDefault()
        }}
        className="rounded-lg border border-red-700 px-4 py-2.5 font-bold text-red-700 disabled:opacity-60 dark:border-red-400 dark:text-red-400"
      >
        {pendente ? 'Cancelando…' : 'Cancelar pedido'}
      </button>
      <p role="alert" className="min-h-5 text-sm font-semibold text-red-700 dark:text-red-400">{estado.erro}</p>
    </form>
  )
}
