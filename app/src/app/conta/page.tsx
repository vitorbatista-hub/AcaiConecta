import Link from 'next/link'
import { enderecosDoCliente } from '@/server/consultas-cliente'
import { exigirPapelNaPagina } from '@/server/guardas'
import { Cabecalho } from '../_componentes/cabecalho'

export const metadata = { title: 'Minha conta — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Conta() {
  const cliente = await exigirPapelNaPagina('CLIENTE', '/conta')
  const enderecos = await enderecosDoCliente(cliente.id)
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Olá, {cliente.nome}</h1>
        <nav className="flex gap-4 text-sm font-bold">
          <Link href="/batedeiras" className="text-marca underline">Fazer um pedido</Link>
          <Link href="/pedidos" className="text-marca underline">Meus pedidos</Link>
        </nav>
        <section aria-labelledby="h-end" className="rounded-xl border border-borda bg-cartao p-4">
          <h2 id="h-end" className="font-black">Endereços salvos ({enderecos.length} de 2)</h2>
          {enderecos.length === 0 ? (
            <p className="mt-1 text-sm text-suave">Você pode salvar até 2 endereços ao enviar um pedido.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {enderecos.map(e => (
                <li key={e.id.toString()}>
                  {e.logradouro}, {e.numero}{e.complemento ? ` - ${e.complemento}` : ''} — {e.bairro.nome}
                  {e.principal ? <span className="ml-2 rounded-full border border-borda px-2 py-0.5 text-xs font-bold">Principal</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
