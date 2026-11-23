import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatarReais } from '@/domain/dinheiro'
import { dataHoraLocal, descreverEvento, pedidoEncerrado, ROTULO_STATUS } from '@/domain/pedido/apresentacao'
import { proximosEstadosPermitidos } from '@/domain/pedido/estados'
import { adminDaPagina } from '@/server/guardas-admin'
import { pedidoAdmin } from '@/server/admin'
import { expirarPedidosVencidos, MENSAGENS_OPERACIONAIS } from '@/server/pedidos'
import { Cabecalho } from '../../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../../navegacao'
import { Suporte } from './suporte'

export const metadata = { title: 'Pedido — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function PedidoAdmin({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const a = await adminDaPagina(`/admin/pedidos/${codigo}`)
  if (!/^AC-[A-Z0-9]{8}$/.test(codigo)) notFound()
  await expirarPedidosVencidos()
  const p = await pedidoAdmin(codigo)
  if (!p) notFound()
  const podeCancelar = proximosEstadosPermitidos(p.status, { tipo: 'USUARIO', papel: 'ADMINISTRADOR', usuarioId: a.id }).includes('CANCELADO')
  const secao = 'rounded-xl border border-borda bg-cartao p-4'
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <Link href="/admin/pedidos" className="text-sm font-semibold underline">← Pedidos</Link>
        <div>
          <p className="text-sm text-suave">{p.codigo} · {p.batedeira.nome}</p>
          <h1 className="text-3xl font-black tracking-tight">{ROTULO_STATUS[p.status]}</h1>
        </div>
        <NavegacaoAdmin atual="/admin/pedidos" />
        <section aria-labelledby="h-ped" className={secao}>
          <h2 id="h-ped" className="font-black">Pedido</h2>
          <ul className="mt-2 text-sm">
            {p.itens.map(i => <li key={i.id.toString()}>{i.quantidade} × {i.nomeProdutoSnapshot} — {formatarReais(i.subtotalCentavos)}</li>)}
          </ul>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-suave">Total</dt><dd className="font-bold">{formatarReais(p.totalCentavos)} (taxa {formatarReais(p.taxaEntregaCentavos)})</dd>
            <dt className="text-suave">Pagamento</dt><dd>{p.formaPagamento === 'DINHEIRO' ? `Dinheiro${p.trocoParaCentavos ? `, troco para ${formatarReais(p.trocoParaCentavos)}` : ''}` : 'Pix na entrega'}</dd>
            <dt className="text-suave">Entrega</dt><dd>{p.enderecoSnapshot} — {p.bairroSnapshot}{p.referenciaSnapshot ? ` (${p.referenciaSnapshot})` : ''}</dd>
            <dt className="text-suave">Cliente</dt><dd>{p.cliente.nome}{p.cliente.telefone ? ` · ${p.cliente.telefone}` : ''}</dd>
            <dt className="text-suave">Batedeira</dt><dd>{p.batedeira.nome}{p.batedeira.telefoneOperacional ? ` · ${p.batedeira.telefoneOperacional}` : ''}</dd>
            <dt className="text-suave">Criado em</dt><dd>{dataHoraLocal(p.criadoEm)}</dd>
          </dl>
        </section>
        <section aria-labelledby="h-sup" className={secao}>
          <h2 id="h-sup" className="mb-2 font-black">Suporte</h2>
          <Suporte codigo={p.codigo} mensagens={MENSAGENS_OPERACIONAIS} podeCancelar={podeCancelar} encerrado={pedidoEncerrado(p.status)} />
        </section>
        <section aria-labelledby="h-linha">
          <h2 id="h-linha" className="font-black">Histórico de estados</h2>
          <ol className="mt-2 flex flex-col gap-3 border-l-2 border-borda pl-4">
            {[...p.eventos].reverse().map(e => {
              const d = descreverEvento(e)
              const autor = e.usuario ? `${e.usuario.nome} (${e.usuario.tipo === 'CLIENTE' ? 'cliente' : e.usuario.tipo === 'OPERADOR' ? 'operador' : 'administrador'})` : e.origemProcesso ? `sistema: ${e.origemProcesso}` : 'sistema'
              return (
                <li key={e.id.toString()}>
                  <p className="font-bold">{d.titulo}</p>
                  {d.detalhe ? <p className="text-sm text-suave">{d.detalhe}</p> : null}
                  <p className="text-xs text-suave">{autor} · {dataHoraLocal(e.criadoEm)}</p>
                </li>
              )
            })}
          </ol>
        </section>
      </main>
    </>
  )
}
