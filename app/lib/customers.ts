// Contas de cliente vistas e administradas pelo administrador (PRD §16.2, ADR-006 etapa 5). Só no servidor.
import { db } from './db.ts'
import { validateCustomerStatusChange, type CustomerAccount } from './customer-rules.ts'

export async function listCustomers(): Promise<CustomerAccount[]> {
  const rows = await db.usuarios.findMany({
    where: { tipo: 'CLIENTE' }, orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    select: { id: true, nome: true, email: true, telefone: true, status: true, criado_em: true },
  })
  return rows.map(row => ({ id: String(row.id), name: row.nome, email: row.email, phone: row.telefone ?? '', status: row.status, createdAt: row.criado_em.toISOString() }))
}

export type ChangeResult = { ok: true } | { ok: false; error: string; status: number }
const bad = (error: string, status = 400): ChangeResult => ({ ok: false, error, status })

/** Bloqueia ou reativa um cliente. O bloqueio encerra as sessões e invalida links de redefinição; pedidos e histórico não mudam. */
export async function setCustomerStatus(adminId: bigint, raw: unknown, now = Date.now()): Promise<ChangeResult> {
  const parsed = validateCustomerStatusChange(raw)
  if (!parsed.ok) return bad(parsed.error)
  const { status, reason } = parsed.data
  const id = BigInt(parsed.data.id)
  const user = await db.usuarios.findUnique({ where: { id }, select: { tipo: true, status: true } })
  if (!user || user.tipo !== 'CLIENTE') return bad('Cliente não encontrado.', 404)
  if (user.status === 'DESATIVADO') return bad('Conta desativada não pode ser bloqueada nem reativada aqui.', 409)
  if (user.status === status) return bad('A conta já está nesta situação.', 409)
  return db.$transaction(async tx => {
    // A condição no próprio UPDATE evita duas alterações (e duas auditorias) em envios paralelos.
    const changed = await tx.usuarios.updateMany({ where: { id, status: user.status }, data: { status } })
    if (changed.count !== 1) return bad('A situação mudou enquanto você revisava. Confira a lista.', 409)
    if (status === 'BLOQUEADO') {
      await tx.sessoes.updateMany({ where: { usuario_id: id, encerrada_em: null }, data: { encerrada_em: new Date(now) } })
      await tx.redefinicoes_senha.deleteMany({ where: { usuario_id: id, usada_em: null } })
    }
    await tx.eventos_auditoria.create({ data: { usuario_id: adminId, acao: status === 'BLOQUEADO' ? 'Bloqueio de conta' : 'Reativação de conta', entidade_tipo: 'cliente', entidade_id: id, detalhes: { from: user.status, to: status, reason } } })
    return { ok: true as const }
  })
}
