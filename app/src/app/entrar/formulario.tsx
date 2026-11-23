'use client'

import { useActionState } from 'react'
import type { EstadoForm } from './actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base'

export function Formulario({
  acao,
  rotulo,
  campos,
  proximo,
}: {
  acao: (e: EstadoForm, f: FormData) => Promise<EstadoForm>
  rotulo: string
  campos: ReadonlyArray<{ nome: string; rotulo: string; tipo: string; autocomplete: string; dica?: string }>
  proximo?: string
}) {
  const [estado, enviar, pendente] = useActionState(acao, {})
  return (
    <form action={enviar} className="flex flex-col gap-4" noValidate>
      {proximo ? <input type="hidden" name="proximo" value={proximo} /> : null}
      {campos.map(c => (
        <label key={c.nome} className="block text-sm font-semibold">
          {c.rotulo}
          <input
            name={c.nome}
            type={c.tipo}
            autoComplete={c.autocomplete}
            required
            aria-describedby={c.dica ? `${c.nome}-dica` : undefined}
            className={campo}
          />
          {c.dica ? (
            <span id={`${c.nome}-dica`} className="mt-1 block text-xs font-normal text-suave">
              {c.dica}
            </span>
          ) : null}
        </label>
      ))}
      <p role="alert" className="min-h-5 text-sm font-semibold text-red-700 dark:text-red-400">
        {estado.erro}
      </p>
      <button type="submit" disabled={pendente} className="rounded-lg bg-marca px-4 py-3 font-bold text-marca-texto disabled:opacity-60">
        {pendente ? 'Aguarde…' : rotulo}
      </button>
    </form>
  )
}
