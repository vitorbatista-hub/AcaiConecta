import { ArrowRight, Banknote, Clock, MapPin, ShoppingBasket, Truck, Store } from 'lucide-react'
import Link from 'next/link'
import { formatarReais } from '@/domain/dinheiro'
import { textoEstimativa } from '@/domain/pedido/apresentacao'
import { batedeirasEmDestaque } from '@/server/consultas-cliente'
import { Cabecalho } from './_componentes/cabecalho'
import { FotoOuArte, Logo } from './_componentes/arte'

export const dynamic = 'force-dynamic'

const PASSOS = [
  { icone: Store, titulo: 'Escolha a batedeira', texto: 'Veja quem está aberta agora, o prazo estimado e a taxa de entrega do seu bairro.' },
  { icone: ShoppingBasket, titulo: 'Monte seu pedido', texto: 'Pedidos a partir de 1 litro, em porções de 500 ml ou 1 litro. O total aparece antes de enviar.' },
  { icone: Clock, titulo: 'A batedeira confirma', texto: 'Ela tem até 5 minutos para aceitar. Se não puder atender, você é avisado e nada é cobrado.' },
  { icone: Truck, titulo: 'Receba e pague na entrega', texto: 'Acompanhe cada etapa e pague direto à batedeira, em dinheiro ou Pix.' },
] as const

const DIFERENCIAIS = [
  { icone: MapPin, titulo: 'Feito em Cametá', texto: 'Batedeiras da cidade, escolhidas para o piloto, entregando no seu bairro.' },
  { icone: Banknote, titulo: 'Sem surpresa no preço', texto: 'Produtos, taxa de entrega e total ficam à vista antes de você enviar o pedido.' },
  { icone: Clock, titulo: 'Resposta rápida', texto: 'Cada pedido tem prazo de 5 minutos para ser aceito, e você acompanha o andamento.' },
] as const

export default async function Inicio() {
  const destaques = await batedeirasEmDestaque(3)
  return (
    <>
      <Cabecalho />
      <main>
        <section className="hero-fundo" aria-labelledby="h-hero">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
                <Logo className="h-4 w-4" /> Cametá · Pará
              </p>
              <h1 id="h-hero" className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                Açaí tradicional, batido na hora, na sua porta.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/85">
                Peça das batedeiras de Cametá a partir de 1 litro e pague só quando receber.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/batedeiras" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-black" style={{ color: 'var(--acai-escuro)' }}>
                  Ver batedeiras <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
                <a href="#como-funciona" className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-6 font-bold">Como funciona</a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/90">
                <li>✔ A partir de 1 litro</li><li>✔ Pagamento na entrega</li><li>✔ Resposta em até 5 min</li>
              </ul>
            </div>
            <FotoOuArte alt="" variante={0} className="mx-auto h-64 w-full max-w-sm rounded-3xl bg-white/10 ring-1 ring-white/25 md:h-80" />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="h-dest">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="h-dest" className="text-3xl font-black tracking-tight">Batedeiras de Cametá</h2>
              <p className="mt-1 text-suave">Quem está no piloto agora, com alguns produtos do cardápio.</p>
            </div>
            <Link href="/batedeiras" className="inline-flex items-center gap-1 font-bold text-marca underline-offset-4 hover:underline">Ver todas <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          {destaques.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-borda bg-cartao p-8 text-center text-suave">As primeiras batedeiras entram em breve.</p>
          ) : (
            <ul className="mt-6 grid gap-5 md:grid-cols-3">
              {destaques.map((b, i) => (
                <li key={b.id.toString()}>
                  <Link href={`/batedeiras/${b.id}`} className="cartao-lift flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-cartao sombra-suave">
                    <div className="relative">
                      <FotoOuArte miniatura url={b.imagemUrl} alt={`Foto da batedeira ${b.nome}`} variante={i} className="h-36 w-full" />
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${b.aberta && b.entregaDisponivel ? 'bg-folha text-fundo' : 'bg-cartao text-suave'}`}>
                        {b.aberta && b.entregaDisponivel ? 'Aberta agora' : 'Fechada'}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-lg font-black">{b.nome}</h3>
                      <p className="text-sm text-suave">{b.aberta ? `Entrega em ${textoEstimativa(b.estimativaMin, b.estimativaMax)}` : 'Veja o horário de abertura'}</p>
                      <ul className="mt-3 flex flex-1 flex-col gap-2">
                        {b.produtos.map((p, j) => (
                          <li key={p.id.toString()} className="flex items-center gap-3">
                            <FotoOuArte miniatura url={p.imagemUrl} alt={`Foto de ${p.nome}`} variante={i + j + 1} className="h-12 w-12 shrink-0 rounded-lg" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.nome}</span>
                            <span className="text-sm font-black">{formatarReais(p.precoCentavos)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="como-funciona" className="bg-creme py-14" aria-labelledby="h-como">
          <div className="mx-auto max-w-5xl px-4">
            <h2 id="h-como" className="text-3xl font-black tracking-tight">Como funciona</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="relative rounded-2xl border border-borda bg-cartao p-5 sombra-suave">
                  <span className="absolute -top-3 left-5 rounded-full bg-marca px-3 py-0.5 text-sm font-black text-marca-texto">{i + 1}</span>
                  <p.icone aria-hidden="true" className="mt-2 h-8 w-8 text-folha" />
                  <h3 className="mt-3 font-black">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-suave">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="h-dif">
          <h2 id="h-dif" className="text-3xl font-black tracking-tight">Por que pedir pelo AçaíConecta</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {DIFERENCIAIS.map(d => (
              <li key={d.titulo} className="flex gap-4 rounded-2xl border border-borda bg-cartao p-5">
                <d.icone aria-hidden="true" className="h-7 w-7 shrink-0 text-marca" />
                <div><h3 className="font-black">{d.titulo}</h3><p className="mt-1 text-sm text-suave">{d.texto}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="hero-fundo" aria-labelledby="h-cta">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-5 px-4 py-12 sm:flex-row sm:items-center">
            <div>
              <h2 id="h-cta" className="text-3xl font-black tracking-tight">Bateu a vontade de açaí?</h2>
              <p className="mt-1 text-white/85">Escolha uma batedeira aberta e faça seu pedido em poucos toques.</p>
            </div>
            <Link href="/batedeiras" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-black" style={{ color: 'var(--acai-escuro)' }}>
              Fazer meu pedido <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-borda bg-cartao">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-suave">
          <p className="flex items-center gap-2 font-bold text-texto"><Logo className="h-5 w-5 text-marca" /> AçaíConecta · piloto em Cametá/PA</p>
          <nav aria-label="Rodapé" className="flex gap-4 font-semibold">
            <Link href="/batedeiras" className="hover:underline">Batedeiras</Link>
            <Link href="/entrar" className="hover:underline">Entrar</Link>
            <Link href="/cadastro" className="hover:underline">Criar conta</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
