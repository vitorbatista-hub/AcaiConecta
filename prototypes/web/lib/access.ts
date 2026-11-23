import type { Store } from './mock-data'

// Conta de teste do administrador do piloto; operadores entram com o e-mail cadastrado na batedeira.
export const adminLoginEmail = 'admin@acaiconecta.demo'
export const roleSessionKeys = {
  operatorSignedIn: 'acaiconecta-operator-signed-in',
  operatorStore: 'acaiconecta-operator-store',
  adminSignedIn: 'acaiconecta-admin-signed-in',
  adminEmail: 'acaiconecta-admin-email',
} as const

export type AccessTarget = { role: 'cliente' } | { role: 'operador'; storeId: string } | { role: 'admin' }

// O perfil é definido pelo cadastro vinculado ao e-mail, não por uma escolha na tela.
export function resolveAccess(email: string, stores: Pick<Store, 'id' | 'operatorEmail'>[]): AccessTarget {
  const normalized = email.trim().toLowerCase()
  if (normalized === adminLoginEmail) return { role: 'admin' }
  const store = stores.find(s => s.operatorEmail.trim().toLowerCase() === normalized)
  return store ? { role: 'operador', storeId: store.id } : { role: 'cliente' }
}

export function startRoleSession(target: AccessTarget, email: string) {
  try {
    if (target.role === 'operador') {
      sessionStorage.setItem(roleSessionKeys.operatorStore, target.storeId)
      sessionStorage.setItem(roleSessionKeys.operatorSignedIn, '1')
    } else if (target.role === 'admin') {
      sessionStorage.setItem(roleSessionKeys.adminEmail, email.trim())
      sessionStorage.setItem(roleSessionKeys.adminSignedIn, '1')
    }
  } catch { /* sem armazenamento, a sessão não é mantida */ }
}
