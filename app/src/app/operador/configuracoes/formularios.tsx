'use client'

import { BotaoEnvio, FormAcao } from '../../_componentes/form-acao'
import { bairrosAction, horariosAction, perfilAction } from '../actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function FormPerfil(p: { descricao: string; telefone: string; min: number; max: number }) {
  return (
    <FormAcao acao={perfilAction}>
      <label className="block text-sm font-semibold">Descrição (opcional)<textarea name="descricao" maxLength={500} rows={2} defaultValue={p.descricao} className={campo} /></label>
      <label className="block text-sm font-semibold">Telefone da batedeira (opcional, com DDD)<input name="telefone" type="tel" inputMode="tel" defaultValue={p.telefone} className={campo} /></label>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-1 text-sm font-semibold">Estimativa de entrega (minutos)</legend>
        <label className="block text-sm">Mínimo<input name="min" type="number" min={1} max={240} required defaultValue={p.min} className={campo} /></label>
        <label className="block text-sm">Máximo<input name="max" type="number" min={1} max={240} required defaultValue={p.max} className={campo} /></label>
      </fieldset>
      <BotaoEnvio className="bg-marca text-marca-texto">Salvar</BotaoEnvio>
    </FormAcao>
  )
}

export function FormBairros({ bairros }: { bairros: { id: string; nome: string; atende: boolean; taxa: string }[] }) {
  return (
    <FormAcao acao={bairrosAction}>
      {bairros.length === 0 ? <p className="text-sm text-suave">Nenhum bairro habilitado pelo administrador.</p> : null}
      {bairros.map(b => (
        <div key={b.id} className="grid grid-cols-[1fr_8rem] items-end gap-3">
          <input type="hidden" name="bairroId" value={b.id} />
          <label className="flex min-h-11 items-center gap-2 font-semibold">
            <input type="checkbox" name={`atende-${b.id}`} defaultChecked={b.atende} className="h-5 w-5" /> {b.nome}
          </label>
          <label className="block text-sm">Taxa (R$)<input name={`taxa-${b.id}`} inputMode="decimal" defaultValue={b.taxa} aria-label={`Taxa de entrega para ${b.nome}`} className={campo} /></label>
        </div>
      ))}
      <p className="text-xs text-suave">Taxa 0,00 significa entrega grátis. O cliente vê o valor antes de enviar o pedido.</p>
      <BotaoEnvio className="bg-marca text-marca-texto">Salvar bairros e taxas</BotaoEnvio>
    </FormAcao>
  )
}

export type HorarioDia = { dia: number; ativo: boolean; abertura: string; fechamento: string }

export function FormHorarios({ dias }: { dias: HorarioDia[] }) {
  return (
    <FormAcao acao={horariosAction}>
      {dias.map(d => (
        <fieldset key={d.dia} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
          <legend className="sr-only">{DIAS[d.dia]}</legend>
          <label className="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" name={`ativo-${d.dia}`} defaultChecked={d.ativo} className="h-5 w-5" /> {DIAS[d.dia]}</label>
          <label className="block text-xs">Abre<input type="time" name={`abre-${d.dia}`} defaultValue={d.abertura} required className={campo} /></label>
          <label className="block text-xs">Fecha<input type="time" name={`fecha-${d.dia}`} defaultValue={d.fechamento} required className={campo} /></label>
        </fieldset>
      ))}
      <p className="text-xs text-suave">Um intervalo por dia. Dias desmarcados ficam fechados. O botão “fechada” do painel prevalece sobre o horário.</p>
      <BotaoEnvio className="bg-marca text-marca-texto">Salvar horários</BotaoEnvio>
    </FormAcao>
  )
}
