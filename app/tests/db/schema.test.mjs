import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }

// Requer o MySQL local (pnpm db:subir && pnpm db:migrar) e DATABASE_URL no ambiente.
const { db } = await import('../../lib/db.ts')
after(() => db.$disconnect())

const schema = readFileSync(new URL('../../../database/schema.sql', import.meta.url), 'utf8')
const esperadas = [...schema.matchAll(/CREATE TABLE (\w+)/g)].map(m => m[1]).sort()

test('o banco migrado tem exatamente as tabelas do schema.sql', async () => {
  const linhas = await db.$queryRaw`SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> '_prisma_migrations'`
  assert.deepEqual(linhas.map(l => l.nome).sort(), esperadas)
})

test('as migrações estão registradas e aplicadas', async () => {
  const linhas = await db.$queryRaw`SELECT migration_name AS nome, finished_at AS fim FROM _prisma_migrations ORDER BY migration_name`
  assert.deepEqual(linhas.map(l => l.nome), ['0001_schema_inicial', '0002_redefinicoes_senha', '0003_pedidos_telefone'])
  assert.ok(linhas.every(l => l.fim))
})

test('as restrições CHECK do schema estão ativas (documento da batedeira)', async () => {
  const rows = await db.$queryRaw`SELECT CONSTRAINT_NAME AS nome FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'ck_batedeiras_documento'`
  assert.equal(rows.length, 1)
})

test('o semeador cria os 13 bairros oficiais e é idempotente', async () => {
  const { officialNeighborhoods } = await import('../../lib/neighborhoods.ts')
  for (let rodada = 0; rodada < 2; rodada++) {
    for (const { name, alternative } of officialNeighborhoods) {
      await db.bairros.upsert({ where: { nome: name }, create: { nome: name, nome_alternativo: alternative ?? null }, update: { nome_alternativo: alternative ?? null } })
    }
  }
  assert.equal(await db.bairros.count(), 13)
  const centro = await db.bairros.findUnique({ where: { nome: 'Centro' } })
  assert.equal(centro?.nome_alternativo, 'São João Batista')
})

// Estrutura do schema.sql (tabela -> colunas, CHECKs e índices) comparada com o banco criado pelas migrações.
function parseSchema() {
  const tabelas = {}; const indices = new Set()
  for (const m of schema.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\) ENGINE/g)) {
    const colunas = []; const checks = []
    for (const linha of m[2].split('\n')) {
      const c = linha.match(/^    (\w+) [A-Z]/)
      if (c && !/^(CONSTRAINT|PRIMARY|UNIQUE|INDEX|KEY|FOREIGN)$/.test(c[1])) colunas.push(c[1])
      const k = linha.match(/CONSTRAINT (ck_\w+) CHECK/)
      if (k) checks.push(k[1])
    }
    tabelas[m[1]] = { colunas: colunas.sort(), checks: checks.sort() }
  }
  for (const m of schema.matchAll(/CREATE INDEX (\w+)/g)) indices.add(m[1])
  return { tabelas, indices }
}

test('colunas, restrições CHECK e índices do banco migrado equivalem ao schema.sql', async () => {
  const { tabelas, indices } = parseSchema()
  const cols = await db.$queryRaw`SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> '_prisma_migrations'`
  const checks = await db.$queryRaw`SELECT TABLE_NAME AS t, CONSTRAINT_NAME AS c FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'`
  const idx = await db.$queryRaw`SELECT DISTINCT INDEX_NAME AS i FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME LIKE 'idx\\_%'`
  for (const [tabela, esperado] of Object.entries(tabelas)) {
    assert.deepEqual(cols.filter(r => r.t === tabela).map(r => r.c).sort(), esperado.colunas, `colunas de ${tabela}`)
    assert.deepEqual(checks.filter(r => r.t === tabela).map(r => r.c).sort(), esperado.checks, `CHECKs de ${tabela}`)
  }
  assert.deepEqual(idx.map(r => r.i).sort(), [...indices].sort())
})
