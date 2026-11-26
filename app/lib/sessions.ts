// Sessões opacas no banco (ADR-001): o navegador recebe um token aleatório; o banco guarda só o SHA-256. Só no servidor.
import { db } from './db.ts'
import { CLIENT_SESSION_TTL_MS, STAFF_SESSION_TTL_MS, newToken, sha256, type Role } from './auth.ts'

export const roleFromTipo = (tipo: 'CLIENTE' | 'OPERADOR' | 'ADMINISTRADOR'): Role => (tipo === 'CLIENTE' ? 'cliente' : tipo === 'OPERADOR' ? 'operador' : 'admin')
const ttlFor = (role: Role) => (role === 'cliente' ? CLIENT_SESSION_TTL_MS : STAFF_SESSION_TTL_MS)

export type ActiveSession = { userId: bigint; role: Role; email: string; name: string; expiresAt: Date }

/** Cria uma sessão nova (token novo a cada login). Devolve o token em texto, que só existe aqui e no cookie. */
export async function createSession(userId: bigint, role: Role, now = Date.now()) {
  const token = newToken()
  const expiresAt = new Date(now + ttlFor(role))
  await db.sessoes.create({ data: { usuario_id: userId, token_hash: sha256(token), criado_em: new Date(now), expira_em: expiresAt } })
  return { token, expiresAt }
}

/** Sessão válida: não encerrada, não expirada e de usuário ATIVO. Cliente renova até 30 dias a cada uso (no máximo uma vez por hora). */
export async function getActiveSession(token: string | undefined, now = Date.now()): Promise<ActiveSession | null> {
  if (!token || token.length > 200) return null
  const row = await db.sessoes.findUnique({ where: { token_hash: sha256(token) }, include: { usuarios: true } })
  if (!row || row.encerrada_em || row.expira_em.getTime() <= now || row.usuarios.status !== 'ATIVO') return null
  const role = roleFromTipo(row.usuarios.tipo)
  let expiresAt = row.expira_em
  if (role === 'cliente' && row.expira_em.getTime() - now < CLIENT_SESSION_TTL_MS - 60 * 60 * 1000) {
    expiresAt = new Date(now + CLIENT_SESSION_TTL_MS)
    await db.sessoes.update({ where: { id: row.id }, data: { expira_em: expiresAt } })
  }
  return { userId: row.usuario_id, role, email: row.usuarios.email, name: row.usuarios.nome, expiresAt }
}

export async function endSession(token: string | undefined, now = Date.now()) {
  if (!token) return
  await db.sessoes.updateMany({ where: { token_hash: sha256(token), encerrada_em: null }, data: { encerrada_em: new Date(now) } })
}

/** Encerra todas as sessões do usuário (bloqueio, desativação ou troca de senha). */
export async function endAllSessions(userId: bigint, now = Date.now()) {
  await db.sessoes.updateMany({ where: { usuario_id: userId, encerrada_em: null }, data: { encerrada_em: new Date(now) } })
}

/** Remove sessões encerradas ou vencidas, tentativas com mais de 24 h e redefinições vencidas ou usadas. */
export async function purgeAuthData(now = Date.now()) {
  const day = new Date(now - 24 * 60 * 60 * 1000)
  await db.sessoes.deleteMany({ where: { OR: [{ expira_em: { lt: new Date(now) } }, { encerrada_em: { lt: day } }] } })
  await db.tentativas_login.deleteMany({ where: { criado_em: { lt: day } } })
  await db.redefinicoes_senha.deleteMany({ where: { OR: [{ expira_em: { lt: new Date(now) } }, { usada_em: { not: null } }] } })
}

let lastPurge = 0
/** Expurgo oportunista (no máximo uma vez por hora por processo); falhas não atrapalham quem está entrando. */
export function purgeAuthDataSometimes(now = Date.now()) {
  if (now - lastPurge < 60 * 60 * 1000) return
  lastPurge = now
  purgeAuthData(now).catch(() => console.error('Falha ao expurgar dados de autenticação.'))
}
