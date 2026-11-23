import Link from 'next/link'
import { paginaInicialDoPapel } from '@/domain/auth/rotas'
import { usuarioAtual } from '@/server/guardas'
import { sairAction } from '../entrar/actions'
import { Logo } from './arte'

const link = 'rounded-lg px-3 py-2 hover:bg-borda/60'

export async function Cabecalho() {
  const usuario = await usuarioAtual()
  return (
    <header className="sticky top-0 z-20 border-b border-borda bg-cartao/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-marca">
          <Logo />
          <span className="text-texto">AçaíConecta</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/batedeiras" className={link}>Batedeiras</Link>
          {usuario?.tipo === 'CLIENTE' ? (
            <>
              <Link href="/pedidos" className={link}>Pedidos</Link>
              <Link href="/conta" className={link}>Conta</Link>
            </>
          ) : usuario ? (
            <Link href={paginaInicialDoPapel(usuario.tipo)} className={link}>Meu painel</Link>
          ) : (
            <Link href="/entrar" className="rounded-lg bg-marca px-3.5 py-2 text-marca-texto">Entrar</Link>
          )}
          {usuario ? (
            <form action={sairAction}>
              <button type="submit" className={`${link} text-suave`}>Sair</button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
