import type { CartItem, Order } from './domain'
import { isOfficialNeighborhood } from './neighborhoods.ts'

export type SavedAddress = Order['address'] & { id: string; primary: boolean }
// DEC-040: one primary and at most one secondary address per customer.
export const maxSavedAddresses = 2
export const savedAddressLimitMessage = 'Você já tem 2 endereços salvos (principal e secundário). Edite ou remova um deles.'
export type AccessRequest = { id: string; contact: string; reason: string; createdAt: string; resolved: boolean; resolvedAt?: string }
export type CustomerSession = {
  cart: CartItem[]
  storeId: string | null
  note: string
  address: Order['address']
  addresses: SavedAddress[]
  phone: string
  name: string
  email: string
  signedIn: boolean
  requestId: string
}

export function emptyCustomerSession(): CustomerSession {
  return {
    cart: [], storeId: null, note: '',
    address: { street: '', number: '', neighborhood: '', complement: '', reference: '' },
    addresses: [], phone: '', name: '', email: '', signedIn: false, requestId: '',
  }
}

export function saveAddress(addresses: SavedAddress[], address: SavedAddress): SavedAddress[] {
  if (!address.street.trim() || !address.number.trim() || !isOfficialNeighborhood(address.neighborhood)) {
    throw new Error('Informe rua, número e um bairro da zona urbana de Cametá para salvar o endereço.')
  }
  if (address.street.length > 180 || address.number.length > 20 || (address.complement?.length ?? 0) > 100 || (address.reference?.length ?? 0) > 255) {
    throw new Error('Revise o tamanho dos campos do endereço.')
  }
  const next = addresses.filter(item => item.id !== address.id)
  if (next.length >= maxSavedAddresses) throw new Error(savedAddressLimitMessage)
  const primary = address.primary || next.length === 0
  return [...next.map(item => ({ ...item, primary: primary ? false : item.primary })), { ...address, primary }]
}

export function removeAddress(addresses: SavedAddress[], id: string): SavedAddress[] {
  const next = addresses.filter(address => address.id !== id)
  if (next.length && !next.some(address => address.primary)) next[0] = { ...next[0], primary: true }
  return next
}

export function restoreCustomerSession(value: unknown): CustomerSession {
  if (!value || typeof value !== 'object') return emptyCustomerSession()
  const candidate = value as Partial<CustomerSession>
  if (!Array.isArray(candidate.cart) || !Array.isArray(candidate.addresses) || candidate.addresses.length > maxSavedAddresses || !candidate.address ||
    ['note', 'phone', 'name', 'email', 'requestId'].some(key => typeof candidate[key as keyof CustomerSession] !== 'string') ||
    typeof candidate.signedIn !== 'boolean' ||
    (candidate.storeId !== null && typeof candidate.storeId !== 'string') ||
    !candidate.cart.every(item => item?.product && typeof item.product.id === 'string' && typeof item.product.name === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isSafeInteger(item.product.priceCents) && Number.isInteger(item.product.volumeMl)) ||
    !['street', 'number', 'neighborhood'].every(key => typeof candidate.address?.[key as keyof Order['address']] === 'string') ||
    !candidate.addresses.every(address => typeof address?.id === 'string' && typeof address.street === 'string' && typeof address.number === 'string' && typeof address.primary === 'boolean')) {
    throw new Error('Sacola anterior inválida. Comece uma nova seleção.')
  }
  const defaults = emptyCustomerSession()
  return Object.fromEntries(Object.keys(defaults).map(key => [key, candidate[key as keyof CustomerSession]])) as CustomerSession
}

/** Dados da conta no servidor: os endereços salvos vêm do banco; o endereço do pedido em andamento só é preenchido se estiver vazio. */
export function sessionPatchFromProfile(profile: { name: string; email: string; phone?: string; addresses?: SavedAddress[] }, current: CustomerSession): Partial<CustomerSession> {
  const addresses = (profile.addresses ?? []).slice(0, maxSavedAddresses)
  const patch: Partial<CustomerSession> = { signedIn: true, name: profile.name, email: profile.email, phone: profile.phone ?? '', addresses }
  const primary = addresses.find(address => address.primary)
  if (primary && !current.address.street) patch.address = { street: primary.street, number: primary.number, neighborhood: primary.neighborhood, complement: primary.complement, reference: primary.reference }
  return patch
}
