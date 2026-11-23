import { adminDaPagina } from '@/server/guardas-admin'
import { metricasDoPiloto } from '@/server/admin'
import { Cabecalho } from '../_componentes/cabecalho'
import { NavegacaoAdmin } from './navegacao'

export const metadata = { title: 'Administração — AçaíConecta' }
export const dynamic = 'force-dynamic'

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)
const seg = (s: number | null) => (s === null ? '—' : s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`)

export default async function VisaoGeral() {
  await adminDaPagina('/admin')
  const m = await metricasDoPiloto()
  const cartoes: [string, string, string][] = [
    ['Pedidos criados', String(m.pedidos), `${m.chegaramABatedeira} chegaram a uma decisão da batedeira`],
    ['Respondidos em até 5 min', pct(m.respondidosEm5Min), 'Meta: 70% ou mais'],
    ['Taxa de aceite', pct(m.taxaAceite), 'Meta: 80% ou mais'],
    ['Conclusão dos aceitos', pct(m.taxaConclusao), 'Meta: 90% ou mais'],
    ['Cancelamento após aceite', pct(m.cancelamentoAposAceite), 'Meta: abaixo de 10%'],
    ['Pedidos expirados', pct(m.taxaExpirados), 'Sem resposta em 5 min'],
    ['Tempo médio até responder', seg(m.tempoMedioRespostaSegundos), 'Aceite ou recusa'],
    ['Entregues por batedeira ativa na semana', m.entreguesPorBatedeiraAtivaNaSemana === null ? '—' : m.entreguesPorBatedeiraAtivaNaSemana.toFixed(1).replace('.', ','), `${m.batedeirasAtivas} batedeira(s) ativa(s)`],
    ['Clientes ativos', String(m.clientesAtivos), `${m.clientesRecorrentes} com 2 ou mais pedidos`],
  ]
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Administração</h1>
        <NavegacaoAdmin atual="/admin" />
        <p className="text-sm text-suave">Métricas do piloto nos últimos {m.dias} dias. As metas são as do PRD §5.2; “—” indica que ainda não há dados.</p>
        <dl className="grid grid-cols-2 gap-3">
          {cartoes.map(([titulo, valor, nota]) => (
            <div key={titulo} className="rounded-xl border border-borda bg-cartao p-3">
              <dt className="text-xs text-suave">{titulo}</dt>
              <dd className="text-2xl font-black">{valor}</dd>
              <dd className="text-xs text-suave">{nota}</dd>
            </div>
          ))}
        </dl>
        <section aria-labelledby="h-mot" className="rounded-xl border border-borda bg-cartao p-4">
          <h2 id="h-mot" className="font-black">Motivos de recusa e de cancelamento</h2>
          {m.motivos.length === 0 ? <p className="mt-1 text-sm text-suave">Nenhum registro no período.</p> : (
            <ul className="mt-2 divide-y divide-borda text-sm">
              {m.motivos.map(x => (
                <li key={`${x.status}-${x.motivo}`} className="flex justify-between gap-3 py-2">
                  <span>{x.status === 'RECUSADO' ? 'Recusa' : 'Cancelamento'}: {x.motivo}</span>
                  <span className="font-bold">{x.quantidade}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
