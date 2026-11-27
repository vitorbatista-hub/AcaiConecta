// Regras puras da área "Minha conta" (DEC-063), sem banco.
import { isOfficialNeighborhood } from './neighborhoods.ts'
import type { Role } from './auth.ts'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const clean = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '')
const digits = (value: unknown) => clean(value).replace(/\D/g, '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type PersonalInput = { name: string; phone: string }
/** Telefone obrigatório para cliente e batedeira; opcional para o administrador. */
export function validatePersonal(raw: Record<string, unknown>, role: Role): Result<PersonalInput> {
  const name = clean(raw.name)
  const phone = digits(raw.phone)
  if (name.length < 2 || name.length > 150) return fail('Informe o nome (de 2 a 150 caracteres).')
  const emptyAllowed = role === 'admin' && !clean(raw.phone)
  if (!emptyAllowed && !/^\d{10,11}$/.test(phone)) return fail('Informe o telefone com DDD.')
  return { ok: true, data: { name, phone } }
}

export function validateEmailChange(raw: Record<string, unknown>): Result<{ email: string; currentPassword: string }> {
  const email = clean(raw.email).toLowerCase()
  const currentPassword = typeof raw.currentPassword === 'string' ? raw.currentPassword : ''
  if (email.length > 254 || !EMAIL.test(email)) return fail('Informe um e-mail válido.')
  if (!currentPassword || currentPassword.length > 200) return fail('Informe a senha atual.')
  return { ok: true, data: { email, currentPassword } }
}

export function validatePasswordChange(raw: Record<string, unknown>): Result<{ currentPassword: string; newPassword: string }> {
  const currentPassword = typeof raw.currentPassword === 'string' ? raw.currentPassword : ''
  const newPassword = typeof raw.newPassword === 'string' ? raw.newPassword : ''
  if (!currentPassword || currentPassword.length > 200) return fail('Informe a senha atual.')
  if (newPassword.length < 8 || newPassword.length > 200) return fail('A nova senha deve ter de 8 a 200 caracteres.')
  if (newPassword === currentPassword) return fail('A nova senha deve ser diferente da atual.')
  return { ok: true, data: { currentPassword, newPassword } }
}

export type StoreProfileInput = { name: string; description: string; phone: string; address: string; neighborhood: string; reference: string }
/** Cadastro da batedeira editável pelo responsável. O CPF/CNPJ não é editável. */
export function validateStoreProfile(raw: Record<string, unknown>): Result<StoreProfileInput> {
  const name = clean(raw.name)
  const description = typeof raw.description === 'string' ? raw.description.trim() : ''
  const phone = digits(raw.phone)
  const address = clean(raw.address)
  const neighborhood = clean(raw.neighborhood)
  const reference = clean(raw.reference)
  if (name.length < 2 || name.length > 150) return fail('Informe o nome da batedeira (de 2 a 150 caracteres).')
  if (description.length > 500) return fail('A descrição deve ter até 500 caracteres.')
  if (clean(raw.phone) && !/^\d{10,11}$/.test(phone)) return fail('Informe o telefone de atendimento com DDD.')
  if (address.length < 5 || address.length > 180) return fail('Informe o endereço da batedeira (rua e número).')
  if (!isOfficialNeighborhood(neighborhood)) return fail('Escolha o bairro da batedeira na lista de bairros da zona urbana de Cametá.')
  if (reference.length > 255) return fail('O ponto de referência deve ter até 255 caracteres.')
  return { ok: true, data: { name, description, phone, address, neighborhood, reference } }
}
