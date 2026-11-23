'use client'

import Link from 'next/link'

/** Tela de erro com o código (`digest`) que o suporte usa para achar o registro no log. */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-black tracking-tight">Algo deu errado</h1>
      <p className="text-suave">Não foi possível concluir agora. Seus dados estão salvos. Tente de novo em instantes.</p>
      {error.digest ? <p className="text-sm text-suave">Se o problema continuar, informe ao suporte o código <strong className="font-mono text-texto">{error.digest}</strong>.</p> : null}
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-lg bg-marca px-5 font-bold text-marca-texto">Tentar de novo</button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-borda px-5 font-bold">Início</Link>
      </div>
    </main>
  )
}
