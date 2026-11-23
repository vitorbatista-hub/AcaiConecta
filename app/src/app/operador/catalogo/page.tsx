import { formatarReais } from '@/domain/dinheiro'
import { operadorDaPagina } from '@/server/guardas-operador'
import { produtosDaBatedeira } from '@/server/operador'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoOperador } from '../navegacao'
import { SemBatedeira } from '../sem-batedeira'
import { obterArmazenamento } from '@/server/armazenamento'
import { EnviarFoto } from '../enviar-foto'
import { AcoesProduto, FormProduto } from './produto-form'

export const metadata = { title: 'Catálogo — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Catalogo() {
  const o = await operadorDaPagina('/operador/catalogo')
  if (!o) return <SemBatedeira />
  const produtos = await produtosDaBatedeira(o.batedeiraId)
  const fotosDisponiveis = obterArmazenamento() !== null
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Catálogo</h1>
        <NavegacaoOperador atual="/operador/catalogo" />
        <p className="text-sm text-suave">Os produtos têm 500 ml ou 1 litro. O pedido do cliente precisa somar ao menos 1 litro.</p>
        {produtos.length === 0 ? <p className="rounded-xl border border-borda bg-cartao p-6 text-center text-suave">Nenhum produto cadastrado.</p> : null}
        <ul className="flex flex-col gap-3">
          {produtos.map(p => {
            const linha = { id: p.id.toString(), nome: p.nome, descricao: p.descricao ?? '', volumeMl: p.volumeMl, preco: (p.precoCentavos / 100).toFixed(2).replace('.', ','), disponivel: p.disponivel, exibir: p.exibirQuandoIndisponivel }
            return (
              <li key={linha.id} className="rounded-xl border border-borda bg-cartao p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black">{p.nome}</h2>
                    <p className="text-sm text-suave">{p.unidade} · {formatarReais(p.precoCentavos)}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-borda px-2.5 py-0.5 text-xs font-bold">
                    {p.disponivel ? 'Disponível' : p.exibirQuandoIndisponivel ? 'Indisponível (visível)' : 'Indisponível (oculto)'}
                  </span>
                </div>
                <div className="mt-3"><EnviarFoto alvo="produto" produtoId={linha.id} urlAtual={p.imagemUrl} nome={p.nome} disponivel={fotosDisponiveis} /></div>
                <div className="mt-3"><AcoesProduto p={linha} /></div>
                <details className="mt-1">
                  <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-bold">Editar nome, tamanho ou preço</summary>
                  <FormProduto produto={linha} />
                </details>
              </li>
            )
          })}
        </ul>
        <section aria-labelledby="h-novo" className="rounded-xl border border-borda bg-cartao p-4">
          <h2 id="h-novo" className="mb-3 font-black">Novo produto</h2>
          <FormProduto />
        </section>
      </main>
    </>
  )
}
