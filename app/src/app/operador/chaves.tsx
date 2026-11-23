'use client'

import { FormAcao, BotaoEnvio } from '../_componentes/form-acao'
import { disponibilidadeAction } from './actions'

/** Chaves independentes de aberta/fechada e entrega (PRD §10.1); confirmação antes de alternar (DEC-039). */
export function ChavesDisponibilidade({ aberta, entrega, aceitando }: { aberta: boolean; entrega: boolean; aceitando: boolean }) {
  const chave = (campo: 'aberta' | 'entregaDisponivel', ligado: boolean, rotuloLigado: string, rotuloDesligado: string, confirmar: string) => (
    <FormAcao acao={disponibilidadeAction} confirmar={confirmar} className="flex flex-col">
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="valor" value={String(!ligado)} />
      <BotaoEnvio className={ligado ? 'bg-folha text-fundo' : 'border border-red-700 text-red-700 dark:border-red-400 dark:text-red-400'}>
        {ligado ? rotuloLigado : rotuloDesligado}
      </BotaoEnvio>
    </FormAcao>
  )
  return (
    <section aria-labelledby="h-disp" className="rounded-xl border border-borda bg-cartao p-4">
      <h2 id="h-disp" className="font-black">Disponibilidade</h2>
      <p className="mt-1 text-sm text-suave">
        {aceitando ? 'Recebendo pedidos agora.' : 'Não está recebendo pedidos agora (a batedeira precisa estar ativa, aberta, dentro do horário regular e com entrega disponível).'}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {chave('aberta', aberta, 'Aberta — tocar para fechar', 'Fechada — tocar para abrir', aberta ? 'Fechar a batedeira? Você deixa de receber novos pedidos.' : 'Abrir a batedeira?')}
        {chave('entregaDisponivel', entrega, 'Entregas ligadas — tocar para pausar', 'Entregas pausadas — tocar para ligar', entrega ? 'Pausar as entregas? Novos pedidos não serão aceitos.' : 'Ligar as entregas?')}
      </div>
    </section>
  )
}
