import type { CartItem, Order, PaymentMethod } from './mock-data'

export type SavedAddress = Order['address'] & { id: string; primary: boolean }
export type AccessRequest = { id: string; contact: string; reason: string; createdAt: string; resolved: boolean; resolvedAt?: string }
export type CustomerSession = {
  cart: CartItem[]
  storeId: string | null
  note: string
  payment: PaymentMethod
  change: string
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
    cart: [], storeId: null, note: '', payment: 'PIX', change: '',
    address: { street: '', number: '', neighborhood: 'Centro', complement: '', reference: '' },
    addresses: [], phone: '', name: '', email: '', signedIn: false, requestId: '',
  }
}

export function saveAddress(addresses: SavedAddress[], address: SavedAddress): SavedAddress[] {
  if (!address.street.trim() || !address.number.trim() || address.neighborhood !== 'Centro') {
    throw new Error('Informe rua, número e bairro Centro para salvar o endereço.')
  }
  if (address.street.length > 180 || address.number.length > 20 || (address.complement?.length ?? 0) > 100 || (address.reference?.length ?? 0) > 255) {
    throw new Error('Revise o tamanho dos campos do endereço.')
  }
  const next = addresses.filter(item => item.id !== address.id)
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
  if (!Array.isArray(candidate.cart) || !Array.isArray(candidate.addresses) || !candidate.address ||
    !['PIX', 'DINHEIRO'].includes(candidate.payment ?? '') ||
    ['note', 'change', 'phone', 'name', 'email', 'requestId'].some(key => typeof candidate[key as keyof CustomerSession] !== 'string') ||
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
