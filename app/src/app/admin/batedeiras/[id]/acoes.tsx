'use client'

import { BotaoEnvio, FormAcao } from '../../../_componentes/form-acao'
import { statusBatedeiraAction } from '../../actions'

const ROTULO = { ATIVAR: 'Ativar', SUSPENDER: 'Suspender', REATIVAR: 'Reativar', DESATIVAR: 'Desativar' } as const
const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'

export function AcoesStatus({ batedeiraId, acoes }: { batedeiraId: string; acoes: { acao: keyof typeof ROTULO; motivo: boolean }[] }) {
  if (acoes.length === 0) return <p className="text-sm text-suave">Batedeira desativada: sem ações disponíveis. O histórico permanece consultável.</p>
  return (
    <div className="flex flex-col gap-3">
      {acoes.map(a => (
        <FormAcao
          key={a.acao}
          acao={statusBatedeiraAction}
          confirmar={`${ROTULO[a.acao]} esta batedeira? A ação fica registrada na auditoria.`}
          className="flex flex-col gap-2 rounded-lg border border-borda p-3"
        >
          <input type="hidden" name="batedeiraId" value={batedeiraId} />
          <input type="hidden" name="acao" value={a.acao} />
          <label className="block text-sm font-semibold">
            Motivo{a.motivo ? '' : ' (opcional)'}
            <input name="motivo" required={a.motivo} maxLength={255} className={campo} />
          </label>
          <BotaoEnvio className={a.acao === 'ATIVAR' || a.acao === 'REATIVAR' ? 'bg-marca text-marca-texto' : 'border border-red-700 text-red-700 dark:border-red-400 dark:text-red-400'}>{ROTULO[a.acao]}</BotaoEnvio>
        </FormAcao>
      ))}
    </div>
  )
}
