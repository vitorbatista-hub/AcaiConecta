import Link from 'next/link'

const ABAS = [
  { href: '/admin', rotulo: 'Visão geral' },
  { href: '/admin/batedeiras', rotulo: 'Batedeiras' },
  { href: '/admin/pedidos', rotulo: 'Pedidos' },
  { href: '/admin/bairros', rotulo: 'Bairros' },
  { href: '/admin/usuarios', rotulo: 'Usuários' },
  { href: '/admin/auditoria', rotulo: 'Auditoria' },
] as const

export function NavegacaoAdmin({ atual }: { atual: (typeof ABAS)[number]['href'] }) {
  return (
    <nav aria-label="Administração" className="flex gap-2 overflow-x-auto pb-1">
      {ABAS.map(a => (
        <Link
          key={a.href}
          href={a.href}
          aria-current={a.href === atual ? 'page' : undefined}
          className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold ${a.href === atual ? 'bg-marca text-marca-texto' : 'border border-borda'}`}
        >
          {a.rotulo}
        </Link>
      ))}
    </nav>
  )
}
