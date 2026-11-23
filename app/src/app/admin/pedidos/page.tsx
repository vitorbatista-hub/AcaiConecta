import Link from 'next/link'
import { formatarReais } from '@/domain/dinheiro'
import { dataHoraLocal, ROTULO_STATUS } from '@/domain/pedido/apresentacao'
import { STATUS_PEDIDO, type StatusPedido } from '@/domain/pedido/estados'
import { adminDaPagina } from '@/server/guardas-admin'
import { listarBatedeirasAdmin, listarPedidosAdmin } from '@/server/admin'
import { Cabecalho } from '../../_componentes/cabecalho'
import { TempoReal } from '../../_componentes/tempo-real'
import { ultimoEventoId } from '@/server/eventos'
import { NavegacaoAdmin } from '../navegacao'

export const metadata = { title: 'Pedidos — AçaíConecta' }
export const dynamic = 'force-dynamic'
const campo = 'mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base'

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ batedeira?: string; status?: string; codigo?: string }> }) {
  await adminDaPagina('/admin/pedidos')
  const q = await searchParams
  const status = (STATUS_PEDIDO as readonly string[]).includes(q.status ?? '') ? (q.status as StatusPedido) : undefined
  const batedeiraId = q.batedeira && /^\d{1,19}$/.test(q.batedeira) ? BigInt(q.batedeira) : undefined
  const codigo = q.codigo?.trim().slice(0, 24) || undefined
  const desde = await ultimoEventoId({ tipo: 'admin' })
  const [pedidos, batedeiras] = await Promise.all([listarPedidosAdmin({ batedeiraId, status, codigo }), listarBatedeirasAdmin()])
  return (
    <>
      <Cabecalho />
      <TempoReal url={`/api/eventos/admin?desde=${desde}`} />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Pedidos</h1>
        <NavegacaoAdmin atual="/admin/pedidos" />
        <form role="search" action="/admin/pedidos" className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-semibold">Código<input name="codigo" defaultValue={codigo} placeholder="AC-" className={campo} /></label>
          <label className="text-sm font-semibold">
            Batedeira
            <select name="batedeira" defaultValue={batedeiraId?.toString() ?? ''} className={campo}>
              <option value="">Todas</option>
              {batedeiras.map(b => <option key={b.id.toString()} value={b.id.toString()}>{b.nome}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Estado
            <select name="status" defaultValue={status ?? ''} className={campo}>
              <option value="">Todos</option>
              {STATUS_PEDIDO.map(s => <option key={s} value={s}>{ROTULO_STATUS[s]}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="min-h-11 rounded-lg bg-marca px-4 font-bold text-marca-texto">Filtrar</button>
            <Link href="/admin/pedidos" className="px-2 py-2.5 text-sm font-semibold underline">Limpar</Link>
          </div>
        </form>
        {pedidos.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhum pedido encontrado.</p> : null}
        <ul className="flex flex-col gap-3">
          {pedidos.map(p => (
            <li key={p.id.toString()}>
              <Link href={`/admin/pedidos/${p.codigo}`} className="block rounded-xl border border-borda bg-cartao p-4 hover:border-marca">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold">{p.codigo} · {p.batedeira.nome}</h2>
                  <span className="shrink-0 rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">{ROTULO_STATUS[p.status]}</span>
                </div>
                <p className="mt-1 text-sm text-suave">{dataHoraLocal(p.criadoEm)} · {formatarReais(p.totalCentavos)} · {p.bairroSnapshot}</p>
              </Link>
            </li>
          ))}
        </ul>
        {pedidos.length === 50 ? <p className="text-xs text-suave">Mostrando os 50 mais recentes; use os filtros para refinar.</p> : null}
      </main>
    </>
  )
}
