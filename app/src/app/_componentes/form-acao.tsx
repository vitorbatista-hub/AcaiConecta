'use client'

import { useActionState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

export type EstadoAcao = { erro?: string; ok?: string }

export function BotaoEnvio({ children, className = '', pendenteTexto = 'Aguarde…' }: { children: ReactNode; className?: string; pendenteTexto?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`min-h-11 rounded-lg px-4 py-2 font-bold disabled:opacity-60 ${className}`}>
      {pending ? pendenteTexto : children}
    </button>
  )
}

/** Formulário com server action, mensagem de erro/sucesso anunciada e confirmação opcional. */
export function FormAcao({
  acao,
  children,
  confirmar,
  className = 'flex flex-col gap-3',
}: {
  acao: (e: EstadoAcao, f: FormData) => Promise<EstadoAcao>
  children: ReactNode
  confirmar?: string
  className?: string
}) {
  const [estado, enviar] = useActionState(acao, {})
  return (
    <form
      action={enviar}
      className={className}
      onSubmit={e => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault()
      }}
    >
      {children}
      <p role="status" className={`min-h-5 text-sm font-semibold ${estado.erro ? 'text-red-700 dark:text-red-400' : 'text-folha'}`}>
        {estado.erro ?? estado.ok}
      </p>
    </form>
  )
}
