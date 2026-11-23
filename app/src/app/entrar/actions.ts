'use server'

import { redirect } from 'next/navigation'
import { destinoSeguro } from '@/domain/auth/rotas'
import { cadastrarCliente, encerrarSessao, entrar } from '@/server/auth'
import { apagarCookieSessao, gravarCookieSessao, lerCookieSessao } from '@/server/cookie-sessao'
import { ErroNegocio } from '@/server/erros'
import { ipDaRequisicao, segredoDeOrigem } from '@/server/origem'

export type EstadoForm = { erro?: string }

const texto = (f: FormData, campo: string) => {
  const v = f.get(campo)
  return typeof v === 'string' ? v : ''
}

export async function entrarAction(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  let destino: string
  try {
    const sessao = await entrar({ email: texto(form, 'email'), senha: texto(form, 'senha'), ip: await ipDaRequisicao() }, segredoDeOrigem())
    await gravarCookieSessao(sessao.token, sessao.expiraEm)
    destino = destinoSeguro(texto(form, 'proximo'), sessao.tipo)
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message }
    throw e
  }
  redirect(destino)
}

export async function cadastrarAction(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  try {
    await cadastrarCliente({ nome: texto(form, 'nome'), email: texto(form, 'email'), telefone: texto(form, 'telefone'), senha: texto(form, 'senha') })
    const sessao = await entrar({ email: texto(form, 'email'), senha: texto(form, 'senha'), ip: await ipDaRequisicao() }, segredoDeOrigem())
    await gravarCookieSessao(sessao.token, sessao.expiraEm)
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message }
    throw e
  }
  redirect('/conta')
}

export async function sairAction() {
  const token = await lerCookieSessao()
  if (token) await encerrarSessao(token)
  await apagarCookieSessao()
  redirect('/entrar')
}
