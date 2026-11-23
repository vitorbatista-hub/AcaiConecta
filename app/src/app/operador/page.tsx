import { formatarReais } from '@/domain/dinheiro'
import { estaAbertaAgora, aceitaPedidosAgora } from '@/domain/disponibilidade'
import { dataHoraLocal, horaLocal, ROTULO_STATUS } from '@/domain/pedido/apresentacao'
import { MOTIVOS_CANCELAMENTO_OPERACIONAL, MOTIVOS_FALHA_ENTREGA, MOTIVOS_RECUSA, proximosEstadosPermitidos, type StatusPedido } from '@/domain/pedido/estados'
import { prisma } from '@/db/client'
import { operadorDaPagina } from '@/server/guardas-operador'
import { filaDoOperador, resumoDoDia } from '@/server/operador'
import { ultimoEventoId } from '@/server/eventos'
import { horariosDe, MENSAGENS_OPERACIONAIS } from '@/server/pedidos'
import { Cabecalho } from '../_componentes/cabecalho'
import { AcoesPedido, type AcaoPedido } from './acoes-pedido'
import { AoVivo } from './ao-vivo'
import { ChavesDisponibilidade } from './chaves'
import { Contagem } from './contagem'
import { NavegacaoOperador } from './navegacao'
import { SemBatedeira } from './sem-batedeira'

export const metadata = { title: 'Painel da batedeira — AçaíConecta' }
export const dynamic = 'force-dynamic'

const ROTULO_ACAO: Partial<Record<StatusPedido, string>> = {
  ACEITO: 'Aceitar pedido',
  RECUSADO: 'Recusar pedido',
  EM_PREPARO: 'Iniciar preparo',
  PRONTO: 'Marcar como pronto',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar pedido',
  FALHA_NA_ENTREGA: 'Registrar falha na entrega',
}
const MOTIVOS: Partial<Record<StatusPedido, readonly string[]>> = { RECUSADO: MOTIVOS_RECUSA, CANCELADO: MOTIVOS_CANCELAMENTO_OPERACIONAL, FALHA_NA_ENTREGA: MOTIVOS_FALHA_ENTREGA }

export default async function PainelOperador() {
  const o = await operadorDaPagina('/operador')
  if (!o) return <SemBatedeira />
  const agora = new Date()
  // Lido antes dos dados: eventos entre a leitura e a conexão SSE são reenviados, nunca perdidos.
  const desde = await ultimoEventoId({ tipo: 'batedeira', batedeiraId: o.batedeiraId })
  const [{ ativos, encerradosHoje }, resumo, b] = await Promise.all([
    filaDoOperador(o.batedeiraId, agora),
    resumoDoDia(o.batedeiraId, agora),
    prisma.batedeira.findUniqueOrThrow({ where: { id: o.batedeiraId }, include: { horarios: true } }),
  ])
  const disp = { status: b.status, aberta: b.aberta, entregaDisponivel: b.entregaDisponivel, horarios: horariosDe(b.horarios) }
  const ator = { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: o.id, batedeiraId: o.batedeiraId } as const
  const aguardando = ativos.filter(p => p.status === 'AGUARDANDO_ACEITE').map(p => p.codigo)

  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{b.nome}</h1>
          {b.status !== 'ATIVA' ? <p role="alert" className="mt-1 font-bold text-red-700 dark:text-red-400">Batedeira {b.status === 'EM_ANALISE' ? 'em análise' : b.status === 'SUSPENSA' ? 'suspensa' : 'desativada'}: não recebe novos pedidos.</p> : null}
        </div>
        <NavegacaoOperador atual="/operador" />
        <AoVivo aguardando={aguardando} desde={desde.toString()} />

        <ChavesDisponibilidade aberta={b.aberta} entrega={b.entregaDisponivel} aceitando={aceitaPedidosAgora(disp, agora)} />
        {!estaAbertaAgora(disp, agora) && b.aberta && b.status === 'ATIVA' ? <p className="text-sm text-suave">A chave está em “aberta”, mas agora está fora do horário regular cadastrado.</p> : null}

        <dl className="grid grid-cols-3 gap-2 text-center" aria-label="Resumo do dia">
          <div className="rounded-xl border border-borda bg-cartao p-3"><dt className="text-xs text-suave">Faturamento do dia</dt><dd className="text-lg font-black">{formatarReais(resumo.faturamentoCentavos)}</dd></div>
          <div className="rounded-xl border border-borda bg-cartao p-3"><dt className="text-xs text-suave">Pedidos aceitos</dt><dd className="text-lg font-black">{resumo.aceitos}</dd></div>
          <div className="rounded-xl border border-borda bg-cartao p-3"><dt className="text-xs text-suave">Entregues</dt><dd className="text-lg font-black">{resumo.entregues}</dd></div>
        </dl>
        <p className="-mt-3 text-xs text-suave">Faturamento: pedidos criados hoje, com taxa, sem os recusados, expirados, cancelados ou com falha. É informativo; o pagamento ocorre fora da plataforma.</p>

        <section aria-labelledby="h-fila" className="flex flex-col gap-3">
          <h2 id="h-fila" className="text-xl font-black">Fila de pedidos ({ativos.length})</h2>
          {ativos.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhum pedido em andamento.</p> : null}
          <ul className="flex flex-col gap-3">
            {ativos.map((p, i) => {
              const acoes: AcaoPedido[] = proximosEstadosPermitidos(p.status, ator).map(para => ({
                para,
                rotulo: ROTULO_ACAO[para] ?? para,
                motivos: MOTIVOS[para] ?? null,
                destrutiva: Boolean(MOTIVOS[para]),
              }))
              return (
                <li key={p.id.toString()} className={`rounded-xl border-2 bg-cartao p-4 ${p.status === 'AGUARDANDO_ACEITE' ? 'border-folha' : 'border-borda'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-suave">#{i + 1} na fila · {p.codigo} · criado às {horaLocal(p.criadoEm)}</p>
                      <h3 className="text-lg font-black">{ROTULO_STATUS[p.status]}</h3>
                    </div>
                    {p.status === 'AGUARDANDO_ACEITE' ? <Contagem expiraEm={p.expiraAceiteEm.toISOString()} /> : null}
                  </div>
                  <ul className="mt-2 text-sm">
                    {p.itens.map(it => (
                      <li key={it.id.toString()}>{it.quantidade} × {it.nomeProdutoSnapshot}{it.observacao ? ` — ${it.observacao}` : ''}</li>
                    ))}
                  </ul>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-suave">Total</dt><dd className="font-bold">{formatarReais(p.totalCentavos)} <span className="font-normal text-suave">(taxa {p.taxaEntregaCentavos === 0 ? 'grátis' : formatarReais(p.taxaEntregaCentavos)})</span></dd>
                    <dt className="text-suave">Pagamento</dt><dd>{p.formaPagamento === 'DINHEIRO' ? `Dinheiro${p.trocoParaCentavos ? `, troco para ${formatarReais(p.trocoParaCentavos)}` : ''}` : 'Pix na entrega'}</dd>
                    <dt className="text-suave">Entrega</dt><dd>{p.enderecoSnapshot} — {p.bairroSnapshot}{p.referenciaSnapshot ? ` (${p.referenciaSnapshot})` : ''}</dd>
                    <dt className="text-suave">Cliente</dt><dd>{p.cliente.nome}{p.cliente.telefone ? <> · <a href={`tel:+55${p.cliente.telefone}`} className="font-semibold underline">{p.cliente.telefone}</a></> : null}</dd>
                    {p.observacao ? <><dt className="text-suave">Observação</dt><dd>{p.observacao}</dd></> : null}
                  </dl>
                  {p.eventos.length > 0 ? <p className="mt-2 text-xs text-suave">Última mensagem enviada: {p.eventos[0]?.mensagem}</p> : null}
                  <div className="mt-3"><AcoesPedido codigo={p.codigo} acoes={acoes} mensagens={MENSAGENS_OPERACIONAIS} /></div>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="h-enc" className="flex flex-col gap-2">
          <h2 id="h-enc" className="text-xl font-black">Encerrados hoje ({encerradosHoje.length})</h2>
          {encerradosHoje.length === 0 ? <p className="text-sm text-suave">Nenhum pedido encerrado hoje.</p> : (
            <ul className="divide-y divide-borda rounded-xl border border-borda bg-cartao text-sm">
              {encerradosHoje.map(p => (
                <li key={p.id.toString()} className="flex flex-wrap justify-between gap-2 p-3">
                  <span>{p.codigo} · {p.itens.map(i => `${i.quantidade}× ${i.nomeProdutoSnapshot}`).join(', ')}</span>
                  <span className="font-semibold">{ROTULO_STATUS[p.status]} · {formatarReais(p.totalCentavos)}{p.finalizadoEm ? ` · ${dataHoraLocal(p.finalizadoEm)}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
