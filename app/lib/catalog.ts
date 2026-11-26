// Catálogo, cobertura, horários e situação das batedeiras no MySQL (ADR-006, etapa 3). Só no servidor.
import { db } from './db.ts'
import { maskDocumento } from './documento.ts'
import { formatRange, validateProduct, validateStatusChange, validateStoreSettings, type StoreStatus } from './store-rules.ts'
import type { OpeningHours, Product, Store } from './domain.ts'
import type { Role } from './auth.ts'

const DEFAULT_IMAGE = '/images/acai-tradicional.webp'
const pad = (n: number) => String(n).padStart(2, '0')
const toTime = (value: string) => new Date(`1970-01-01T${value}:00.000Z`)
const fromTime = (date: Date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
const unitLabel = (ml: number) => (ml >= 1000 ? `${ml / 1000} litro${ml >= 2000 ? 's' : ''}` : `${ml} ml`)

export const storeInclude = { usuarios: true, bairros: true, batedeiras_bairros: { where: { ativo: true }, include: { bairros: true } }, horarios_funcionamento: true } as const

type StoreRow = NonNullable<Awaited<ReturnType<typeof findStoreRow>>>
const findStoreRow = (where: { id?: bigint; responsavel_id?: bigint }) => db.batedeiras.findFirst({ where, include: storeInclude })

function toSchedule(rows: StoreRow['horarios_funcionamento']): OpeningHours[] {
  return Array.from({ length: 7 }, (_, day) => {
    const row = rows.find(item => item.dia_semana === day)
    return row ? { day, opens: fromTime(row.hora_abertura), closes: fromTime(row.hora_fechamento), active: row.ativo } : { day, opens: '09:00', closes: '18:00', active: false }
  })
}

export function toStore(row: StoreRow, options: { admin?: boolean } = {}): Store {
  const schedule = toSchedule(row.horarios_funcionamento)
  const first = schedule.find(item => item.active)
  return {
    id: String(row.id), name: row.nome, owner: row.usuarios.nome, operator: row.usuarios.nome, address: row.endereco, neighborhood: row.bairros.nome,
    image: row.imagem_url || DEFAULT_IMAGE, adminStatus: row.status, isOpen: row.aberta, deliveryAvailable: row.entrega_disponivel,
    hours: first ? `${first.opens} às ${first.closes}` : 'Sem horário definido', schedule, estimatedRange: formatRange(row.estimativa_minutos_min, row.estimativa_minutos_max),
    coverage: row.batedeiras_bairros.map(item => ({ neighborhood: item.bairros.nome, feeCents: item.taxa_entrega_centavos, estimatedRange: formatRange(item.estimativa_minutos_min, item.estimativa_minutos_max) })).sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, 'pt-BR')),
    paymentAccountStatus: row.conta_pagamento_status, createdAt: row.criado_em.toISOString(),
    ...(options.admin ? { document: `${row.documento_tipo} ${maskDocumento(row.documento)}` } : {}),
  } as Store
}

export const toProduct = (row: { id: bigint; batedeira_id: bigint; nome: string; descricao: string | null; imagem_url: string | null; volume_ml: number; preco_centavos: number; ativo: boolean; disponivel: boolean; exibir_quando_indisponivel: boolean; atualizado_em: Date }): Product => ({
  id: String(row.id), storeId: String(row.batedeira_id), name: row.nome, description: row.descricao ?? undefined, image: row.imagem_url ?? undefined, volumeMl: row.volume_ml,
  priceCents: row.preco_centavos, active: row.ativo, available: row.disponivel, showUnavailable: row.exibir_quando_indisponivel, updatedAt: row.atualizado_em.toISOString(),
})

export type AuditView = { id: string; at: string; author: string; entityId: string; action: string; reason: string }

/** O que cada papel pode ver: cliente, só batedeiras ATIVAS (e produtos visíveis); operador, a própria batedeira completa; administrador, todas. */
export async function catalogFor(userId: bigint, role: Role): Promise<{ stores: Store[]; products: Product[]; audit: AuditView[] }> {
  if (role === 'cliente') {
    const rows = await db.batedeiras.findMany({ where: { status: 'ATIVA' }, include: { ...storeInclude, produtos: { where: { ativo: true, OR: [{ disponivel: true }, { exibir_quando_indisponivel: true }] } } }, orderBy: { nome: 'asc' } })
    return { stores: rows.map(row => toStore(row)), products: rows.flatMap(row => row.produtos.map(toProduct)), audit: [] }
  }
  if (role === 'operador') {
    const row = await db.batedeiras.findFirst({ where: { responsavel_id: userId }, include: { ...storeInclude, produtos: true } })
    return row ? { stores: [toStore(row)], products: row.produtos.map(toProduct), audit: [] } : { stores: [], products: [], audit: [] }
  }
  const rows = await db.batedeiras.findMany({ include: storeInclude, orderBy: { criado_em: 'desc' } })
  const events = await db.eventos_auditoria.findMany({ where: { entidade_tipo: { in: ['batedeira', 'pedido'] } }, include: { usuarios: true }, orderBy: { criado_em: 'asc' } })
  const orderCodes = new Map((await db.pedidos.findMany({ where: { id: { in: events.filter(e => e.entidade_tipo === 'pedido').map(e => e.entidade_id) } }, select: { id: true, codigo: true } })).map(o => [o.id, o.codigo]))
  const audit = events.map(event => ({ id: `db-${event.id}`, at: event.criado_em.toISOString(), author: event.usuarios.nome, entityId: event.entidade_tipo === 'pedido' ? (orderCodes.get(event.entidade_id) ?? String(event.entidade_id)) : String(event.entidade_id), action: event.acao, reason: String((event.detalhes as { reason?: string } | null)?.reason ?? '') }))
  return { stores: rows.map(row => toStore(row, { admin: true })), products: [], audit }
}

export type SaveResult = { ok: true } | { ok: false; error: string; status: number }
const bad = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status })

/** Operador atualiza a própria batedeira: abertura, entrega, faixa estimada, bairros atendidos e horários. */
export async function saveStoreSettings(userId: bigint, raw: unknown): Promise<SaveResult> {
  const parsed = validateStoreSettings(raw)
  if (!parsed.ok) return bad(parsed.error)
  const store = await db.batedeiras.findUnique({ where: { responsavel_id: userId } })
  if (!store) return bad('Sua conta não está vinculada a uma batedeira.', 403)
  const { data } = parsed
  const bairros = await db.bairros.findMany({ where: { nome: { in: data.coverage.map(c => c.neighborhood) } } })
  const idByName = new Map(bairros.map(b => [b.nome, b.id]))
  if (data.coverage.some(c => !idByName.has(c.neighborhood))) return bad('Bairro ausente no banco.', 500)
  if (store.status === 'ATIVA' && data.coverage.length === 0) return bad('Uma batedeira ativa precisa ter pelo menos um bairro atendido.')
  await db.$transaction([
    db.batedeiras.update({ where: { id: store.id }, data: { aberta: data.isOpen, entrega_disponivel: data.deliveryAvailable, estimativa_minutos_min: data.estimate.min, estimativa_minutos_max: data.estimate.max } }),
    db.batedeiras_bairros.deleteMany({ where: { batedeira_id: store.id } }),
    db.batedeiras_bairros.createMany({ data: data.coverage.map(c => ({ batedeira_id: store.id, bairro_id: idByName.get(c.neighborhood)!, taxa_entrega_centavos: c.feeCents, estimativa_minutos_min: c.min, estimativa_minutos_max: c.max })) }),
    db.horarios_funcionamento.deleteMany({ where: { batedeira_id: store.id } }),
    db.horarios_funcionamento.createMany({ data: data.schedule.map(s => ({ batedeira_id: store.id, dia_semana: s.day, hora_abertura: toTime(s.opens), hora_fechamento: toTime(s.closes), ativo: s.active })) }),
  ])
  return { ok: true }
}

/** Operador cria ou edita produto da própria batedeira. Produto de outra batedeira é recusado. Produtos nunca são apagados (arquivar = ativo falso). */
export async function saveProductFor(userId: bigint, raw: unknown): Promise<SaveResult & { product?: Product }> {
  const parsed = validateProduct(raw)
  if (!parsed.ok) return bad(parsed.error)
  const store = await db.batedeiras.findUnique({ where: { responsavel_id: userId } })
  if (!store) return bad('Sua conta não está vinculada a uma batedeira.', 403)
  const p = parsed.data
  const fields = { nome: p.name, descricao: p.description || null, unidade: unitLabel(p.volumeMl), volume_ml: p.volumeMl, preco_centavos: p.priceCents, disponivel: p.available, exibir_quando_indisponivel: p.showUnavailable, ativo: p.active }
  if (p.id && /^\d{1,18}$/.test(p.id)) {
    const existing = await db.produtos.findUnique({ where: { id: BigInt(p.id) } })
    if (!existing || existing.batedeira_id !== store.id) return bad('Produto não encontrado.', 404)
    return { ok: true, product: toProduct(await db.produtos.update({ where: { id: existing.id }, data: fields })) }
  }
  return { ok: true, product: toProduct(await db.produtos.create({ data: { ...fields, batedeira_id: store.id } })) }
}

/** Administrador altera a situação da batedeira, com motivo e trilha de auditoria. Ativar exige ao menos um bairro atendido. */
export async function setStoreStatus(adminId: bigint, raw: unknown): Promise<SaveResult> {
  const id = (raw as { id?: unknown } | null)?.id
  const count = typeof id === 'string' && /^\d{1,18}$/.test(id) ? await db.batedeiras_bairros.count({ where: { batedeira_id: BigInt(id), ativo: true } }) : 0
  const parsed = validateStatusChange(raw, count)
  if (!parsed.ok) return bad(parsed.error)
  const { data } = parsed
  const store = await db.batedeiras.findUnique({ where: { id: BigInt(data.id) } })
  if (!store) return bad('Batedeira não encontrada.', 404)
  if (store.status === data.status) return bad('A batedeira já está nesta situação.')
  await db.$transaction([
    db.batedeiras.update({ where: { id: store.id }, data: { status: data.status as StoreStatus } }),
    db.eventos_auditoria.create({ data: { usuario_id: adminId, acao: 'Alteração da situação da batedeira', entidade_tipo: 'batedeira', entidade_id: store.id, detalhes: { from: store.status, to: data.status, reason: data.reason, eligibilityConfirmed: data.eligibilityConfirmed } } }),
  ])
  return { ok: true }
}
