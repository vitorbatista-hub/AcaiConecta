import { operadorDaPagina } from '@/server/guardas-operador'
import { configuracaoDaBatedeira } from '@/server/operador'
import { Cabecalho } from '../../_componentes/cabecalho'
import { NavegacaoOperador } from '../navegacao'
import { SemBatedeira } from '../sem-batedeira'
import { obterArmazenamento } from '@/server/armazenamento'
import { EnviarFoto } from '../enviar-foto'
import { FormBairros, FormHorarios, FormPerfil } from './formularios'

export const metadata = { title: 'Configurações — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function Configuracoes() {
  const o = await operadorDaPagina('/operador/configuracoes')
  if (!o) return <SemBatedeira />
  const { batedeira: b, horarios, bairros } = await configuracaoDaBatedeira(o.batedeiraId)
  const dias = [0, 1, 2, 3, 4, 5, 6].map(dia => {
    const h = horarios.find(x => x.diaSemana === dia)
    return { dia, ativo: h?.ativo ?? false, abertura: h?.abertura ?? '09:00', fechamento: h?.fechamento ?? '18:00' }
  })
  const secao = 'rounded-xl border border-borda bg-cartao p-4'
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Configurações</h1>
        <NavegacaoOperador atual="/operador/configuracoes" />
        <section aria-labelledby="h-foto" className={secao}>
          <h2 id="h-foto" className="mb-3 font-black">Foto da batedeira</h2>
          <EnviarFoto alvo="batedeira" urlAtual={b.imagemUrl} nome={b.nome} disponivel={obterArmazenamento() !== null} />
          <p className="mt-2 text-xs text-suave">Envie só fotos suas ou com autorização. Não use imagens de outros negócios nem com marca d&apos;água (DEC-038).</p>
        </section>
        <section aria-labelledby="h-perfil" className={secao}>
          <h2 id="h-perfil" className="mb-3 font-black">Dados e estimativa</h2>
          <FormPerfil descricao={b.descricao ?? ''} telefone={b.telefoneOperacional ?? ''} min={b.estimativaMinutosMin} max={b.estimativaMinutosMax} />
        </section>
        <section aria-labelledby="h-bairros" className={secao}>
          <h2 id="h-bairros" className="mb-3 font-black">Bairros atendidos e taxas</h2>
          <FormBairros bairros={bairros.map(x => ({ id: x.id.toString(), nome: x.nome, atende: x.atende, taxa: (x.taxaCentavos / 100).toFixed(2).replace('.', ',') }))} />
        </section>
        <section aria-labelledby="h-horarios" className={secao}>
          <h2 id="h-horarios" className="mb-3 font-black">Horários regulares</h2>
          <FormHorarios dias={dias} />
        </section>
      </main>
    </>
  )
}
