'use client'

import { useState } from 'react'
import { BotaoEnvio, FormAcao } from '../_componentes/form-acao'
import { mensagemAction, transicionarAction } from './actions'

export type AcaoPedido = { para: string; rotulo: string; motivos: readonly string[] | null; destrutiva: boolean }

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'

function AcaoComMotivo({ codigo, acao }: { codigo: string; acao: AcaoPedido }) {
  const [outro, setOutro] = useState(false)
  return (
    <details className="rounded-lg border border-borda">
      <summary className="min-h-11 cursor-pointer list-none px-4 py-2.5 font-bold text-red-700 dark:text-red-400">{acao.rotulo}…</summary>
      <FormAcao acao={transicionarAction} className="flex flex-col gap-3 p-3">
        <input type="hidden" name="codigo" value={codigo} />
        <input type="hidden" name="para" value={acao.para} />
        <label className="block text-sm font-semibold">
          Motivo
          <select name="motivo" required defaultValue="" onChange={e => setOutro(e.target.value === 'Outro')} className={campo}>
            <option value="" disabled>Escolha…</option>
            {acao.motivos?.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {outro ? (
          <label className="block text-sm font-semibold">
            Descreva o motivo
            <input name="detalhe" required maxLength={200} className={campo} />
          </label>
        ) : null}
        <BotaoEnvio className="border border-red-700 text-red-700 dark:border-red-400 dark:text-red-400">Confirmar: {acao.rotulo.toLowerCase()}</BotaoEnvio>
      </FormAcao>
    </details>
  )
}

export function AcoesPedido({ codigo, acoes, mensagens }: { codigo: string; acoes: AcaoPedido[]; mensagens: readonly string[] }) {
  const diretas = acoes.filter(a => !a.motivos)
  const comMotivo = acoes.filter(a => a.motivos)
  return (
    <div className="flex flex-col gap-3">
      {diretas.map(a => (
        <FormAcao key={a.para} acao={transicionarAction} className="flex flex-col">
          <input type="hidden" name="codigo" value={codigo} />
          <input type="hidden" name="para" value={a.para} />
          <BotaoEnvio className="bg-marca text-marca-texto">{a.rotulo}</BotaoEnvio>
        </FormAcao>
      ))}
      {comMotivo.map(a => <AcaoComMotivo key={a.para} codigo={codigo} acao={a} />)}
      {mensagens.length > 0 ? (
        <details className="rounded-lg border border-borda">
          <summary className="min-h-11 cursor-pointer list-none px-4 py-2.5 font-semibold">Enviar mensagem ao cliente…</summary>
          <FormAcao acao={mensagemAction} className="flex flex-col gap-3 p-3">
            <input type="hidden" name="codigo" value={codigo} />
            <label className="block text-sm font-semibold">
              Mensagem
              <select name="mensagem" required defaultValue="" className={campo}>
                <option value="" disabled>Escolha…</option>
                {mensagens.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <BotaoEnvio className="border border-borda">Enviar</BotaoEnvio>
          </FormAcao>
        </details>
      ) : null}
    </div>
  )
}
