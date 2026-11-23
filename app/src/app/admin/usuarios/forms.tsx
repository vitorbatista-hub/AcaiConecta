'use client'

import { BotaoEnvio, FormAcao } from '../../_componentes/form-acao'
import { bloqueioAction, senhaAction } from '../actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'

export function AcoesUsuario({ id, bloqueado }: { id: string; bloqueado: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <details className="rounded-lg border border-borda">
        <summary className="min-h-11 cursor-pointer list-none px-4 py-2.5 text-sm font-bold">{bloqueado ? 'Reativar conta…' : 'Bloquear conta…'}</summary>
        <FormAcao acao={bloqueioAction} confirmar={bloqueado ? 'Reativar esta conta?' : 'Bloquear esta conta? Todas as sessões serão encerradas.'} className="flex flex-col gap-2 p-3">
          <input type="hidden" name="usuarioId" value={id} />
          <input type="hidden" name="bloquear" value={String(!bloqueado)} />
          <label className="block text-sm font-semibold">Motivo<input name="motivo" required maxLength={255} className={campo} /></label>
          <BotaoEnvio className="border border-borda">{bloqueado ? 'Reativar' : 'Bloquear'}</BotaoEnvio>
        </FormAcao>
      </details>
      <details className="rounded-lg border border-borda">
        <summary className="min-h-11 cursor-pointer list-none px-4 py-2.5 text-sm font-bold">Redefinir senha…</summary>
        <FormAcao acao={senhaAction} confirmar="Redefinir a senha? As sessões atuais do usuário serão encerradas." className="flex flex-col gap-2 p-3">
          <input type="hidden" name="usuarioId" value={id} />
          <label className="block text-sm font-semibold">Nova senha temporária<input name="senha" type="text" required minLength={8} autoComplete="off" spellCheck={false} className={campo} /></label>
          <BotaoEnvio className="border border-borda">Redefinir senha</BotaoEnvio>
        </FormAcao>
      </details>
    </div>
  )
}
