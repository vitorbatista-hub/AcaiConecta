import Link from 'next/link'
import { notFound } from 'next/navigation'
import { textoEstimativa, textoProximaAbertura } from '@/domain/pedido/apresentacao'
import { enderecosDoCliente, perfilBatedeira } from '@/server/consultas-cliente'
import { usuarioAtual } from '@/server/guardas'
import { Cabecalho } from '../../_componentes/cabecalho'
import { FotoOuArte } from '../../_componentes/arte'
import { Sacola } from './sacola'

export const dynamic = 'force-dynamic'
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function PerfilBatedeira({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{1,19}$/.test(id)) notFound()
  const b = await perfilBatedeira(BigInt(id))
  if (!b) notFound()
  const usuario = await usuarioAtual()
  const cliente = usuario?.tipo === 'CLIENTE' ? usuario : null
  const enderecos = cliente ? await enderecosDoCliente(cliente.id) : []

  const motivo = !b.aberta
    ? b.proximaAbertura ? `Fechada agora. Abre ${textoProximaAbertura(b.proximaAbertura)}.` : 'Fechada agora.'
    : !b.entregaDisponivel ? 'Aberta, mas sem entregas no momento.' : null
  const ativos = b.horariosTexto.filter(h => h.ativo).sort((x, y) => x.diaSemana - y.diaSemana || x.abertura.localeCompare(y.abertura))

  return (
    <>
      <Cabecalho />
      <div className="relative">
        <FotoOuArte url={b.imagemUrl} alt={`Foto da batedeira ${b.nome}`} variante={Number(b.id % 3n)} className="h-44 w-full sm:h-56" />
      </div>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        <Link href="/batedeiras" className="text-sm font-semibold underline">← Todas as batedeiras</Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{b.nome}</h1>
          {b.descricao ? <p className="mt-1 text-suave">{b.descricao}</p> : null}
          <p className="mt-2 text-sm text-suave">Entrega estimada em {textoEstimativa(b.estimativaMinutosMin, b.estimativaMinutosMax)} · Bairros: {b.bairros.map(x => x.bairro.nome).join(', ')}</p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-semibold">Horários de funcionamento</summary>
            {ativos.length === 0 ? <p className="mt-1 text-suave">Sem horário cadastrado.</p> : (
              <ul className="mt-1 text-suave">
                {ativos.map(h => <li key={`${h.diaSemana}-${h.abertura}`}>{DIAS[h.diaSemana]}: {h.abertura} às {h.fechamento}</li>)}
              </ul>
            )}
          </details>
        </div>
        <Sacola
          batedeiraId={b.id.toString()}
          nomeBatedeira={b.nome}
          aceitaPedidos={b.aceitaPedidos}
          motivoIndisponivel={motivo}
          produtos={b.produtos.map(p => ({ id: p.id.toString(), nome: p.nome, descricao: p.descricao, unidade: p.unidade, volumeMl: p.volumeMl, precoCentavos: p.precoCentavos, disponivel: p.disponivel, imagemUrl: p.imagemUrl }))}
          bairros={b.bairros.map(x => ({ id: x.bairroId.toString(), nome: x.bairro.nome, taxaCentavos: x.taxaEntregaCentavos }))}
          enderecos={enderecos.map(e => ({ id: e.id.toString(), bairroId: e.bairroId.toString(), principal: e.principal, texto: `${e.logradouro}, ${e.numero} — ${e.bairro.nome}` }))}
          logado={Boolean(cliente)}
          caminhoAtual={`/batedeiras/${b.id}`}
        />
      </main>
    </>
  )
}
