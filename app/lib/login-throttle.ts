// Limitação de tentativas de login por e-mail e por origem, no banco (ADR-001, item 4). Só no servidor.
import { db } from './db.ts'
import { hashOrigin } from './auth.ts'

export const WINDOW_MS = 15 * 60 * 1000
const MINUTE = 60_000

/** Espera por e-mail: a partir de 10 falhas na janela, 1 min; de 15, 5 min; de 20, 15 min (contada da última falha). */
export const emailWaitMs = (failures: number) => (failures >= 20 ? 15 * MINUTE : failures >= 15 ? 5 * MINUTE : failures >= 10 ? MINUTE : 0)
/** Por origem o limite é alto (CGNAT): 50 falhas na janela, 15 min de espera. */
export const originWaitMs = (failures: number) => (failures >= 50 ? 15 * MINUTE : 0)

async function waiting(where: { email: string } | { origem_hash: string }, waitFor: (n: number) => number, now: number) {
  const since = new Date(now - WINDOW_MS)
  const failures = await db.tentativas_login.findMany({ where: { ...where, sucesso: false, criado_em: { gte: since } }, select: { criado_em: true }, orderBy: { criado_em: 'desc' } })
  const wait = waitFor(failures.length)
  return wait > 0 && now - failures[0].criado_em.getTime() < wait
}

/** Verdadeiro se o e-mail ou a origem estão em espera. Chamar antes de conferir a senha. */
export async function isThrottled(email: string, ip: string, now = Date.now()): Promise<boolean> {
  const origin = hashOrigin(ip)
  return (await waiting({ email }, emailWaitMs, now)) || (await waiting({ origem_hash: origin }, originWaitMs, now))
}

/** Registra a tentativa: o e-mail normalizado, a origem como HMAC e o resultado. Nunca a senha nem o IP. */
export async function recordAttempt(email: string, ip: string, success: boolean, now = Date.now()) {
  await db.tentativas_login.create({ data: { email, origem_hash: hashOrigin(ip), sucesso: success, criado_em: new Date(now) } })
}
