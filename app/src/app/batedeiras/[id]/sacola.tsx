'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useState } from 'react'
import { formatarReais } from '@/domain/dinheiro'
import { QUANTIDADE_MAXIMA, VOLUME_MINIMO_ML } from '@/domain/pedido/calculo'
import { FotoOuArte } from '../../_componentes/arte'
import { enviarPedidoAction } from './actions'

export type ProdutoVitrine = { id: string; nome: string; descricao: string | null; unidade: string; volumeMl: number; precoCentavos: number; disponivel: boolean; imagemUrl: string | null }
export type BairroAtendido = { id: string; nome: string; taxaCentavos: number }
export type EnderecoSalvo = { id: string; texto: string; bairroId: string; principal: boolean }

const campo = 'mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base'
const MAX_POR_ITEM = 20

export function Sacola(props: {
  batedeiraId: string
  nomeBatedeira: string
  aceitaPedidos: boolean
  motivoIndisponivel: string | null
  produtos: ProdutoVitrine[]
  bairros: BairroAtendido[]
  enderecos: EnderecoSalvo[]
  logado: boolean
  caminhoAtual: string
}) {
  const { produtos, bairros, enderecos } = props
  const chaveArmazenamento = `sacola:${props.batedeiraId}`
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [chave, setChave] = useState('')
  const [modoEndereco, setModoEndereco] = useState<'salvo' | 'novo'>(enderecos.length > 0 ? 'salvo' : 'novo')
  const [bairroNovo, setBairroNovo] = useState(bairros[0]?.id ?? '')
  const [enderecoId, setEnderecoId] = useState(enderecos[0]?.id ?? '')
  const [pagamento, setPagamento] = useState<'DINHEIRO' | 'PIX_NA_ENTREGA'>('DINHEIRO')
  const [estado, enviar, pendente] = useActionState(enviarPedidoAction, {})

  useEffect(() => {
    setChave(crypto.randomUUID())
    try {
      const salvo = JSON.parse(sessionStorage.getItem(chaveArmazenamento) ?? '{}') as Record<string, number>
      const validos = Object.fromEntries(Object.entries(salvo).filter(([id, n]) => produtos.some(p => p.id === id && p.disponivel) && Number.isInteger(n) && n > 0 && n <= MAX_POR_ITEM))
      if (Object.keys(validos).length) setQtd(validos)
    } catch {
      /* sacola é só conveniência */
    }
  }, [chaveArmazenamento, produtos])

  const alterar = (id: string, delta: number) =>
    setQtd(atual => {
      const n = Math.min(MAX_POR_ITEM, Math.max(0, (atual[id] ?? 0) + delta))
      const novo = { ...atual }
      if (n === 0) delete novo[id]
      else novo[id] = n
      try {
        sessionStorage.setItem(chaveArmazenamento, JSON.stringify(novo))
      } catch {
        /* ignorar */
      }
      return novo
    })

  const linhas = useMemo(() => produtos.filter(p => qtd[p.id]).map(p => ({ p, n: qtd[p.id] ?? 0 })), [produtos, qtd])
  const subtotal = linhas.reduce((s, l) => s + l.p.precoCentavos * l.n, 0)
  const volume = linhas.reduce((s, l) => s + l.p.volumeMl * l.n, 0)
  const bairroDoPedido = bairros.find(b => b.id === (modoEndereco === 'salvo' ? enderecos.find(e => e.id === enderecoId)?.bairroId : bairroNovo))
  const taxa = bairroDoPedido?.taxaCentavos ?? null
  const faltaMl = Math.max(0, VOLUME_MINIMO_ML - volume)
  const podeEnviar = props.aceitaPedidos && linhas.length > 0 && faltaMl === 0 && taxa !== null && Boolean(chave) && !pendente
  const enderecosForaDaArea = enderecos.filter(e => !bairros.some(b => b.id === e.bairroId))

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="h-cardapio" className="flex flex-col gap-3">
        <h2 id="h-cardapio" className="text-xl font-black">Cardápio</h2>
        {produtos.length === 0 ? <p className="text-suave">Nenhum produto disponível no momento.</p> : null}
        <ul className="flex flex-col gap-3">
          {produtos.map(p => {
            const n = qtd[p.id] ?? 0
            return (
              <li key={p.id} className={`rounded-2xl border border-borda bg-cartao p-4 sombra-suave ${p.disponivel ? '' : 'opacity-70'}`}>
                <div className="flex items-start gap-3">
                  <FotoOuArte miniatura url={p.imagemUrl} alt={`Foto de ${p.nome}`} variante={Number(p.volumeMl) / 500} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{p.nome}</h3>
                    {p.descricao ? <p className="text-sm text-suave">{p.descricao}</p> : null}
                    <p className="mt-1 text-sm text-suave">{p.unidade}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black">{formatarReais(p.precoCentavos)}</p>
                </div>
                {p.disponivel ? (
                  props.aceitaPedidos ? (
                    <div className="mt-3 flex items-center gap-3" role="group" aria-label={`Quantidade de ${p.nome}`}>
                      <button type="button" onClick={() => alterar(p.id, -1)} disabled={n === 0} aria-label={`Remover um ${p.nome}`} className="h-11 w-11 rounded-lg border border-borda text-xl font-bold disabled:opacity-40">−</button>
                      <span aria-live="polite" className="min-w-8 text-center text-lg font-bold">{n}</span>
                      <button type="button" onClick={() => alterar(p.id, 1)} disabled={n >= Math.min(MAX_POR_ITEM, QUANTIDADE_MAXIMA)} aria-label={`Adicionar um ${p.nome}`} className="h-11 w-11 rounded-lg border border-borda text-xl font-bold disabled:opacity-40">+</button>
                    </div>
                  ) : null
                ) : (
                  <p className="mt-3 text-sm font-semibold text-suave">Indisponível no momento</p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {!props.aceitaPedidos ? (
        <p role="status" className="rounded-xl border border-borda bg-cartao p-4 font-semibold">{props.motivoIndisponivel}</p>
      ) : (
        <form action={enviar} className="flex flex-col gap-5" aria-labelledby="h-sacola">
          <h2 id="h-sacola" className="text-xl font-black">Sua sacola</h2>
          <input type="hidden" name="batedeiraId" value={props.batedeiraId} />
          <input type="hidden" name="chave" value={chave} />
          <input type="hidden" name="itens" value={JSON.stringify(linhas.map(l => ({ produtoId: l.p.id, quantidade: l.n })))} />

          {linhas.length === 0 ? (
            <p className="text-suave">Adicione produtos do cardápio. O pedido mínimo é de 1 litro.</p>
          ) : (
            <ul className="divide-y divide-borda rounded-xl border border-borda bg-cartao">
              {linhas.map(l => (
                <li key={l.p.id} className="flex justify-between gap-3 p-3 text-sm">
                  <span>{l.n} × {l.p.nome}</span>
                  <span className="font-semibold">{formatarReais(l.p.precoCentavos * l.n)}</span>
                </li>
              ))}
            </ul>
          )}
          {linhas.length > 0 && faltaMl > 0 ? (
            <p role="status" className="text-sm font-semibold text-red-700 dark:text-red-400">Faltam {faltaMl} ml para o mínimo de 1 litro.</p>
          ) : null}

          {!props.logado ? (
            <p className="rounded-xl border border-borda bg-cartao p-4 text-sm">
              Para enviar o pedido, <Link className="font-bold text-marca underline" href={`/entrar?proximo=${encodeURIComponent(props.caminhoAtual)}`}>entre</Link> ou{' '}
              <Link className="font-bold text-marca underline" href="/cadastro">crie sua conta</Link>. Sua sacola é mantida.
            </p>
          ) : (
            <>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 font-bold">Endereço de entrega</legend>
                {enderecos.length > 0 ? (
                  <div className="flex gap-4 text-sm font-semibold">
                    <label className="flex items-center gap-2"><input type="radio" name="enderecoModo" value="salvo" checked={modoEndereco === 'salvo'} onChange={() => setModoEndereco('salvo')} /> Endereço salvo</label>
                    <label className="flex items-center gap-2"><input type="radio" name="enderecoModo" value="novo" checked={modoEndereco === 'novo'} onChange={() => setModoEndereco('novo')} /> Outro endereço</label>
                  </div>
                ) : (
                  <input type="hidden" name="enderecoModo" value="novo" />
                )}
                {modoEndereco === 'salvo' ? (
                  <label className="block text-sm font-semibold">
                    Endereço
                    <select name="enderecoId" value={enderecoId} onChange={e => setEnderecoId(e.target.value)} className={campo}>
                      {enderecos.map(e => (
                        <option key={e.id} value={e.id}>{e.texto}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="block text-sm font-semibold">Rua<input name="logradouro" required maxLength={180} autoComplete="address-line1" className={campo} /></label>
                    <label className="block text-sm font-semibold">Número<input name="numero" required maxLength={20} className={campo} /></label>
                    <label className="block text-sm font-semibold">Complemento (opcional)<input name="complemento" maxLength={100} autoComplete="address-line2" className={campo} /></label>
                    <label className="block text-sm font-semibold">Ponto de referência (opcional)<input name="pontoReferencia" maxLength={255} className={campo} /></label>
                    <label className="block text-sm font-semibold">
                      Bairro
                      <select name="bairroId" value={bairroNovo} onChange={e => setBairroNovo(e.target.value)} className={campo}>
                        {bairros.map(b => (
                          <option key={b.id} value={b.id}>{b.nome}</option>
                        ))}
                      </select>
                    </label>
                    {enderecos.length < 2 ? (
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="salvar" /> Salvar este endereço na minha conta</label>
                    ) : null}
                  </>
                )}
                {modoEndereco === 'salvo' && enderecosForaDaArea.length > 0 ? (
                  <p className="text-xs text-suave">Endereços em bairros que esta batedeira não atende: {enderecosForaDaArea.map(e => e.texto).join('; ')}.</p>
                ) : null}
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 font-bold">Pagamento na entrega</legend>
                <label className="flex items-center gap-2"><input type="radio" name="formaPagamento" value="DINHEIRO" checked={pagamento === 'DINHEIRO'} onChange={() => setPagamento('DINHEIRO')} /> Dinheiro</label>
                <label className="flex items-center gap-2"><input type="radio" name="formaPagamento" value="PIX_NA_ENTREGA" checked={pagamento === 'PIX_NA_ENTREGA'} onChange={() => setPagamento('PIX_NA_ENTREGA')} /> Pix na entrega</label>
                {pagamento === 'DINHEIRO' ? (
                  <label className="block text-sm font-semibold">
                    Troco para quanto? (opcional)
                    <input name="troco" inputMode="decimal" placeholder="Ex.: 50,00" maxLength={12} className={campo} />
                  </label>
                ) : null}
                <p className="text-xs text-suave">O pagamento é feito direto à batedeira, na entrega. O app não processa pagamentos.</p>
              </fieldset>

              <label className="block text-sm font-semibold">
                Observação para a batedeira (opcional)
                <textarea name="observacao" maxLength={500} rows={2} className={campo} />
              </label>
            </>
          )}

          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-borda bg-cartao p-4 text-sm">
            <dt>Subtotal</dt><dd className="text-right">{formatarReais(subtotal)}</dd>
            <dt>Taxa de entrega</dt><dd className="text-right">{taxa === null ? 'Escolha o endereço' : taxa === 0 ? 'Grátis' : formatarReais(taxa)}</dd>
            <dt className="font-black">Total</dt><dd className="text-right font-black">{formatarReais(subtotal + (taxa ?? 0))}</dd>
          </dl>

          <p role="alert" className="min-h-5 text-sm font-semibold text-red-700 dark:text-red-400">{estado.erro}</p>
          {props.logado ? (
            <button type="submit" disabled={!podeEnviar} className="rounded-lg bg-marca px-4 py-3 text-base font-bold text-marca-texto disabled:opacity-50">
              {pendente ? 'Enviando…' : 'Enviar pedido'}
            </button>
          ) : null}
        </form>
      )}
    </div>
  )
}
