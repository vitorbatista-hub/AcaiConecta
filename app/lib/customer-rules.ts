// Regras puras da administração de contas de cliente (PRD §16.2).
export type CustomerAccountStatus = 'ATIVO' | 'BLOQUEADO' | 'DESATIVADO'
export type CustomerAccount = { id: string; name: string; email: string; phone: string; status: CustomerAccountStatus; createdAt: string }

type Change = { id: string; status: 'ATIVO' | 'BLOQUEADO'; reason: string }

export function validateCustomerStatusChange(raw: unknown): { ok: true; data: Change } | { ok: false; error: string } {
  const input = (raw ?? {}) as Record<string, unknown>
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (typeof input.id !== 'string' || !/^\d{1,18}$/.test(input.id) || (input.status !== 'ATIVO' && input.status !== 'BLOQUEADO')) return { ok: false, error: 'Requisição inválida.' }
  if (!reason || reason.length > 255) return { ok: false, error: 'Informe o motivo administrativo (até 255 caracteres).' }
  return { ok: true, data: { id: input.id, status: input.status, reason } }
}
