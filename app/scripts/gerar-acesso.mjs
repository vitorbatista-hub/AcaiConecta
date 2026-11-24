// Gera uma conta da equipe com senha aleatória (exibida uma única vez) e o trecho para STAFF_ACCOUNTS.
//   node scripts/gerar-acesso.mjs <email> admin
//   node scripts/gerar-acesso.mjs <email> operador <storeId> "<Nome>"
// Nada é gravado em arquivo: copie o trecho JSON para a variável STAFF_ACCOUNTS do ambiente do servidor (nunca para o Git).
import { randomBytes } from 'node:crypto'
import { hashPassword } from '../lib/staff-auth.ts'

const [email, role, storeId, name] = process.argv.slice(2)
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['admin', 'operador'].includes(role) || (role === 'operador' && !storeId)) {
  console.error('Uso: gerar-acesso.mjs <email> admin | gerar-acesso.mjs <email> operador <storeId> "<Nome>"')
  process.exit(1)
}
const password = randomBytes(15).toString('base64url')
const entry = { email: email.toLowerCase(), role, ...(role === 'operador' ? { storeId } : {}), name: name || (role === 'admin' ? 'Administrador' : email), hash: hashPassword(password) }
console.log(`Senha (exibida só desta vez): ${password}`)
console.log(JSON.stringify(entry))
