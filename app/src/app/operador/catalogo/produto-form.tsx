'use client'

import { BotaoEnvio, FormAcao } from '../../_componentes/form-acao'
import { produtoAction, produtoEstadoAction } from '../actions'

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-base'

export type ProdutoLinha = { id: string; nome: string; descricao: string; volumeMl: number; preco: string; disponivel: boolean; exibir: boolean }

export function FormProduto({ produto }: { produto?: ProdutoLinha }) {
  return (
    <FormAcao acao={produtoAction}>
      {produto ? <input type="hidden" name="id" value={produto.id} /> : null}
      <label className="block text-sm font-semibold">Nome<input name="nome" required minLength={2} maxLength={150} defaultValue={produto?.nome} className={campo} /></label>
      <label className="block text-sm font-semibold">Descrição (opcional)<textarea name="descricao" maxLength={500} rows={2} defaultValue={produto?.descricao} className={campo} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Tamanho
          <select name="volume" defaultValue={produto?.volumeMl ?? 500} className={campo}>
            <option value={500}>500 ml</option>
            <option value={1000}>1 litro</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Preço (R$)<input name="preco" required inputMode="decimal" placeholder="18,00" defaultValue={produto?.preco} className={campo} /></label>
      </div>
      <BotaoEnvio className="bg-marca text-marca-texto">{produto ? 'Salvar alterações' : 'Adicionar produto'}</BotaoEnvio>
    </FormAcao>
  )
}

function Chave({ id, campo, valor, rotulo }: { id: string; campo: string; valor: boolean; rotulo: string }) {
  return (
    <FormAcao acao={produtoEstadoAction} className="flex flex-col" confirmar={campo === 'ativo' ? 'Arquivar este produto? Ele sai do cardápio, mas os pedidos antigos continuam com o registro.' : undefined}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="valor" value={String(valor)} />
      <BotaoEnvio className="border border-borda text-sm">{rotulo}</BotaoEnvio>
    </FormAcao>
  )
}

export function AcoesProduto({ p }: { p: ProdutoLinha }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Chave id={p.id} campo="disponivel" valor={!p.disponivel} rotulo={p.disponivel ? 'Marcar indisponível' : 'Marcar disponível'} />
      <Chave id={p.id} campo="exibirQuandoIndisponivel" valor={!p.exibir} rotulo={p.exibir ? 'Ocultar quando indisponível' : 'Exibir quando indisponível'} />
      <Chave id={p.id} campo="ativo" valor={false} rotulo="Arquivar" />
    </div>
  )
}
