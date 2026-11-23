import { dataHoraLocal } from '@/domain/pedido/apresentacao'
import { adminDaPagina } from '@/server/guardas-admin'
import { listarUsuarios } from '@/server/admin'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../navegacao'
import { AcoesUsuario } from './forms'

export const metadata = { title: 'Usuários — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await adminDaPagina('/admin/usuarios')
  const { q } = await searchParams
  const usuarios = await listarUsuarios(q)
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Usuários</h1>
        <NavegacaoAdmin atual="/admin/usuarios" />
        <form role="search" action="/admin/usuarios" className="flex gap-2">
          <label className="flex-1 text-sm font-semibold">
            Buscar por nome ou e-mail
            <input name="q" defaultValue={q} maxLength={100} className="mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base" />
          </label>
          <button type="submit" className="mt-6 min-h-11 rounded-lg bg-marca px-4 font-bold text-marca-texto">Buscar</button>
        </form>
        <p className="text-xs text-suave">Mostra clientes e operadores (até 50, mais recentes primeiro). Bloqueio e redefinição de senha ficam registrados na auditoria, sem a senha.</p>
        {usuarios.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhum usuário encontrado.</p> : null}
        <ul className="flex flex-col gap-3">
          {usuarios.map(u => (
            <li key={u.id.toString()} className="rounded-xl border border-borda bg-cartao p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{u.nome}</p>
                  <p className="text-sm text-suave">{u.email} · {u.tipo === 'CLIENTE' ? 'Cliente' : 'Operador'} · desde {dataHoraLocal(u.criadoEm)}</p>
                </div>
                <span className="shrink-0 rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">{u.status === 'ATIVO' ? 'Ativo' : u.status === 'BLOQUEADO' ? 'Bloqueado' : 'Desativado'}</span>
              </div>
              <div className="mt-3"><AcoesUsuario id={u.id.toString()} bloqueado={u.status !== 'ATIVO'} /></div>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
