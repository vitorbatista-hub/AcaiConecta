import Link from 'next/link'
import { entrarAction } from './actions'
import { Formulario } from './formulario'

export const metadata = { title: 'Entrar — AçaíConecta' }

export default async function Entrar({ searchParams }: { searchParams: Promise<{ proximo?: string }> }) {
  const { proximo } = await searchParams
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight">Entrar</h1>
      <Formulario
        acao={entrarAction}
        rotulo="Entrar"
        proximo={proximo}
        campos={[
          { nome: 'email', rotulo: 'E-mail', tipo: 'email', autocomplete: 'username' },
          { nome: 'senha', rotulo: 'Senha', tipo: 'password', autocomplete: 'current-password' },
        ]}
      />
      <p className="text-sm text-suave">
        Ainda não tem conta? <Link href="/cadastro" className="font-bold text-marca underline">Cadastre-se</Link>
      </p>
    </main>
  )
}
