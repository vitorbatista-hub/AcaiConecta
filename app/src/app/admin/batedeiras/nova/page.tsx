import { adminDaPagina } from '@/server/guardas-admin'
import { bairrosHabilitados } from '@/server/consultas-cliente'
import { Cabecalho } from '../../../_componentes/cabecalho'
import { NavegacaoAdmin } from '../../navegacao'
import { FormCadastro } from './form'

export const metadata = { title: 'Cadastrar batedeira — AçaíConecta' }
export const dynamic = 'force-dynamic'

export default async function NovaBatedeira() {
  await adminDaPagina('/admin/batedeiras/nova')
  const bairros = await bairrosHabilitados()
  return (
    <>
      <Cabecalho />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <h1 className="text-3xl font-black tracking-tight">Cadastrar batedeira</h1>
        <NavegacaoAdmin atual="/admin/batedeiras" />
        <p className="text-sm text-suave">
          Cadastro assistido de uma batedeira já selecionada para o piloto. Documentos não são coletados nem guardados aqui (DEC-033, DEC-048).
          A batedeira nasce <strong>em análise</strong>; o operador completa cardápio, bairros e horários, e você ativa depois.
        </p>
        <FormCadastro bairros={bairros.map(b => ({ id: b.id.toString(), nome: b.nome }))} />
      </main>
    </>
  )
}
