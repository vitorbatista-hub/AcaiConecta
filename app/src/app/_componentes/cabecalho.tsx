import Link from 'next/link'
import { paginaInicialDoPapel } from '@/domain/auth/rotas'
import { usuarioAtual } from '@/server/guardas'
import { sairAction } from '../entrar/actions'

export async function Cabecalho() {
  const usuario = await usuarioAtual()
  return (
    <header className="border-b border-borda bg-cartao">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-tight">AçaíConecta</Link>
        <nav aria-label="Principal" className="flex items-center gap-3 text-sm font-semibold">
          {usuario?.tipo === 'CLIENTE' ? (
            <>
              <Link href="/pedidos" className="underline-offset-4 hover:underline">Meus pedidos</Link>
              <Link href="/conta" className="underline-offset-4 hover:underline">Minha conta</Link>
            </>
          ) : usuario ? (
            <Link href={paginaInicialDoPapel(usuario.tipo)} className="underline-offset-4 hover:underline">Meu painel</Link>
          ) : (
            <Link href="/entrar" className="underline-offset-4 hover:underline">Entrar</Link>
          )}
          {usuario ? (
            <form action={sairAction}>
              <button type="submit" className="text-suave underline-offset-4 hover:underline">Sair</button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
