// Pedidos no MySQL (ADR-006, etapa 4). Só no servidor.
// As regras (estados, prazos, quem pode o quê) continuam na camada de domínio pura (`lib/domain.ts`); aqui só se carrega o pedido,
// aplica-se a regra e grava-se o resultado em UMA transação, com o pedido bloqueado (SELECT ... FOR UPDATE).
import { db } from './db.ts'
import { storeInclude, toProduct, toStore } from './catalog.ts'
import { formatRange, parseRange } from './store-rules.ts'
import { applyTransition, choosePayment as applyChoice, createOrderSnapshot, expireOrders, predefinedMessages, type Actor, type Order, type OrderStatus, type PaymentMethod, type TimelineEvent } from './domain.ts'
import type { Role } from './auth.ts'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
/** Erros da camada de domínio têm mensagem ao usuário; qualquer outro erro (banco, bug) sobe como está e vira 503 sem detalhes. */
function domain<T>(task: () => T, status = 400): T {
  try { return task() } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(status, error instanceof Error ? error.message : 'Operação recusada.') }
}

const orderInclude = { itens_pedido: true, eventos_pedido: { include: { usuarios: true }, orderBy: [{ criado_em: 'asc' as const }, { id: 'asc' as const }] }, batedeiras: true }
type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]
type OrderRow = NonNullable<Awaited<ReturnType<typeof findRow>>>
const findRow = (client: Tx | typeof db, where: { codigo: string }) => client.pedidos.findUnique({ where, include: orderInclude })

const TERMINAL: OrderStatus[] = ['RECUSADO', 'EXPIRADO', 'CANCELADO', 'ENTREGUE', 'FALHA_NA_ENTREGA']
const iso = (date: Date) => date.toISOString()

export function toOrder(row: OrderRow): Order {
  const timeline: TimelineEvent[] = row.eventos_pedido.map(event => ({
    ...(event.status_anterior ? { from: event.status_anterior } : {}), to: event.status_novo ?? row.status, at: iso(event.criado_em),
    author: event.usuarios?.nome ?? (event.origem_processo === 'expiracao_automatica' ? 'Expiração automática' : event.origem_processo ?? ''),
    ...(event.motivo ? { reason: event.motivo } : {}), ...(event.mensagem ? { message: event.mensagem } : {}),
  }))
  return {
    id: row.codigo, requestId: row.chave_idempotencia, customerId: String(row.cliente_id), storeId: String(row.batedeira_id), storeName: row.batedeiras.nome,
    items: row.itens_pedido.map(item => ({ productId: item.produto_id === null ? '' : String(item.produto_id), name: item.nome_produto_snapshot, quantity: item.quantidade, volumeMl: item.volume_unitario_ml_snapshot, unitPriceCents: item.preco_unitario_centavos, ...(item.observacao ? { note: item.observacao } : {}) })),
    subtotalCents: row.subtotal_centavos, deliveryFeeCents: row.taxa_entrega_centavos, totalCents: row.total_centavos,
    address: { street: row.endereco_snapshot, number: '', neighborhood: row.bairro_snapshot, ...(row.referencia_snapshot ? { reference: row.referencia_snapshot } : {}) },
    phone: row.telefone_snapshot, ...(row.forma_pagamento ? { payment: row.forma_pagamento } : {}), ...(row.troco_para_centavos !== null ? { changeForCents: row.troco_para_centavos } : {}), ...(row.observacao ? { note: row.observacao } : {}),
    status: row.status, createdAt: iso(row.criado_em), estimatedRange: formatRange(row.estimativa_minutos_min, row.estimativa_minutos_max),
    acceptedDeadline: iso(row.expira_aceite_em), ...(row.escolha_pagamento_expira_em ? { paymentDeadline: iso(row.escolha_pagamento_expira_em) } : {}), timeline,
  }
}

export type Session = { userId: bigint; role: Role; name: string }
const actorFor = async (session: Session): Promise<Actor> => {
  if (session.role === 'cliente') return { role: 'cliente', name: session.name, customerId: String(session.userId) }
  if (session.role === 'admin') return { role: 'admin', name: session.name }
  const store = await db.batedeiras.findUnique({ where: { responsavel_id: session.userId }, select: { id: true } })
  if (!store) throw new HttpError(403, 'Sua conta não está vinculada a uma batedeira.')
  return { role: 'operador', name: session.name, storeId: String(store.id) }
}
/** O pedido só é visível ao cliente dono, à batedeira dona e ao administrador; para os demais, "não encontrado". */
function assertVisible(row: OrderRow, session: Session, actor: Actor) {
  const ok = session.role === 'admin' || (session.role === 'cliente' && row.cliente_id === session.userId) || (session.role === 'operador' && String(row.batedeira_id) === actor.storeId)
  if (!ok) throw new HttpError(404, 'Pedido não encontrado.')
}

function eventType(event: TimelineEvent, after: Order): 'PEDIDO_RECUSADO' | 'PEDIDO_CANCELADO' | 'PAGAMENTO_EXPIRADO' | 'PAGAMENTO_ESCOLHIDO' | 'STATUS_ALTERADO' {
  if (event.to === 'RECUSADO') return 'PEDIDO_RECUSADO'
  if (event.to === 'CANCELADO') return event.reason === 'Pagamento expirado' || event.reason === 'Forma de pagamento não escolhida' ? 'PAGAMENTO_EXPIRADO' : 'PEDIDO_CANCELADO'
  if (event.from === 'ACEITO' && after.payment && (event.to === 'EM_PREPARO' || event.to === 'AGUARDANDO_PAGAMENTO')) return 'PAGAMENTO_ESCOLHIDO'
  return 'STATUS_ALTERADO'
}

/** Grava o resultado de uma regra de domínio: campos do pedido e os eventos novos da linha do tempo. */
async function persist(tx: Tx, row: OrderRow, before: Order, after: Order, actor: { userId?: bigint }) {
  const fresh = after.timeline.slice(before.timeline.length)
  const accepted = fresh.find(event => event.to === 'ACEITO')
  const finished = TERMINAL.includes(after.status) ? fresh.find(event => event.to === after.status) : undefined
  await tx.pedidos.update({ where: { id: row.id }, data: {
    status: after.status, forma_pagamento: after.payment ?? null, troco_para_centavos: after.changeForCents ?? null,
    escolha_pagamento_expira_em: after.paymentDeadline ? new Date(after.paymentDeadline) : null,
    ...(accepted ? { aceito_em: new Date(accepted.at) } : {}), ...(finished ? { finalizado_em: new Date(finished.at) } : {}),
  } })
  for (const event of fresh) {
    await tx.eventos_pedido.create({ data: {
      pedido_id: row.id, usuario_id: actor.userId ?? null, origem_processo: actor.userId ? null : 'expiracao_automatica', tipo: eventType(event, after),
      status_anterior: event.from ?? null, status_novo: event.to, motivo: event.reason ?? null, mensagem: event.message ?? null, criado_em: new Date(event.at),
    } })
  }
}

/** Executa uma alteração com o pedido bloqueado, para que aceite do operador e expiração do sistema não se atropelem (backlog 7.1). */
async function locked<T>(codigo: string, task: (tx: Tx, row: OrderRow, before: Order) => Promise<T>): Promise<T> {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM pedidos WHERE codigo = ${codigo} FOR UPDATE`
    const row = await findRow(tx, { codigo })
    if (!row) throw new HttpError(404, 'Pedido não encontrado.')
    return task(tx, row, toOrder(row))
  })
}

export async function listOrders(session: Session): Promise<Order[]> {
  const where = session.role === 'cliente' ? { cliente_id: session.userId } : session.role === 'operador' ? { batedeiras: { responsavel_id: session.userId } } : {}
  const rows = await db.pedidos.findMany({ where, include: orderInclude, orderBy: { criado_em: 'desc' }, take: 500 })
  return rows.map(toOrder)
}

export type CreateInput = { storeId: string; items: { productId: string; quantity: number; note?: string; unitPriceCents?: number }[]; address: Order['address']; phone: string; note?: string; requestId: string; feeCents?: number }
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export function parseCreateInput(raw: unknown): CreateInput {
  const input = (raw ?? {}) as Record<string, unknown>
  const address = (input.address ?? {}) as Record<string, unknown>
  const requestId = text(input.requestId, 64)
  if (typeof input.storeId !== 'string' || !/^\d{1,18}$/.test(input.storeId) || requestId.length < 8 || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) throw new HttpError(400, 'Revise os produtos e as quantidades da sacola.')
  const items = (input.items as Record<string, unknown>[]).map(item => {
    if (!item || typeof item.productId !== 'string' || !/^\d{1,18}$/.test(item.productId)) throw new HttpError(400, 'Revise os produtos e as quantidades da sacola.')
    return { productId: item.productId, quantity: item.quantity as number, note: text(item.note, 300) || undefined, unitPriceCents: Number.isSafeInteger(item.unitPriceCents) ? (item.unitPriceCents as number) : undefined }
  })
  return { storeId: input.storeId, items, requestId, phone: text(input.phone, 20), note: text(input.note, 500) || undefined, feeCents: Number.isSafeInteger(input.feeCents) ? (input.feeCents as number) : undefined,
    address: { street: text(address.street, 181), number: text(address.number, 21), complement: text(address.complement, 101) || undefined, neighborhood: text(address.neighborhood, 100), reference: text(address.reference, 256) || undefined } }
}

/** Cria o pedido a partir dos preços e da taxa do BANCO (nunca do navegador). O mesmo `requestId` do mesmo cliente devolve o pedido já criado. */
export async function createOrder(session: Session, input: CreateInput): Promise<Order> {
  if (session.role !== 'cliente') throw new HttpError(403, 'Somente clientes enviam pedidos.')
  const existing = await db.pedidos.findFirst({ where: { cliente_id: session.userId, chave_idempotencia: input.requestId }, include: orderInclude })
  if (existing) return toOrder(existing)
  const storeRow = await db.batedeiras.findUnique({ where: { id: BigInt(input.storeId) }, include: { ...storeInclude, produtos: true } })
  if (!storeRow || storeRow.status !== 'ATIVA') throw new HttpError(404, 'Batedeira não encontrada.')
  const store = toStore(storeRow)
  const items = input.items.map(item => {
    const row = storeRow.produtos.find(product => String(product.id) === item.productId)
    if (!row || !row.ativo) throw new HttpError(409, 'Um produto foi removido. Revise a sacola.')
    const product = toProduct(row)
    if (item.unitPriceCents !== undefined && item.unitPriceCents !== product.priceCents) throw new HttpError(409, 'O catálogo mudou. Remova e adicione novamente os itens para revisar os valores.')
    return { product, quantity: item.quantity, note: item.note }
  })
  const coverage = store.coverage.find(c => c.neighborhood === input.address.neighborhood)
  if (coverage && input.feeCents !== undefined && input.feeCents !== coverage.feeCents) throw new HttpError(409, 'A taxa de entrega mudou. Revise o total antes de confirmar.')
  const order = domain(() => createOrderSnapshot(items, store, input.address, input.phone.replace(/\D/g, ''), input.note))
  const estimate = parseRange(order.estimatedRange)!
  const addressText = [`${order.address.street}, ${order.address.number}`, order.address.complement].filter(Boolean).join(' · ')
  try {
    await db.$transaction(async tx => {
      const created = await tx.pedidos.create({ data: {
        codigo: order.id, chave_idempotencia: input.requestId, cliente_id: session.userId, batedeira_id: storeRow.id, status: 'AGUARDANDO_ACEITE',
        subtotal_centavos: order.subtotalCents, taxa_entrega_centavos: order.deliveryFeeCents, total_centavos: order.totalCents, volume_total_ml: order.items.reduce((sum, i) => sum + i.volumeMl * i.quantity, 0),
        observacao: order.note ?? null, estimativa_minutos_min: estimate.min, estimativa_minutos_max: estimate.max, endereco_snapshot: addressText.slice(0, 255), bairro_snapshot: order.address.neighborhood,
        referencia_snapshot: order.address.reference ?? null, telefone_snapshot: order.phone, criado_em: new Date(order.createdAt), expira_aceite_em: new Date(order.acceptedDeadline),
      } })
      await tx.itens_pedido.createMany({ data: order.items.map(item => ({ pedido_id: created.id, produto_id: BigInt(item.productId), nome_produto_snapshot: item.name, unidade_snapshot: item.volumeMl >= 1000 ? `${item.volumeMl / 1000} litro` : `${item.volumeMl} ml`, volume_unitario_ml_snapshot: item.volumeMl, preco_unitario_centavos: item.unitPriceCents, quantidade: item.quantity, subtotal_centavos: item.unitPriceCents * item.quantity, observacao: item.note ?? null })) })
      await tx.eventos_pedido.create({ data: { pedido_id: created.id, usuario_id: session.userId, tipo: 'PEDIDO_CRIADO', status_novo: 'AGUARDANDO_ACEITE', criado_em: new Date(order.createdAt) } })
    })
  } catch (error) {
    if ((error as { code?: unknown })?.code === 'P2002') { // mesma requisição enviada duas vezes ao mesmo tempo
      const again = await db.pedidos.findFirst({ where: { cliente_id: session.userId, chave_idempotencia: input.requestId }, include: orderInclude })
      if (again) return toOrder(again)
    }
    throw error
  }
  return toOrder((await findRow(db, { codigo: order.id }))!)
}

export async function transitionOrder(session: Session, codigo: string, to: OrderStatus, reason?: string): Promise<Order> {
  const actor = await actorFor(session)
  return locked(codigo, async (tx, row, before) => {
    assertVisible(row, session, actor)
    const after = domain(() => applyTransition(before, to, actor, reason))
    await persist(tx, row, before, after, { userId: session.userId })
    if (session.role === 'admin') await tx.eventos_auditoria.create({ data: { usuario_id: session.userId, acao: 'Cancelamento operacional', entidade_tipo: 'pedido', entidade_id: row.id, detalhes: { reason: reason ?? '' } } })
    return toOrder((await findRow(tx, { codigo }))!)
  })
}

export async function chooseOrderPayment(session: Session, codigo: string, method: PaymentMethod, changeForCents?: number): Promise<Order> {
  if (session.role !== 'cliente') throw new HttpError(403, 'Somente o cliente escolhe a forma de pagamento.')
  if (method === 'PIX') throw new HttpError(400, 'O pagamento por Pix ainda não está disponível. Escolha dinheiro na entrega.')
  const actor = await actorFor(session)
  return locked(codigo, async (tx, row, before) => {
    assertVisible(row, session, actor)
    const after = domain(() => applyChoice(before, method, { paymentAccountStatus: row.batedeiras.conta_pagamento_status }, actor, changeForCents))
    await persist(tx, row, before, after, { userId: session.userId })
    return toOrder((await findRow(tx, { codigo }))!)
  })
}

/** Mensagem operacional (batedeira, só predefinidas) ou intervenção do administrador, na linha do tempo do pedido. */
export async function messageOrder(session: Session, codigo: string, message: string): Promise<Order> {
  if (session.role === 'cliente') throw new HttpError(403, 'Perfil sem permissão para esta ação.')
  const text = message.trim()
  if (!text || text.length > 500) throw new HttpError(400, 'Informe uma intervenção de até 500 caracteres.')
  if (session.role === 'operador' && !predefinedMessages.includes(text)) throw new HttpError(400, 'Escolha uma mensagem predefinida.')
  const actor = await actorFor(session)
  return locked(codigo, async (tx, row) => {
    assertVisible(row, session, actor)
    await tx.eventos_pedido.create({ data: { pedido_id: row.id, usuario_id: session.userId, tipo: session.role === 'admin' ? 'INTERVENCAO_ADMINISTRATIVA' : 'MENSAGEM_OPERACIONAL', status_novo: row.status, mensagem: text } })
    if (session.role === 'admin') await tx.eventos_auditoria.create({ data: { usuario_id: session.userId, acao: 'Intervenção administrativa', entidade_tipo: 'pedido', entidade_id: row.id, detalhes: { reason: text } } })
    return toOrder((await findRow(tx, { codigo }))!)
  })
}

/** Expira o que venceu: pedido sem resposta em 5 min e forma de pagamento não escolhida em 10 min. Seguro para rodar a qualquer momento e em paralelo. */
export async function expireDueOrders(now = Date.now()): Promise<number> {
  const date = new Date(now)
  const due = await db.pedidos.findMany({ where: { OR: [{ status: 'AGUARDANDO_ACEITE', expira_aceite_em: { lte: date } }, { status: 'ACEITO', forma_pagamento: null, escolha_pagamento_expira_em: { lte: date } }] }, select: { codigo: true }, take: 200 })
  let changed = 0
  for (const { codigo } of due) {
    await locked(codigo, async (tx, row, before) => {
      const [after] = expireOrders([before], now)
      if (after === before) return
      await persist(tx, row, before, after, {})
      changed += 1
    })
  }
  return changed
}
