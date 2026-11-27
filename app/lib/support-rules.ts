// Regras puras do contato de suporte (PRD §8.3).
export type SupportUpdate = { ok: true; email: string | null } | { ok: false; error: string }

/** E-mail vazio remove o canal. */
export function validateSupportContact(raw: unknown): SupportUpdate {
  const value = (raw as { email?: unknown } | null)?.email
  if (typeof value !== 'string') return { ok: false, error: 'Requisição inválida.' }
  const email = value.trim().toLowerCase()
  if (!email) return { ok: true, email: null }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Informe um e-mail válido para o suporte.' }
  return { ok: true, email }
}
