import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

// ADR-006: database/schema.sql é a estrutura completa e atual; as migrações são incrementais.
// A equivalência estrutural (tabelas, colunas, restrições e índices) é conferida contra o banco real em tests/db/schema.test.mjs.
const raiz = new URL('../prisma/migrations/', import.meta.url)
const schema = readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8')
const migracoes = readdirSync(raiz, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()

test('as migrações seguem a numeração sequencial e têm SQL', () => {
  assert.deepEqual(migracoes.map(n => Number(n.slice(0, 4))), migracoes.map((_, i) => i + 1))
  for (const nome of migracoes) assert.ok(readFileSync(new URL(`${nome}/migration.sql`, raiz), 'utf8').trim().length > 0, nome)
})

test('o schema.sql tem as 18 tabelas esperadas e nenhuma migração apaga dados', () => {
  const tabelas = [...schema.matchAll(/CREATE TABLE (\w+)/g)].map(m => m[1])
  assert.equal(tabelas.length, 18)
  for (const nome of migracoes) assert.doesNotMatch(readFileSync(new URL(`${nome}/migration.sql`, raiz), 'utf8'), /\b(DROP\s+(TABLE|DATABASE|COLUMN)|TRUNCATE|DELETE\s+FROM)\b/i, `${nome} é destrutiva`)
})
