import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

// Requer o MySQL local migrado (pnpm db:subir && pnpm db:migrar).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }
const { db } = await import('../../lib/db.ts')
const { cleanTestData } = await import('./helpers.mjs')
const { createAdmin } = await import('../../lib/accounts.ts')
const { getSupportEmail, setSupportEmail } = await import('../../lib/support.ts')
const { catalogFor } = await import('../../lib/catalog.ts')
const { adminMetrics } = await import('../../lib/metrics.ts')

let adminId, previous
before(async () => {
  await cleanTestData(db)
  previous = await db.configuracoes_plataforma.findUnique({ where: { id: 1 } })
  adminId = (await createAdmin({ email: `teste-suporte-${Date.now()}@exemplo.com`, name: 'Adm', passwordHash: 'h' })).id
})
// A configuração é única no banco local: devolve o que havia antes do teste.
after(async () => {
  await db.configuracoes_plataforma.deleteMany()
  if (previous) await db.configuracoes_plataforma.create({ data: previous })
  await cleanTestData(db); await db.$disconnect()
})

test('salvar, repetir e remover o contato, com uma auditoria por mudança', async () => {
  await db.configuracoes_plataforma.deleteMany()
  assert.equal(await getSupportEmail(), '')
  assert.deepEqual(await setSupportEmail(adminId, { email: 'ajuda@exemplo.com' }), { ok: true })
  assert.deepEqual(await setSupportEmail(adminId, { email: 'ajuda@exemplo.com' }), { ok: true })
  assert.equal(await getSupportEmail(), 'ajuda@exemplo.com')
  assert.equal((await setSupportEmail(adminId, { email: 'x' })).status, 400)
  await setSupportEmail(adminId, { email: '' })
  assert.equal(await getSupportEmail(), '')
  assert.equal(await db.eventos_auditoria.count({ where: { usuario_id: adminId } }), 2)
  const audit = (await catalogFor(adminId, 'admin')).audit.filter(e => e.action === 'Contato de suporte atualizado')
  assert.equal(audit.at(-1).entityId, 'Plataforma')
})

test('as métricas são calculadas sobre os pedidos do banco', async () => {
  assert.equal((await adminMetrics()).sent, await db.pedidos.count())
})
