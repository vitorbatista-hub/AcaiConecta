import Link from 'next/link'

const ABAS = [
  { href: '/operador', rotulo: 'Pedidos' },
  { href: '/operador/catalogo', rotulo: 'Catálogo' },
  { href: '/operador/configuracoes', rotulo: 'Configurações' },
] as const

export function NavegacaoOperador({ atual }: { atual: (typeof ABAS)[number]['href'] }) {
  return (
    <nav aria-label="Painel da batedeira" className="flex gap-2 overflow-x-auto">
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
