import Link from 'next/link'
import { formatarReais } from '@/domain/dinheiro'
import { textoEstimativa, textoProximaAbertura } from '@/domain/pedido/apresentacao'
import { bairrosHabilitados, listarBatedeiras } from '@/server/consultas-cliente'
import { Cabecalho } from './_componentes/cabecalho'

export const dynamic = 'force-dynamic'

const campo = 'block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base'

export default async function Inicio({ searchParams }: { searchParams: Promise<{ q?: string; bairro?: string }> }) {
  const { q, bairro } = await searchParams
  const bairroId = bairro && /^\d{1,19}$/.test(bairro) ? BigInt(bairro) : undefined
  const [batedeiras, bairros] = await Promise.all([listarBatedeiras({ busca: q, bairroId }), bairrosHabilitados()])
  const filtrando = Boolean(q || bairroId)
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-folha">Cametá · Pará</p>
          <h1 className="text-3xl font-black tracking-tight">Açaí tradicional na sua porta</h1>
          <p className="mt-1 text-suave">Pedidos a partir de 1 litro. Você paga na entrega, em dinheiro ou Pix.</p>
        </div>

        <form role="search" className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" action="/">
          <label className="text-sm font-semibold">
            Buscar batedeira
            <input name="q" defaultValue={q} maxLength={100} className={`${campo} mt-1`} />
          </label>
          <label className="text-sm font-semibold">
            Bairro
            <select name="bairro" defaultValue={bairroId?.toString() ?? ''} className={`${campo} mt-1`}>
              <option value="">Todos</option>
              {bairros.map(b => (
                <option key={b.id.toString()} value={b.id.toString()}>{b.nome}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-lg bg-marca px-4 py-2.5 font-bold text-marca-texto">Buscar</button>
            {filtrando ? <Link href="/" className="px-2 py-2.5 text-sm font-semibold underline">Limpar</Link> : null}
          </div>
        </form>

        {batedeiras.length === 0 ? (
          <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">
            {filtrando ? 'Nenhuma batedeira encontrada para essa busca.' : 'Nenhuma batedeira disponível no momento.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Batedeiras">
            {batedeiras.map(b => {
              const recebe = b.aberta && b.entregaDisponivel
              return (
                <li key={b.id.toString()}>
                  <Link href={`/batedeiras/${b.id}`} className="block rounded-xl border border-borda bg-cartao p-4 hover:border-marca">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold">{b.nome}</h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${recebe ? 'bg-folha text-fundo' : 'border border-borda text-suave'}`}>
                        {!b.aberta ? 'Fechada' : b.entregaDisponivel ? 'Aberta' : 'Aberta · sem entrega'}
                      </span>
                    </div>
                    {b.descricao ? <p className="mt-1 text-sm text-suave">{b.descricao}</p> : null}
                    <p className="mt-2 text-sm text-suave">
                      {b.aberta ? `Entrega em ${textoEstimativa(b.estimativaMin, b.estimativaMax)}` : b.proximaAbertura ? `Abre ${textoProximaAbertura(b.proximaAbertura)}` : 'Sem horário de abertura cadastrado'}
                      {b.taxaMinimaCentavos !== null ? ` · taxa a partir de ${b.taxaMinimaCentavos === 0 ? 'R$ 0,00 (grátis)' : formatarReais(b.taxaMinimaCentavos)}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-suave">Entrega em: {b.bairros.join(', ')}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </>
  )
}
