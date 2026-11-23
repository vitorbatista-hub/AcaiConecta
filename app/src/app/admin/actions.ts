'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { AcaoBatedeira } from '@/domain/batedeira-status'
import { mensagemDoErro } from '@/server/erro-usuario'
import * as admin from '@/server/admin'
import { exigirAdmin } from '@/server/guardas-admin'
import type { EstadoAcao } from '../_componentes/form-acao'

const texto = (f: FormData, k: string) => {
  const v = f.get(k)
  return typeof v === 'string' ? v : ''
}
const ID = /^\d{1,19}$/
const falha = (e: unknown): EstadoAcao => ({ erro: mensagemDoErro(e) })

export async function cadastrarBatedeiraAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const bairro = texto(form, 'bairroId')
  if (!ID.test(bairro)) return { erro: 'Escolha o bairro da batedeira.' }
  let id: bigint
  try {
    const a = await exigirAdmin()
    const b = await admin.cadastrarBatedeira(a.id, {
      operadorNome: texto(form, 'operadorNome'),
      operadorEmail: texto(form, 'operadorEmail'),
      operadorTelefone: texto(form, 'operadorTelefone'),
      senhaTemporaria: texto(form, 'senhaTemporaria'),
      nome: texto(form, 'nome'),
      endereco: texto(form, 'endereco'),
      bairroId: BigInt(bairro),
      pontoReferencia: texto(form, 'pontoReferencia'),
      estimativaMin: Number(texto(form, 'min')),
      estimativaMax: Number(texto(form, 'max')),
    })
    id = b.id
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/admin/batedeiras')
  redirect(`/admin/batedeiras/${id}`)
}

const ACOES = z.enum(['ATIVAR', 'SUSPENDER', 'REATIVAR', 'DESATIVAR'])

export async function statusBatedeiraAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const acao = ACOES.safeParse(texto(form, 'acao'))
  const id = texto(form, 'batedeiraId')
  if (!acao.success || !ID.test(id)) return { erro: 'Ação inválida.' }
  try {
    const a = await exigirAdmin()
    await admin.mudarStatusBatedeira(a.id, BigInt(id), acao.data as AcaoBatedeira, texto(form, 'motivo'))
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/admin', 'layout')
  return { ok: 'Estado da batedeira atualizado.' }
}

export async function criarBairroAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  try {
    const a = await exigirAdmin()
    await admin.criarBairro(a.id, texto(form, 'nome'))
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/admin/bairros')
  return { ok: 'Bairro adicionado, ainda desabilitado.' }
}

export async function habilitarBairroAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const id = texto(form, 'bairroId')
  if (!ID.test(id)) return { erro: 'Ação inválida.' }
  try {
    const a = await exigirAdmin()
    await admin.definirBairroHabilitado(a.id, BigInt(id), texto(form, 'ativo') === 'true')
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/admin/bairros')
  return {}
}

export async function bloqueioAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const id = texto(form, 'usuarioId')
  if (!ID.test(id)) return { erro: 'Ação inválida.' }
  try {
    const a = await exigirAdmin()
    await admin.alterarBloqueio(a.id, BigInt(id), texto(form, 'bloquear') === 'true', texto(form, 'motivo'))
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/admin/usuarios')
  return { ok: 'Conta atualizada.' }
}

export async function senhaAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const id = texto(form, 'usuarioId')
  if (!ID.test(id)) return { erro: 'Ação inválida.' }
  try {
    const a = await exigirAdmin()
    await admin.redefinirSenha(a.id, BigInt(id), texto(form, 'senha'))
  } catch (e) {
    return falha(e)
  }
  return { ok: 'Senha redefinida e sessões encerradas. Informe a senha ao usuário por um canal seguro.' }
}

const codigo = z.string().regex(/^AC-[A-Z0-9]{8}$/)

export async function intervencaoAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const c = codigo.safeParse(texto(form, 'codigo'))
  if (!c.success) return { erro: 'Pedido inválido.' }
  try {
    const a = await exigirAdmin()
    await admin.registrarIntervencao(a.id, c.data, texto(form, 'mensagem'))
  } catch (e) {
    return falha(e)
  }
  revalidatePath(`/admin/pedidos/${c.data}`)
  return { ok: 'Mensagem registrada.' }
}

export async function cancelarPedidoAdminAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const c = codigo.safeParse(texto(form, 'codigo'))
  if (!c.success) return { erro: 'Pedido inválido.' }
  try {
    const a = await exigirAdmin()
    await admin.cancelarPedidoComoAdmin(a.id, c.data, texto(form, 'motivo'))
  } catch (e) {
    return falha(e)
  }
  revalidatePath(`/admin/pedidos/${c.data}`)
  return { ok: 'Pedido cancelado.' }
}
