// Cria um administrador no banco com senha aleatória (exibida uma única vez). Administradores nunca se cadastram pelo site.
//   pnpm acesso:criar <email> ["<Nome>"]
// Exige DATABASE_URL e SESSION_SECRET no ambiente e o banco migrado (pnpm db:migrar).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }

const { randomBytes } = await import('node:crypto')
const { hashPassword } = await import('../lib/auth.ts')
const { createAdmin } = await import('../lib/accounts.ts')
const { db } = await import('../lib/db.ts')

const [email, name] = process.argv.slice(2)
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: pnpm acesso:criar <email> ["<Nome>"]')
  process.exit(1)
}
try {
  const password = randomBytes(15).toString('base64url')
  const created = await createAdmin({ email, name: name || 'Administrador', passwordHash: hashPassword(password) })
  if (!created) { console.error('Já existe uma conta com este e-mail.'); process.exitCode = 1 }
  else console.log(`Administrador criado: ${email.toLowerCase()}\nSenha (exibida só desta vez): ${password}`)
} finally {
  await db.$disconnect()
}
