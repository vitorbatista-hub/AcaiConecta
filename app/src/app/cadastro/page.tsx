import Link from 'next/link'
import { cadastrarAction } from '../entrar/actions'
import { Formulario } from '../entrar/formulario'

export const metadata = { title: 'Criar conta — AçaíConecta' }

export default function Cadastro() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight">Criar conta</h1>
      <Formulario
        acao={cadastrarAction}
        rotulo="Criar conta"
        campos={[
          { nome: 'nome', rotulo: 'Nome', tipo: 'text', autocomplete: 'name' },
          { nome: 'email', rotulo: 'E-mail', tipo: 'email', autocomplete: 'email' },
          { nome: 'telefone', rotulo: 'Telefone com DDD', tipo: 'tel', autocomplete: 'tel-national', dica: 'A batedeira usa este número para falar sobre o pedido.' },
          { nome: 'senha', rotulo: 'Senha', tipo: 'password', autocomplete: 'new-password', dica: 'Mínimo de 8 caracteres.' },
        ]}
      />
      <p className="text-sm text-suave">
        Já tem conta? <Link href="/entrar" className="font-bold text-marca underline">Entrar</Link>
      </p>
    </main>
  )
}
