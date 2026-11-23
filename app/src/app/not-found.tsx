import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-black tracking-tight">Página não encontrada</h1>
      <p className="text-suave">O endereço pode ter mudado ou o item não existe mais.</p>
      <Link href="/batedeiras" className="inline-flex min-h-11 items-center self-start rounded-lg bg-marca px-5 font-bold text-marca-texto">Ver batedeiras</Link>
    </main>
  )
}
