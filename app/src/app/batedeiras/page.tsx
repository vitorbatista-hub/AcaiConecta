import { Clock, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { formatarReais } from '@/domain/dinheiro'
import { textoEstimativa, textoProximaAbertura } from '@/domain/pedido/apresentacao'
import { bairrosHabilitados, listarBatedeiras } from '@/server/consultas-cliente'
import { Cabecalho } from '../_componentes/cabecalho'
import { FotoOuArte } from '../_componentes/arte'

export const metadata = { title: 'Batedeiras — AçaíConecta' }
export const dynamic = 'force-dynamic'

const campo = 'block w-full rounded-xl border border-borda bg-cartao px-3 py-3 text-base'

export default async function Batedeiras({ searchParams }: { searchParams: Promise<{ q?: string; bairro?: string }> }) {
  const { q, bairro } = await searchParams
  const bairroId = bairro && /^\d{1,19}$/.test(bairro) ? BigInt(bairro) : undefined
  const [lista, bairros] = await Promise.all([listarBatedeiras({ busca: q, bairroId }), bairrosHabilitados()])
  const filtrando = Boolean(q || bairroId)
  return (
    <>
      <Cabecalho />
      <div className="hero-fundo">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-8">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Escolha sua batedeira</h1>
          <p className="mt-1 max-w-xl text-white/80">Açaí tradicional de Cametá, a partir de 1 litro. Você paga só na entrega.</p>
          <form role="search" className="mt-5 grid gap-3 rounded-2xl bg-cartao p-3 text-texto sombra-suave sm:grid-cols-[1fr_14rem_auto]" action="/batedeiras">
            <label className="text-sm font-semibold">
              <span className="sr-only">Buscar batedeira pelo nome</span>
              <span className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-suave" />
                <input name="q" defaultValue={q} maxLength={100} placeholder="Buscar pelo nome" className={`${campo} pl-10`} />
              </span>
            </label>
            <label className="text-sm font-semibold">
              <span className="sr-only">Bairro</span>
              <select name="bairro" defaultValue={bairroId?.toString() ?? ''} className={campo} aria-label="Bairro">
                <option value="">Todos os bairros</option>
                {bairros.map(b => <option key={b.id.toString()} value={b.id.toString()}>{b.nome}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button type="submit" className="min-h-12 flex-1 rounded-xl bg-marca px-5 font-bold text-marca-texto">Buscar</button>
              {filtrando ? <Link href="/batedeiras" className="px-2 text-sm font-semibold underline">Limpar</Link> : null}
            </div>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {lista.length === 0 ? (
          <p className="rounded-2xl border border-borda bg-cartao p-8 text-center text-suave">
            {filtrando ? 'Nenhuma batedeira encontrada para essa busca.' : 'Nenhuma batedeira disponível no momento.'}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2" aria-label="Batedeiras">
            {lista.map((b, i) => {
              const recebe = b.aberta && b.entregaDisponivel
              return (
                <li key={b.id.toString()}>
                  <Link href={`/batedeiras/${b.id}`} className="cartao-lift block overflow-hidden rounded-2xl border border-borda bg-cartao sombra-suave">
                    <div className="relative">
                      <FotoOuArte miniatura url={b.imagemUrl} alt={`Foto da batedeira ${b.nome}`} variante={i} className="h-40 w-full" />
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${recebe ? 'bg-folha text-fundo' : 'bg-cartao text-suave'}`}>
                        {!b.aberta ? 'Fechada' : b.entregaDisponivel ? 'Aberta agora' : 'Aberta · sem entrega'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-black">{b.nome}</h2>
                      {b.descricao ? <p className="mt-0.5 line-clamp-2 text-sm text-suave">{b.descricao}</p> : null}
                      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
                        <Clock aria-hidden="true" className="h-4 w-4 text-folha" />
                        {b.aberta ? `Entrega em ${textoEstimativa(b.estimativaMin, b.estimativaMax)}` : b.proximaAbertura ? `Abre ${textoProximaAbertura(b.proximaAbertura)}` : 'Sem horário cadastrado'}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-suave">
                        <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{b.bairros.join(', ')}{b.taxaMinimaCentavos !== null ? ` · taxa ${b.taxaMinimaCentavos === 0 ? 'grátis' : `a partir de ${formatarReais(b.taxaMinimaCentavos)}`}` : ''}</span>
                      </p>
                    </div>
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
