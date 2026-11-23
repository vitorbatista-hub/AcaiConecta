'use client'

import { BotaoEnvio, FormAcao } from '../../../_componentes/form-acao'
import { cadastrarBatedeiraAction } from '../../actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base'

export function FormCadastro({ bairros }: { bairros: { id: string; nome: string }[] }) {
  return (
    <FormAcao acao={cadastrarBatedeiraAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3 rounded-xl border border-borda p-4">
        <legend className="px-1 font-black">Operador responsável</legend>
        <label className="block text-sm font-semibold">Nome<input name="operadorNome" required maxLength={150} autoComplete="off" className={campo} /></label>
        <label className="block text-sm font-semibold">E-mail (será o login)<input name="operadorEmail" type="email" required autoComplete="off" className={campo} /></label>
        <label className="block text-sm font-semibold">Telefone com DDD (opcional)<input name="operadorTelefone" type="tel" autoComplete="off" className={campo} /></label>
        <label className="block text-sm font-semibold">
          Senha temporária
          <input name="senhaTemporaria" type="text" required minLength={8} autoComplete="off" spellCheck={false} className={campo} aria-describedby="dica-senha" />
          <span id="dica-senha" className="mt-1 block text-xs font-normal text-suave">Mínimo de 8 caracteres. Passe ao operador por um canal seguro; ela não é guardada em lugar nenhum além do hash.</span>
        </label>
      </fieldset>
      <fieldset className="flex flex-col gap-3 rounded-xl border border-borda p-4">
        <legend className="px-1 font-black">Batedeira</legend>
        <label className="block text-sm font-semibold">Nome<input name="nome" required maxLength={150} className={campo} /></label>
        <label className="block text-sm font-semibold">Endereço<input name="endereco" required maxLength={255} className={campo} /></label>
        <label className="block text-sm font-semibold">
          Bairro
          <select name="bairroId" required defaultValue="" className={campo}>
            <option value="" disabled>Escolha…</option>
            {bairros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Ponto de referência (opcional)<input name="pontoReferencia" maxLength={255} className={campo} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Entrega: mínimo (min)<input name="min" type="number" min={1} max={240} required defaultValue={25} className={campo} /></label>
          <label className="block text-sm font-semibold">Entrega: máximo (min)<input name="max" type="number" min={1} max={240} required defaultValue={35} className={campo} /></label>
        </div>
      </fieldset>
      <BotaoEnvio className="bg-marca text-marca-texto">Cadastrar batedeira</BotaoEnvio>
    </FormAcao>
  )
}
