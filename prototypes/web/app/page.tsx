import Link from 'next/link'
import { ArrowRight, MapPin, ShieldCheck, Store, Users } from 'lucide-react'
import { Brand } from '@/components/app-shell'
import { traditionalAcaiImages } from '@/lib/mock-data'

const profiles = [
  { href: '/cliente', title: 'Quero pedir açaí', description: 'Encontre batedeiras próximas, monte seu pedido e acompanhe tudo em tempo real.', icon: Users, cta: 'Explorar batedeiras' },
  { href: '/operador', title: 'Tenho uma batedeira', description: 'Organize seus pedidos e atualize seu cardápio tradicional.', icon: Store, cta: 'Acessar painel' },
  { href: '/admin', title: 'Sou administrador', description: 'Acompanhe a operação da rede de batedeiras.', icon: ShieldCheck, cta: 'Ver central' },
]

export default function Page() {
  return <main className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="flex h-20 items-center justify-between"><Brand /><nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground sm:flex"><a href="#como-funciona" className="hover:text-foreground">Como funciona</a><a href="#perfis" className="hover:text-foreground">Acessar protótipo</a></nav><Link href="/cliente" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Pedir agora</Link></header>
      <section className="grid items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-20">
        <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary"><MapPin className="size-3.5" /> Feito em Cametá, PA</div><h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">O sabor da nossa terra, <span className="text-primary">conectado</span> a você.</h1><p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">Açaí tradicional de Cametá, batido na hora e sem frutas, doces ou produtos industrializados.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/cliente" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground">Encontrar meu açaí <ArrowRight className="size-4" /></Link><a href="#como-funciona" className="rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold">Como funciona</a></div></div>
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl"><img src={traditionalAcaiImages.ceramicBowl} alt="Açaí tradicional puro servido em cuia" className="aspect-[4/3] w-full object-cover" /></div>
      </section>
      <section id="como-funciona" className="border-t border-border py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Simples como deve ser</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Da batedeira para a sua mesa.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{['Escolha sua batedeira', 'Peça açaí puro', 'Acompanhe o preparo'].map((title, index) => <div key={title} className="rounded-2xl border border-border bg-card p-5"><span className="text-sm font-black text-primary">0{index + 1}</span><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Uma experiência local, transparente e feita na hora.</p></div>)}</div></section>
      <section id="perfis" className="border-t border-border py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Protótipo navegável</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Escolha seu caminho</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{profiles.map(({ href, title, description, icon: Icon, cta }) => <Link key={href} href={href} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/50"><Icon className="size-6 text-primary" /><h3 className="mt-6 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">{cta} <ArrowRight className="size-4" /></span></Link>)}</div></section>
      <footer className="border-t border-border py-8"><Brand /><p className="mt-3 text-sm text-muted-foreground">Um protótipo de marketplace local para Cametá, PA.</p></footer>
    </div>
  </main>
}
