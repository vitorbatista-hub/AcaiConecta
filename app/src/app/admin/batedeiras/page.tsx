import Link from 'next/link'
import { adminDaPagina } from '@/server/guardas-admin'
import { listarBatedeirasAdmin } from '@/server/admin'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../navegacao'
import { ROTULO_BATEDEIRA } from '../rotulos'

export const metadata = { title: 'Batedeiras — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Batedeiras() {
  await adminDaPagina('/admin/batedeiras')
  const lista = await listarBatedeirasAdmin()
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Batedeiras</h1>
        <NavegacaoAdmin atual="/admin/batedeiras" />
        <Link href="/admin/batedeiras/nova" className="self-start rounded-lg bg-marca px-4 py-2.5 font-bold text-marca-texto">Cadastrar batedeira</Link>
        {lista.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhuma batedeira cadastrada.</p> : null}
        <ul className="flex flex-col gap-3">
          {lista.map(b => (
            <li key={b.id.toString()}>
              <Link href={`/admin/batedeiras/${b.id}`} className="block rounded-xl border border-borda bg-cartao p-4 hover:border-marca">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-black">{b.nome}</h2>
                  <span className="shrink-0 rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">{ROTULO_BATEDEIRA[b.status]}</span>
                </div>
                <p className="mt-1 text-sm text-suave">Operador: {b.responsavel.nome} ({b.responsavel.email}){b.responsavel.status !== 'ATIVO' ? ' — conta bloqueada' : ''}</p>
                <p className="text-sm text-suave">{b.endereco} — {b.bairro.nome}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
