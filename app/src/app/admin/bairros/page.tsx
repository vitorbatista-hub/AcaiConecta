import { adminDaPagina } from '@/server/guardas-admin'
import { listarBairros } from '@/server/admin'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../navegacao'
import { ChaveBairro, FormNovoBairro } from './forms'

export const metadata = { title: 'Bairros — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Bairros() {
  await adminDaPagina('/admin/bairros')
  const bairros = await listarBairros()
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Bairros</h1>
        <NavegacaoAdmin atual="/admin/bairros" />
        <p className="text-sm text-suave">Lista oficial. Só bairros habilitados aceitam pedidos e podem ser escolhidos pelas batedeiras. No piloto, apenas o Centro (DEC-019).</p>
        <ul className="flex flex-col gap-2">
          {bairros.map(b => (
            <li key={b.id.toString()} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borda bg-cartao p-4">
              <div>
                <p className="font-bold">{b.nome}</p>
                <p className="text-sm text-suave">{b.ativo ? 'Habilitado' : 'Desabilitado'} · {b._count.batedeirasAtende} batedeira(s) com cobertura cadastrada</p>
              </div>
              <ChaveBairro id={b.id.toString()} ativo={b.ativo} nome={b.nome} />
            </li>
          ))}
        </ul>
        <section className="rounded-xl border border-borda bg-cartao p-4"><FormNovoBairro /></section>
      </main>
    </>
  )
}
