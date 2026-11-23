import { Cabecalho } from '../_componentes/cabecalho'

export function SemBatedeira() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">Conta sem batedeira</h1>
        <p className="mt-2 text-suave">Sua conta de operador ainda não está vinculada a uma batedeira. Procure o administrador do piloto.</p>
      </main>
    </>
  )
}
