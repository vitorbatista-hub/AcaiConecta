'use client'

import { BotaoEnvio, FormAcao } from '../../../_componentes/form-acao'
import { cancelarPedidoAdminAction, intervencaoAction } from '../../actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'

export function Suporte({ codigo, mensagens, podeCancelar, encerrado }: { codigo: string; mensagens: readonly string[]; podeCancelar: boolean; encerrado: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {encerrado ? <p className="text-sm text-suave">Pedido encerrado: o histórico permanece consultável, sem novas intervenções.</p> : (
        <FormAcao acao={intervencaoAction} className="flex flex-col gap-2 rounded-lg border border-borda p-3">
          <input type="hidden" name="codigo" value={codigo} />
          <label className="block text-sm font-semibold">
            Mensagem ao cliente (registrada na linha do tempo)
            <select name="mensagem" required defaultValue="" className={campo}>
              <option value="" disabled>Escolha…</option>
              {mensagens.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <BotaoEnvio className="border border-borda">Registrar mensagem</BotaoEnvio>
        </FormAcao>
      )}
      {podeCancelar ? (
        <FormAcao acao={cancelarPedidoAdminAction} confirmar="Cancelar este pedido por impossibilidade operacional? Não pode ser desfeito." className="flex flex-col gap-2 rounded-lg border border-borda p-3">
          <input type="hidden" name="codigo" value={codigo} />
          <label className="block text-sm font-semibold">Motivo do cancelamento<input name="motivo" required maxLength={255} className={campo} /></label>
          <BotaoEnvio className="border border-red-700 text-red-700 dark:border-red-400 dark:text-red-400">Cancelar pedido</BotaoEnvio>
          <p className="text-xs text-suave">Só é possível depois do aceite e antes da saída para entrega, por impossibilidade operacional.</p>
        </FormAcao>
      ) : null}
    </div>
  )
}
