import Link from 'next/link'
import { formatarReais } from '@/domain/dinheiro'
import { dataHoraLocal, ROTULO_STATUS } from '@/domain/pedido/apresentacao'
import { pedidosDoCliente } from '@/server/consultas-cliente'
import { exigirPapelNaPagina } from '@/server/guardas'
import { Cabecalho } from '../_componentes/cabecalho'

export const metadata = { title: 'Meus pedidos — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function MeusPedidos() {
  const cliente = await exigirPapelNaPagina('CLIENTE', '/pedidos')
  const pedidos = await pedidosDoCliente(cliente.id)
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Meus pedidos</h1>
        {pedidos.length === 0 ? (
          <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">
            Você ainda não fez pedidos. <Link href="/batedeiras" className="font-bold text-marca underline">Ver batedeiras</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pedidos.map(p => (
              <li key={p.id.toString()}>
                <Link href={`/pedidos/${p.codigo}`} className="block rounded-xl border border-borda bg-cartao p-4 hover:border-marca">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold">{p.batedeira.nome}</h2>
                    <span className="shrink-0 rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">{ROTULO_STATUS[p.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-suave">{p.codigo} · {dataHoraLocal(p.criadoEm)} · {formatarReais(p.totalCentavos)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
