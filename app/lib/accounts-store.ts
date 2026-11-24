// Cadastro de contas (clientes e batedeiras) em arquivo JSON no servidor. Só roda no servidor.
// Limitação assumida: é um armazenamento simples, de uma instância; em contêiner ele não é durável. Troque por banco de dados.
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type UserAccount = {
  id: string
  role: 'cliente' | 'operador'
  email: string
  name: string
  phone: string
  hash: string
  createdAt: string
  resetTokenHash?: string
  resetExpiresAt?: number
  address?: { street: string; number: string; complement: string; reference: string; neighborhood: 'Centro' }
  store?: { id: string; name: string; address: string; neighborhood: 'Centro'; document: string; documentKind: 'CPF' | 'CNPJ' }
}

const file = () => path.resolve(/* turbopackIgnore: true */ process.env.ACCOUNTS_FILE ?? path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'accounts.json'))
let queue: Promise<unknown> = Promise.resolve()
const locked = <T>(task: () => Promise<T>): Promise<T> => { const run = queue.then(task, task); queue = run.catch(() => undefined); return run }

async function load(): Promise<UserAccount[]> {
  try {
    const data = JSON.parse(await readFile(/* turbopackIgnore: true */ file(), 'utf8')) as unknown
    return Array.isArray(data) ? (data as UserAccount[]) : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function save(accounts: UserAccount[]) {
  const target = file()
  await mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.tmp`
  await writeFile(temp, JSON.stringify(accounts, null, 2), { mode: 0o600 })
  await rename(temp, target)
}

export const findUser = async (email: string) => (await load()).find(user => user.email === email.trim().toLowerCase())
export const listOperators = async () => (await load()).filter(user => user.role === 'operador')

/** Cria a conta se o e-mail ainda não existir (inclusive entre as contas fixas passadas em `reserved`). */
export function createUser(input: Omit<UserAccount, 'id' | 'createdAt'>, reserved: string[] = []): Promise<UserAccount | null> {
  return locked(async () => {
    const accounts = await load()
    const email = input.email.trim().toLowerCase()
    if (reserved.includes(email) || accounts.some(user => user.email === email)) return null
    const user: UserAccount = { ...input, email, id: randomUUID(), createdAt: new Date().toISOString() }
    await save([...accounts, user])
    return user
  })
}

const RESET_TTL_MS = 30 * 60 * 1000
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

/** Gera um token de redefinição (guardado só como hash, válido por 30 min, um por conta). Devolve null se o e-mail não existir. */
export function createResetToken(email: string, now = Date.now()): Promise<{ token: string; name: string } | null> {
  return locked(async () => {
    const accounts = await load()
    const user = accounts.find(item => item.email === email.trim().toLowerCase())
    if (!user) return null
    const token = randomBytes(32).toString('base64url')
    user.resetTokenHash = sha256(token)
    user.resetExpiresAt = now + RESET_TTL_MS
    await save(accounts)
    return { token, name: user.name }
  })
}

/** Troca a senha se o token for válido e não expirado; o token é de uso único. */
export function consumeResetToken(token: string, newHash: string, now = Date.now()): Promise<boolean> {
  return locked(async () => {
    const accounts = await load()
    const hashed = sha256(token)
    const user = accounts.find(item => item.resetTokenHash === hashed && (item.resetExpiresAt ?? 0) > now)
    if (!user) return false
    user.hash = newHash
    delete user.resetTokenHash
    delete user.resetExpiresAt
    await save(accounts)
    return true
  })
}
