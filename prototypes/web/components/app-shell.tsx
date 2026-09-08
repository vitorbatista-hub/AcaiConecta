'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, MapPin, ShoppingBag, Store, LayoutDashboard, Users, Package, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const profileConfig = {
  cliente: { label: 'Área do cliente', href: '/cliente', icon: ShoppingBag },
  operador: { label: 'Painel da batedeira', href: '/operador', icon: Store },
  admin: { label: 'Central administrativa', href: '/admin', icon: LayoutDashboard },
}

type Profile = keyof typeof profileConfig

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${light ? 'text-primary-foreground' : 'text-foreground'}`}>
      <span className={`grid size-10 place-items-center rounded-2xl text-lg font-black shadow-sm ${light ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>A</span>
      <span className="leading-none">
        <span className="block text-lg font-black tracking-tight">Açaí<span className="text-secondary">Conecta</span></span>
        <span className={`text-[10px] uppercase tracking-[0.2em] ${light ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Sabor que conecta</span>
      </span>
    </Link>
  )
}

export function Topbar({ profile, notificationCount = 2 }: { profile: Profile; notificationCount?: number }) {
  const [open, setOpen] = useState(false)
  const config = profileConfig[profile]
  const Icon = config.icon
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-secondary" />
            Cametá, PA
          </div>
          <Link href={config.href} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40">
            <Icon className="size-3.5 text-primary" /> {config.label}
          </Link>
          <button aria-label="Notificações" className="relative grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-primary">
            <Bell className="size-4" />
            {notificationCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-background" />}
          </button>
          <button className="flex items-center gap-2 rounded-full pl-1 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-full bg-secondary/15 text-secondary">JS</span><ChevronDown className="size-4 text-muted-foreground" /></button>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Abrir menu" className="grid size-10 place-items-center rounded-full border border-border md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && <div className="border-t border-border bg-card px-4 py-4 md:hidden"><div className="flex flex-col gap-2"><Link href={config.href} className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold">{config.label}</Link><Link href="/" className="rounded-xl px-4 py-3 text-sm text-muted-foreground">Sair da demonstração</Link></div></div>}
    </header>
  )
}

export function SideNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const links = profile === 'cliente'
    ? [{ href: '/cliente', label: 'Descobrir', icon: MapPin }, { href: '/cliente?view=pedidos', label: 'Meus pedidos', icon: Package }]
    : profile === 'operador'
      ? [{ href: '/operador', label: 'Visão geral', icon: LayoutDashboard }, { href: '/operador?view=pedidos', label: 'Pedidos', icon: Package }, { href: '/operador?view=produtos', label: 'Produtos', icon: Store }]
      : [{ href: '/admin', label: 'Visão geral', icon: LayoutDashboard }, { href: '/admin?view=usuarios', label: 'Usuários', icon: Users }, { href: '/admin?view=lojas', label: 'Batedeiras', icon: Store }]
  return <aside className="hidden w-56 shrink-0 border-r border-border bg-card/60 lg:block"><nav className="sticky top-18 flex flex-col gap-1 p-4">{links.map(({ href, label, icon: Icon }) => { const active = pathname === href.split('?')[0] && (!href.includes('?') || typeof window !== 'undefined' && window.location.search.includes(href.split('?')[1])); return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" />{label}</Link> })}<div className="my-4 h-px bg-border" /><Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="size-4" />Voltar ao início</Link></nav></aside>
}

export function AppFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><Topbar profile={profile} /><div className="mx-auto flex max-w-7xl"><SideNav profile={profile} /><main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main></div></div>
}

export function StatusPill({ status, label }: { status: 'open' | 'closed' | 'busy' | 'ready' | 'preparing' | 'delivered' | 'confirmed' | 'pending'; label?: string }) {
  const labels = { open: 'Aberto agora', closed: 'Fechado', busy: 'Movimento alto', ready: 'Pronto', preparing: 'Preparando', delivered: 'Entregue', confirmed: 'Confirmado', pending: 'Pendente' }
  const colors = { open: 'bg-secondary/15 text-secondary', closed: 'bg-muted text-muted-foreground', busy: 'bg-accent/20 text-accent-foreground', ready: 'bg-secondary/15 text-secondary', preparing: 'bg-accent/20 text-accent-foreground', delivered: 'bg-muted text-muted-foreground', confirmed: 'bg-primary/10 text-primary', pending: 'bg-accent/20 text-accent-foreground' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${colors[status]}`}><span className="size-1.5 rounded-full bg-current" />{label || labels[status]}</span>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>}<h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>
}

export function Money({ value }: { value: number }) { return <span>R$ {value.toFixed(2).replace('.', ',')}</span> }

export function DemoNotice({ children }: { children: React.ReactNode }) { return <div className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-foreground"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent-foreground">i</span><span>{children}</span></div> }

export function StatCard({ label, value, detail, icon: Icon, tone = 'primary' }: { label: string; value: string; detail: string; icon: React.ElementType; tone?: 'primary' | 'secondary' | 'accent' }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tone === 'primary' ? 'bg-primary/10 text-primary' : tone === 'secondary' ? 'bg-secondary/15 text-secondary' : 'bg-accent/20 text-accent-foreground'}`}><Icon className="size-5" /></span></div><p className="mt-3 text-xs text-muted-foreground">{detail}</p></div> }

export const navIcons = { ShoppingBag, Store, LayoutDashboard, Users, Package }

export default AppFrame
