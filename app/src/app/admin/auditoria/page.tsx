import { dataHoraLocal } from '@/domain/pedido/apresentacao'
import { adminDaPagina } from '@/server/guardas-admin'
import { acoesDeAuditoria, listarAuditoria } from '@/server/admin'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../navegacao'

export const metadata = { title: 'Auditoria — AçaíConecta' }
export const dynamic = 'force-dynamic'

/** Mostra os metadados mínimos da trilha; o próprio registro já evita segredos e dados pessoais. */
const detalhesEmTexto = (d: unknown) =>
  d && typeof d === 'object' ? Object.entries(d as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') : ''

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ acao?: string }> }) {
  await adminDaPagina('/admin/auditoria')
  const { acao } = await searchParams
  const [eventos, acoes] = await Promise.all([listarAuditoria({ acao }), acoesDeAuditoria()])
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Auditoria</h1>
        <NavegacaoAdmin atual="/admin/auditoria" />
        <form role="search" action="/admin/auditoria" className="flex items-end gap-2">
          <label className="flex-1 text-sm font-semibold">
            Ação
            <select name="acao" defaultValue={acao ?? ''} className="mt-1 block w-full rounded-lg border border-borda bg-cartao px-3 py-2.5 text-base">
              <option value="">Todas</option>
              {acoes.map(a => <option key={a.acao} value={a.acao}>{a.acao}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-marca px-4 font-bold text-marca-texto">Filtrar</button>
        </form>
        <p className="text-xs text-suave">Ações administrativas, das mais recentes (até 100). Mudanças de estado de pedido ficam no histórico do próprio pedido.</p>
        {eventos.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhum registro.</p> : null}
        <ol className="flex flex-col gap-2">
          {eventos.map(e => (
            <li key={e.id.toString()} className="rounded-xl border border-borda bg-cartao p-3 text-sm">
              <p className="font-bold">{e.acao}</p>
              <p className="text-suave">{e.entidadeTipo} #{e.entidadeId.toString()} · {e.usuario.nome} · {dataHoraLocal(e.criadoEm)}</p>
              {detalhesEmTexto(e.detalhes) ? <p className="text-suave">{detalhesEmTexto(e.detalhes)}</p> : null}
            </li>
          ))}
        </ol>
      </main>
    </>
  )
}
