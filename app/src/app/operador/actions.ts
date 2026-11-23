'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/db/client'
import { parseReais, ErroDinheiro } from '@/domain/dinheiro'
import { MOTIVOS_CANCELAMENTO_OPERACIONAL, MOTIVOS_FALHA_ENTREGA, MOTIVOS_RECUSA } from '@/domain/pedido/estados'
import { mensagemDoErro } from '@/server/erro-usuario'
import { exigirOperador } from '@/server/guardas-operador'
import * as op from '@/server/operador'
import { registrarMensagemOperacional } from '@/server/pedidos'
import type { EstadoAcao } from '../_componentes/form-acao'

const texto = (f: FormData, k: string) => {
  const v = f.get(k)
  return typeof v === 'string' ? v : ''
}
const codigo = z.string().regex(/^AC-[A-Z0-9]{8}$/)
const ok = (mensagem: string): EstadoAcao => ({ ok: mensagem })
const falha = (e: unknown): EstadoAcao => ({ erro: mensagemDoErro(e) })
const ID = /^\d{1,19}$/

const MOTIVOS: Record<string, readonly string[]> = {
  RECUSADO: MOTIVOS_RECUSA,
  CANCELADO: MOTIVOS_CANCELAMENTO_OPERACIONAL,
  FALHA_NA_ENTREGA: MOTIVOS_FALHA_ENTREGA,
}
const DESTINOS = ['ACEITO', 'RECUSADO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO', 'FALHA_NA_ENTREGA'] as const

/** Aceitar, recusar, avançar, cancelar ou registrar falha. A matriz de transições é de `validarTransicao`. */
export async function transicionarAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const c = codigo.safeParse(texto(form, 'codigo'))
  const para = z.enum(DESTINOS).safeParse(texto(form, 'para'))
  if (!c.success || !para.success) return { erro: 'Ação inválida.' }
  let motivo: string | null = null
  const lista = MOTIVOS[para.data]
  if (lista) {
    const escolhido = texto(form, 'motivo')
    if (!lista.includes(escolhido)) return { erro: 'Escolha o motivo.' }
    const detalhe = texto(form, 'detalhe').trim()
    if (escolhido === 'Outro' && !detalhe) return { erro: 'Descreva o motivo.' }
    motivo = detalhe ? `${escolhido}: ${detalhe}` : escolhido
  }
  try {
    const o = await exigirOperador()
    await op.transicionarPedidoDoOperador({ usuarioId: o.id, batedeiraId: o.batedeiraId, codigo: c.data, para: para.data, motivo })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador')
  return {}
}

export async function mensagemAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const c = codigo.safeParse(texto(form, 'codigo'))
  if (!c.success) return { erro: 'Pedido inválido.' }
  try {
    const o = await exigirOperador()
    const pedido = await prisma.pedido.findFirst({ where: { codigo: c.data, batedeiraId: o.batedeiraId }, select: { id: true } })
    if (!pedido) return { erro: 'Pedido não encontrado.' }
    await registrarMensagemOperacional({ pedidoId: pedido.id, operador: { usuarioId: o.id, batedeiraId: o.batedeiraId }, mensagem: texto(form, 'mensagem') })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador')
  return ok('Mensagem registrada.')
}

export async function disponibilidadeAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const campo = texto(form, 'campo')
  const valor = texto(form, 'valor')
  if (!['aberta', 'entregaDisponivel'].includes(campo) || !['true', 'false'].includes(valor)) return { erro: 'Ação inválida.' }
  try {
    const o = await exigirOperador()
    await op.salvarDisponibilidade(o.batedeiraId, { [campo]: valor === 'true' })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador', 'layout')
  return {}
}

export async function perfilAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const min = Number(texto(form, 'min'))
  const max = Number(texto(form, 'max'))
  try {
    const o = await exigirOperador()
    await op.salvarPerfilOperacional(o.batedeiraId, { descricao: texto(form, 'descricao'), telefone: texto(form, 'telefone'), estimativaMin: min, estimativaMax: max })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador', 'layout')
  return ok('Dados salvos.')
}

export async function bairrosAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  try {
    const o = await exigirOperador()
    const ids = form.getAll('bairroId').filter((v): v is string => typeof v === 'string' && ID.test(v))
    const itens = ids.map(id => {
      const taxa = texto(form, `taxa-${id}`).trim()
      try {
        return { bairroId: BigInt(id), atende: form.get(`atende-${id}`) === 'on', taxaCentavos: taxa ? parseReais(taxa) : 0 }
      } catch (e) {
        if (e instanceof ErroDinheiro) throw new Error('TAXA')
        throw e
      }
    })
    await op.salvarBairros(o.batedeiraId, itens)
  } catch (e) {
    if (e instanceof Error && e.message === 'TAXA') return { erro: 'Informe a taxa em reais, por exemplo 3,00 (ou 0 para entrega grátis).' }
    return falha(e)
  }
  revalidatePath('/operador', 'layout')
  return ok('Bairros e taxas salvos.')
}

export async function horariosAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  try {
    const o = await exigirOperador()
    const dias = [0, 1, 2, 3, 4, 5, 6].map(d => ({
      diaSemana: d,
      ativo: form.get(`ativo-${d}`) === 'on',
      abertura: texto(form, `abre-${d}`),
      fechamento: texto(form, `fecha-${d}`),
    }))
    await op.salvarHorarios(o.batedeiraId, dias)
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador', 'layout')
  return ok('Horários salvos.')
}

export async function produtoAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const idTxt = texto(form, 'id')
  let preco: number
  try {
    preco = parseReais(texto(form, 'preco'))
  } catch (e) {
    if (e instanceof ErroDinheiro) return { erro: 'Informe o preço em reais, por exemplo 18,00.' }
    throw e
  }
  try {
    const o = await exigirOperador()
    await op.salvarProduto(o.batedeiraId, {
      id: idTxt ? (ID.test(idTxt) ? BigInt(idTxt) : undefined) : undefined,
      nome: texto(form, 'nome'),
      descricao: texto(form, 'descricao'),
      volumeMl: Number(texto(form, 'volume')),
      precoCentavos: preco,
    })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador/catalogo')
  return ok(idTxt ? 'Produto atualizado.' : 'Produto criado.')
}

export async function produtoEstadoAction(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const id = texto(form, 'id')
  const campo = texto(form, 'campo')
  const valor = texto(form, 'valor') === 'true'
  if (!ID.test(id) || !['disponivel', 'exibirQuandoIndisponivel', 'ativo'].includes(campo)) return { erro: 'Ação inválida.' }
  try {
    const o = await exigirOperador()
    await op.alterarProduto(o.batedeiraId, BigInt(id), { [campo]: valor })
  } catch (e) {
    return falha(e)
  }
  revalidatePath('/operador/catalogo')
  return {}
}
