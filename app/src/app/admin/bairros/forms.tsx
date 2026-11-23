'use client'

import { BotaoEnvio, FormAcao } from '../../_componentes/form-acao'
import { criarBairroAction, habilitarBairroAction } from '../actions'

export function FormNovoBairro() {
  return (
    <FormAcao acao={criarBairroAction} className="flex flex-col gap-2">
      <label className="block text-sm font-semibold">
        Novo bairro
        <input name="nome" required minLength={2} maxLength={100} className="mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base" />
      </label>
      <BotaoEnvio className="self-start bg-marca text-marca-texto">Adicionar</BotaoEnvio>
    </FormAcao>
  )
}

export function ChaveBairro({ id, ativo, nome }: { id: string; ativo: boolean; nome: string }) {
  return (
    <FormAcao
      acao={habilitarBairroAction}
      className="flex flex-col"
      confirmar={ativo ? `Desabilitar ${nome}? Novos pedidos para esse bairro deixam de ser aceitos.` : undefined}
    >
      <input type="hidden" name="bairroId" value={id} />
      <input type="hidden" name="ativo" value={String(!ativo)} />
      <BotaoEnvio className="border border-borda text-sm">{ativo ? 'Desabilitar' : 'Habilitar'}</BotaoEnvio>
    </FormAcao>
  )
}
