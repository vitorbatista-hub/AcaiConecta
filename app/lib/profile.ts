// Área "Minha conta" (DEC-063) no MySQL. Só no servidor. Toda função recebe o usuário da sessão: ninguém altera dados de outra conta.
import { db } from './db.ts'
import { hashPassword, sha256, verifyPassword, type Role } from './auth.ts'
import { removeAddress, saveAddress, type SavedAddress } from './customer-session.ts'
import { maskDocumento } from './documento.ts'
import { isThrottled, recordAttempt } from './login-throttle.ts'
import { validateEmailChange, validatePasswordChange, validatePersonal, validateStoreProfile } from './profile-rules.ts'
import { roleFromTipo } from './sessions.ts'

export type Profile = {
  role: Role; name: string; email: string; phone: string
  addresses?: SavedAddress[]
  store?: { name: string; description: string; phone: string; address: string; neighborhood: string; reference: string; document: string; status: string }
}
export type ProfileResult = { ok: true } | { ok: false; error: string; status: number }
const bad = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status })
type Client = Pick<typeof db, 'enderecos_clientes'>

export async function listAddresses(userId: bigint, client: Client = db): Promise<SavedAddress[]> {
  const rows = await client.enderecos_clientes.findMany({ where: { cliente_id: userId, ativo: true }, include: { bairros: true }, orderBy: [{ principal: 'desc' }, { id: 'asc' }] })
  return rows.map(row => ({ id: String(row.id), primary: row.principal, street: row.logradouro, number: row.numero, complement: row.complemento ?? '', reference: row.ponto_referencia ?? '', neighborhood: row.bairros.nome }))
}

/** Dados da própria conta. O CPF/CNPJ só sai mascarado (DEC-063). */
export async function getProfile(userId: bigint): Promise<Profile | null> {
  const user = await db.usuarios.findUnique({ where: { id: userId }, include: { batedeiras: { include: { bairros: true } } } })
  if (!user) return null
  const role = roleFromTipo(user.tipo)
  const store = user.batedeiras
  return {
    role, name: user.nome, email: user.email, phone: user.telefone ?? '',
    addresses: role === 'cliente' ? await listAddresses(userId) : undefined,
    store: store ? { name: store.nome, description: store.descricao ?? '', phone: store.telefone_operacional ?? '', address: store.endereco, neighborhood: store.bairros.nome, reference: store.ponto_referencia ?? '', document: `${store.documento_tipo} ${maskDocumento(store.documento)}`, status: store.status } : undefined,
  }
}

export async function updatePersonal(userId: bigint, role: Role, raw: Record<string, unknown>): Promise<ProfileResult> {
  const parsed = validatePersonal(raw, role)
  if (!parsed.ok) return bad(parsed.error)
  await db.usuarios.update({ where: { id: userId }, data: { nome: parsed.data.name, telefone: parsed.data.phone || null } })
  return { ok: true }
}

/** Confere a senha atual com a mesma limitação de tentativas do login (ADR-001). */
async function checkPassword(userId: bigint, password: string, ip: string): Promise<ProfileResult> {
  const user = await db.usuarios.findUniqueOrThrow({ where: { id: userId } })
  if (await isThrottled(user.email, ip)) return bad('Muitas tentativas. Aguarde alguns minutos e tente de novo.', 429)
  if (verifyPassword(password, user.senha_hash)) return { ok: true }
  await recordAttempt(user.email, ip, false)
  return bad('Senha atual incorreta.')
}

export async function changeEmail(userId: bigint, raw: Record<string, unknown>, ip: string): Promise<ProfileResult> {
  const parsed = validateEmailChange(raw)
  if (!parsed.ok) return bad(parsed.error)
  const checked = await checkPassword(userId, parsed.data.currentPassword, ip)
  if (!checked.ok) return checked
  try {
    // Um link de redefinição enviado ao e-mail antigo deixa de valer.
    await db.$transaction([
      db.usuarios.update({ where: { id: userId }, data: { email: parsed.data.email } }),
      db.redefinicoes_senha.deleteMany({ where: { usuario_id: userId, usada_em: null } }),
    ])
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'P2002') return bad('Este e-mail já está em uso.', 409)
    throw error
  }
  return { ok: true }
}

/** Troca a senha e encerra as demais sessões; a sessão atual continua. */
export async function changePassword(userId: bigint, raw: Record<string, unknown>, ip: string, currentToken: string, now = Date.now()): Promise<ProfileResult> {
  const parsed = validatePasswordChange(raw)
  if (!parsed.ok) return bad(parsed.error)
  const checked = await checkPassword(userId, parsed.data.currentPassword, ip)
  if (!checked.ok) return checked
  await db.$transaction([
    db.usuarios.update({ where: { id: userId }, data: { senha_hash: hashPassword(parsed.data.newPassword) } }),
    db.redefinicoes_senha.deleteMany({ where: { usuario_id: userId, usada_em: null } }),
    db.sessoes.updateMany({ where: { usuario_id: userId, encerrada_em: null, token_hash: { not: sha256(currentToken) } }, data: { encerrada_em: new Date(now) } }),
  ])
  return { ok: true }
}

/** Cadastro da batedeira: vale na hora, sem mudar a situação, e fica na auditoria. Pedidos guardam o próprio endereço de entrega. */
export async function updateStoreProfile(userId: bigint, raw: Record<string, unknown>): Promise<ProfileResult> {
  const parsed = validateStoreProfile(raw)
  if (!parsed.ok) return bad(parsed.error)
  const store = await db.batedeiras.findUnique({ where: { responsavel_id: userId }, include: { bairros: true } })
  if (!store) return bad('Sua conta não está vinculada a uma batedeira.', 403)
  const bairro = await db.bairros.findUnique({ where: { nome: parsed.data.neighborhood } })
  if (!bairro) return bad('Bairro ausente no banco.', 500)
  const data = parsed.data
  const fields = [
    ['nome', store.nome, data.name], ['descrição', store.descricao ?? '', data.description], ['telefone de atendimento', store.telefone_operacional ?? '', data.phone],
    ['endereço', store.endereco, data.address], ['bairro', store.bairros.nome, data.neighborhood], ['ponto de referência', store.ponto_referencia ?? '', data.reference],
  ]
  const changed = fields.filter(([, from, to]) => from !== to)
  if (!changed.length) return { ok: true }
  // Valores anteriores e novos só para o que identifica o estabelecimento; dos demais campos fica apenas o nome.
  const tracked = Object.fromEntries(changed.filter(([field]) => ['nome', 'endereço', 'bairro'].includes(field)).map(([field, from, to]) => [field, { from, to }]))
  await db.$transaction([
    db.batedeiras.update({ where: { id: store.id }, data: { nome: data.name, descricao: data.description || null, telefone_operacional: data.phone || null, endereco: data.address, bairro_id: bairro.id, ponto_referencia: data.reference || null } }),
    db.eventos_auditoria.create({ data: { usuario_id: userId, acao: 'Alteração do cadastro da batedeira', entidade_tipo: 'batedeira', entidade_id: store.id, detalhes: { reason: `Campos alterados: ${changed.map(([field]) => field).join(', ')}.`, changes: tracked } } }),
  ])
  return { ok: true }
}

/** Cria, edita ou remove um endereço do cliente, com a conta bloqueada na transação para o limite de dois valer em envios paralelos (DEC-040). */
async function mutateAddresses(userId: bigint, change: (current: SavedAddress[]) => SavedAddress[] | null): Promise<ProfileResult> {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${userId} FOR UPDATE`
    const current = await listAddresses(userId, tx)
    let next: SavedAddress[] | null
    try { next = change(current) } catch (error) { return bad(error instanceof Error ? error.message : 'Revise o endereço.') }
    if (!next) return bad('Endereço não encontrado.', 404)
    for (const old of current.filter(item => !next.some(address => address.id === item.id))) {
      await tx.enderecos_clientes.update({ where: { id: BigInt(old.id) }, data: { ativo: false, principal: false } })
    }
    for (const address of next) {
      const bairro = await tx.bairros.findUnique({ where: { nome: address.neighborhood ?? '' } })
      if (!bairro) return bad('Bairro ausente no banco.', 500)
      const data = { logradouro: address.street, numero: address.number, complemento: address.complement || null, ponto_referencia: address.reference || null, bairro_id: bairro.id, principal: address.primary }
      if (current.some(item => item.id === address.id)) await tx.enderecos_clientes.update({ where: { id: BigInt(address.id) }, data })
      else await tx.enderecos_clientes.create({ data: { ...data, cliente_id: userId } })
    }
    return { ok: true as const }
  })
}

export function saveAddressFor(userId: bigint, raw: Record<string, unknown>) {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const id = text(raw.id)
  return mutateAddresses(userId, current => {
    const existing = current.find(item => item.id === id)
    if (id && !existing) return null
    // O principal só deixa de ser principal quando outro é escolhido.
    return saveAddress(current, { id: id || 'novo', primary: raw.primary === true || existing?.primary === true, street: text(raw.street), number: text(raw.number), complement: text(raw.complement), reference: text(raw.reference), neighborhood: text(raw.neighborhood) })
  })
}

export const removeAddressFor = (userId: bigint, id: unknown) =>
  mutateAddresses(userId, current => (current.some(item => item.id === id) ? removeAddress(current, id as string) : null))
