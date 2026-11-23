import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// A migração 0001 é o `database/schema.sql` sem as linhas de criação do banco. Se o schema
// oficial mudar sem nova migração, este teste falha e obriga a registrar a mudança.
describe('migração x schema.sql', () => {
  it('a migração inicial reproduz o schema oficial', () => {
    const oficial = readFileSync(new URL('../../../database/schema.sql', import.meta.url), 'utf8')
    const migracao = readFileSync(new URL('../../prisma/migrations/0001_schema_inicial/migration.sql', import.meta.url), 'utf8')
    const semBanco = oficial.replace(/CREATE DATABASE IF NOT EXISTS acai_conecta[\s\S]*?;\n\nUSE acai_conecta;\n\n/, '')
    expect(migracao).toBe(semBanco)
  })
})
