// Contas (clientes, batedeiras e administradores) no MySQL (ADR-006). Só no servidor.
import { db } from './db.ts'
import { newToken, sha256, type Registration } from './auth.ts'
import { endAllSessions, roleFromTipo } from './sessions.ts'
import type { Role } from './auth.ts'

/** Faixa estimada provisória de uma batedeira recém-cadastrada; ela a ajusta no painel (PRD §12.6). */
export const DEFAULT_ESTIMATE_MINUTES = { min: 30, max: 45 } as const

export type AccountView = {
  id: string
  role: Role
  email: string
  name: string
  phone?: string
  address?: { street: string; number: string; complement: string; reference: string; neighborhood: string }
  store?: { id: string; name: string; address: string; neighborhood: string; status: string }
}

const isUniqueViolation = (error: unknown) => typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'

export const findUserByEmail = (email: string) => db.usuarios.findUnique({ where: { email: email.trim().toLowerCase() } })

async function neighborhoodId(name: string): Promise<bigint> {
  const row = await db.bairros.findUnique({ where: { nome: name } })
  if (!row) throw new Error(`Bairro "${name}" ausente no banco. Rode pnpm db:semear.`)
  return row.id
}

/** Cria o cliente (com o endereço principal) ou a batedeira (EM_ANALISE) em uma transação. Devolve null se o e-mail já existir. */
export async function createAccount(data: Registration, passwordHash: string): Promise<{ id: bigint; role: Role } | null> {
  const bairroId = await neighborhoodId(data.tipo === 'cliente' ? data.address.neighborhood : data.neighborhood)
  try {
    return await db.$transaction(async tx => {
      const user = await tx.usuarios.create({ data: { nome: data.name, email: data.email, telefone: data.phone, senha_hash: passwordHash, tipo: data.tipo === 'cliente' ? 'CLIENTE' : 'OPERADOR' } })
      if (data.tipo === 'cliente') {
        const { street, number, complement, reference } = data.address
        await tx.enderecos_clientes.create({ data: { cliente_id: user.id, logradouro: street, numero: number, complemento: complement || null, ponto_referencia: reference || null, bairro_id: bairroId, principal: true } })
        return { id: user.id, role: 'cliente' as const }
      }
      await tx.batedeiras.create({ data: { responsavel_id: user.id, nome: data.storeName, endereco: data.address, bairro_id: bairroId, documento_tipo: data.documentKind, documento: data.document, estimativa_minutos_min: DEFAULT_ESTIMATE_MINUTES.min, estimativa_minutos_max: DEFAULT_ESTIMATE_MINUTES.max } })
      return { id: user.id, role: 'operador' as const }
    })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

/** Cria o administrador (só por script no servidor; nunca pelo site). Devolve null se o e-mail já existir. */
export async function createAdmin(input: { email: string; name: string; passwordHash: string }): Promise<{ id: bigint } | null> {
  try {
    const user = await db.usuarios.create({ data: { nome: input.name, email: input.email.trim().toLowerCase(), senha_hash: input.passwordHash, tipo: 'ADMINISTRADOR' } })
    return { id: user.id }
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}

/** Dados da conta para o próprio usuário. Nunca inclui o CPF/CNPJ (DEC-055). */
export async function getAccountView(userId: bigint): Promise<AccountView | null> {
  const user = await db.usuarios.findUnique({
    where: { id: userId },
    include: { batedeiras: { include: { bairros: true } }, enderecos_clientes: { where: { ativo: true, principal: true }, include: { bairros: true }, take: 1 } },
  })
  if (!user) return null
  const principal = user.enderecos_clientes[0]
  const store = user.batedeiras
  return {
    id: String(user.id), role: roleFromTipo(user.tipo), email: user.email, name: user.nome, phone: user.telefone ?? undefined,
    address: principal ? { street: principal.logradouro, number: principal.numero, complement: principal.complemento ?? '', reference: principal.ponto_referencia ?? '', neighborhood: principal.bairros.nome } : undefined,
    store: store ? { id: String(store.id), name: store.nome, address: store.endereco, neighborhood: store.bairros.nome, status: store.status } : undefined,
  }
}

/** Cadastros de batedeira para o administrador analisar. O documento sai completo daqui: mascarar antes de enviar ao navegador. */
export const listStoreRegistrations = () => db.batedeiras.findMany({ include: { usuarios: true, bairros: true }, orderBy: { criado_em: 'desc' } })

const RESET_TTL_MS = 30 * 60 * 1000

/** Gera o token de redefinição (só o hash é guardado; 30 min; um pedido novo invalida os anteriores). Null se o e-mail não existir ou a conta não estiver ativa. */
export async function createResetToken(email: string, now = Date.now()): Promise<{ token: string; name: string } | null> {
  const user = await findUserByEmail(email)
  if (!user || user.status !== 'ATIVO') return null
  const token = newToken()
  await db.$transaction([
    db.redefinicoes_senha.deleteMany({ where: { usuario_id: user.id, usada_em: null } }),
    db.redefinicoes_senha.create({ data: { usuario_id: user.id, token_hash: sha256(token), criado_em: new Date(now), expira_em: new Date(now + RESET_TTL_MS) } }),
  ])
  return { token, name: user.nome }
}

/** Troca a senha se o token for válido; uso único. Encerra todas as sessões do usuário. */
export async function consumeResetToken(token: string, newHash: string, now = Date.now()): Promise<boolean> {
  const tokenHash = sha256(token)
  const userId = await db.$transaction(async tx => {
    const claimed = await tx.redefinicoes_senha.updateMany({ where: { token_hash: tokenHash, usada_em: null, expira_em: { gt: new Date(now) } }, data: { usada_em: new Date(now) } })
    if (claimed.count !== 1) return null
    const row = await tx.redefinicoes_senha.findUniqueOrThrow({ where: { token_hash: tokenHash } })
    await tx.usuarios.update({ where: { id: row.usuario_id }, data: { senha_hash: newHash } })
    return row.usuario_id
  })
  if (userId === null) return false
  await endAllSessions(userId, now)
  return true
}
