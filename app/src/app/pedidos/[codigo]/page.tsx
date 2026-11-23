import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatarReais } from '@/domain/dinheiro'
import { dataHoraLocal, DESCRICAO_STATUS, descreverEvento, ETAPAS, etapaDoStatus, horaLocal, pedidoEncerrado, ROTULO_STATUS, textoEstimativa } from '@/domain/pedido/apresentacao'
import { pedidoDoCliente } from '@/server/consultas-cliente'
import { exigirPapelNaPagina } from '@/server/guardas'
import { ultimoEventoId } from '@/server/eventos'
import { Cabecalho } from '../../_componentes/cabecalho'
import { TempoReal } from '../../_componentes/tempo-real'
import { BotaoCancelar } from '../cancelar'

export const metadata = { title: 'Acompanhar pedido — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function AcompanharPedido({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const cliente = await exigirPapelNaPagina('CLIENTE', `/pedidos/${codigo}`)
  if (!/^AC-[A-Z0-9]{8}$/.test(codigo)) notFound()
  const desde = await ultimoEventoId({ tipo: 'pedido', codigo, clienteId: cliente.id })
  const p = await pedidoDoCliente(cliente.id, codigo)
  if (!p) notFound()
  const etapa = etapaDoStatus(p.status)
  const encerrado = pedidoEncerrado(p.status)

  return (
    <>
      <Cabecalho />
      <TempoReal url={`/api/eventos/pedido/${codigo}?desde=${desde}`} ativo={!encerrado} />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <Link href="/pedidos" className="text-sm font-semibold underline">← Meus pedidos</Link>
        <div>
          <p className="text-sm text-suave">Pedido {p.codigo} · {p.batedeira.nome}</p>
          <div aria-live="polite">
            <h1 className="text-3xl font-black tracking-tight">{ROTULO_STATUS[p.status]}</h1>
            <p className="mt-1 text-suave">{DESCRICAO_STATUS[p.status]}</p>
          </div>
          {p.status === 'AGUARDANDO_ACEITE' ? <p className="mt-1 text-sm text-suave">Prazo de resposta até {horaLocal(p.expiraAceiteEm)}.</p> : null}
          {!encerrado ? <p className="mt-1 text-sm text-suave">Estimativa de entrega: {textoEstimativa(p.estimativaMinutosMin, p.estimativaMinutosMax)} após o aceite.</p> : null}
        </div>

        {etapa !== null ? (
          <ol className="grid grid-cols-6 gap-1" aria-label="Etapas do pedido">
            {ETAPAS.map((e, i) => (
              <li key={e} aria-current={i === etapa ? 'step' : undefined} className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight">
                <span className={`h-2 w-full rounded-full ${i <= etapa ? 'bg-folha' : 'bg-borda'}`} />
                <span className={i === etapa ? 'font-black' : 'text-suave'}>{ROTULO_STATUS[e]}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {p.status === 'AGUARDANDO_ACEITE' ? <BotaoCancelar codigo={p.codigo} /> : null}

        <section aria-labelledby="h-itens" className="rounded-xl border border-borda bg-cartao p-4">
          <h2 id="h-itens" className="font-black">Itens</h2>
          <ul className="mt-2 divide-y divide-borda text-sm">
            {p.itens.map(i => (
              <li key={i.id.toString()} className="flex justify-between gap-3 py-2">
                <span>{i.quantidade} × {i.nomeProdutoSnapshot}</span>
                <span>{formatarReais(i.subtotalCentavos)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt>Subtotal</dt><dd className="text-right">{formatarReais(p.subtotalCentavos)}</dd>
            <dt>Taxa de entrega</dt><dd className="text-right">{p.taxaEntregaCentavos === 0 ? 'Grátis' : formatarReais(p.taxaEntregaCentavos)}</dd>
            <dt className="font-black">Total a pagar na entrega</dt><dd className="text-right font-black">{formatarReais(p.totalCentavos)}</dd>
          </dl>
          <p className="mt-2 text-sm text-suave">
            {p.formaPagamento === 'DINHEIRO' ? 'Dinheiro' : 'Pix na entrega'}
            {p.trocoParaCentavos ? ` · troco para ${formatarReais(p.trocoParaCentavos)}` : ''}
          </p>
          <p className="mt-1 text-sm text-suave">Entrega: {p.enderecoSnapshot} — {p.bairroSnapshot}{p.referenciaSnapshot ? ` (${p.referenciaSnapshot})` : ''}</p>
          {p.observacao ? <p className="mt-1 text-sm text-suave">Observação: {p.observacao}</p> : null}
        </section>

        <section aria-labelledby="h-linha">
          <h2 id="h-linha" className="font-black">Linha do tempo</h2>
          <ol className="mt-2 flex flex-col gap-3 border-l-2 border-borda pl-4">
            {[...p.eventos].reverse().map(e => {
              const d = descreverEvento(e)
              return (
                <li key={e.id.toString()}>
                  <p className="font-bold">{d.titulo}</p>
                  {d.detalhe ? <p className="text-sm text-suave">{d.detalhe}</p> : null}
                  <p className="text-xs text-suave">{dataHoraLocal(e.criadoEm)}</p>
                </li>
              )
            })}
          </ol>
        </section>

        {!encerrado && p.batedeira.telefoneOperacional ? (
          <p className="text-sm text-suave">Precisa falar com a batedeira? Telefone: {p.batedeira.telefoneOperacional}</p>
        ) : null}
        <p className="text-xs text-suave">Em caso de problema, informe o código {p.codigo} ao suporte.</p>
      </main>
    </>
  )
}
