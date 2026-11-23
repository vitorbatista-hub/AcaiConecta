import Link from 'next/link'
import { notFound } from 'next/navigation'
import { acoesDisponiveis, requisitosPendentes, ROTULO_REQUISITO } from '@/domain/batedeira-status'
import { dataHoraLocal } from '@/domain/pedido/apresentacao'
import { adminDaPagina } from '@/server/guardas-admin'
import { batedeiraAdmin, requisitosDaBatedeira } from '@/server/admin'
import { prisma } from '@/db/client'
import { Cabecalho } from '../../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../../navegacao'
import { ROTULO_BATEDEIRA } from '../../rotulos'
import { AcoesStatus } from './acoes'

export const metadata = { title: 'Batedeira — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function DetalheBatedeira({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await adminDaPagina(`/admin/batedeiras/${id}`)
  if (!/^\d{1,19}$/.test(id)) notFound()
  const b = await batedeiraAdmin(BigInt(id))
  if (!b) notFound()
  const requisitos = await requisitosDaBatedeira(b.id)
  const pendentes = requisitosPendentes(requisitos)
  const historico = await prisma.eventoAuditoria.findMany({
    where: { entidadeTipo: 'batedeiras', entidadeId: b.id },
    orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    include: { usuario: { select: { nome: true } } },
  })
  const secao = 'rounded-xl border border-borda bg-cartao p-4'
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <Link href="/admin/batedeiras" className="text-sm font-semibold underline">← Batedeiras</Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{b.nome}</h1>
          <p className="mt-1"><span className="rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">{ROTULO_BATEDEIRA[b.status]}</span></p>
        </div>
        <NavegacaoAdmin atual="/admin/batedeiras" />
        <section aria-labelledby="h-dados" className={secao}>
          <h2 id="h-dados" className="font-black">Dados</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-suave">Endereço</dt><dd>{b.endereco} — {b.bairro.nome}</dd>
            <dt className="text-suave">Operador</dt><dd>{b.responsavel.nome} · {b.responsavel.email}{b.responsavel.telefone ? ` · ${b.responsavel.telefone}` : ''}{b.responsavel.status !== 'ATIVO' ? ' · conta bloqueada' : ''}</dd>
            <dt className="text-suave">Bairros atendidos</dt><dd>{b.bairros.filter(x => x.ativo).map(x => x.bairro.nome).join(', ') || 'Nenhum'}</dd>
            <dt className="text-suave">Produtos ativos</dt><dd>{b.produtos.length}</dd>
          </dl>
        </section>
        <section aria-labelledby="h-req" className={secao}>
          <h2 id="h-req" className="font-black">Requisitos para ativar</h2>
          <ul className="mt-2 text-sm">
            {(Object.keys(ROTULO_REQUISITO) as (keyof typeof ROTULO_REQUISITO)[]).map(k => (
              <li key={k}>{requisitos[k] ? '✔ Atendido' : '✖ Pendente'} — {ROTULO_REQUISITO[k]}</li>
            ))}
          </ul>
          {pendentes.length > 0 && b.status === 'EM_ANALISE' ? <p className="mt-2 text-xs text-suave">O operador completa cardápio, bairros e horários em seu painel.</p> : null}
        </section>
        <section aria-labelledby="h-acoes" className={secao}>
          <h2 id="h-acoes" className="mb-2 font-black">Ações</h2>
          <AcoesStatus batedeiraId={b.id.toString()} acoes={acoesDisponiveis(b.status)} />
          <p className="mt-2 text-xs text-suave">Suspender ou desativar bloqueia novos pedidos, mas não apaga o histórico nem altera pedidos já existentes.</p>
        </section>
        <section aria-labelledby="h-hist" className={secao}>
          <h2 id="h-hist" className="font-black">Histórico administrativo</h2>
          {historico.length === 0 ? <p className="mt-1 text-sm text-suave">Sem registros.</p> : (
            <ol className="mt-2 flex flex-col gap-2 text-sm">
              {historico.map(h => (
                <li key={h.id.toString()}>
                  <span className="font-bold">{h.acao}</span> · {h.usuario.nome} · {dataHoraLocal(h.criadoEm)}
                  {h.detalhes && typeof h.detalhes === 'object' && 'motivo' in h.detalhes ? <span className="block text-suave">Motivo: {String(h.detalhes.motivo)}</span> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  )
}
