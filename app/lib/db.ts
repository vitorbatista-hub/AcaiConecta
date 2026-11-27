// Acesso ao banco (ADR-006). Somente no servidor: nunca importar em componentes de cliente.
// DATABASE_URL vem do ambiente; nada de credenciais no código.
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/prisma/client.ts'

const globalForDb = globalThis as unknown as { acaiPrisma?: PrismaClient }

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL ausente. Veja .env.example e rode pnpm db:subir.')
  return new PrismaClient({ adapter: new PrismaMariaDb(url) })
}

// Uma única instância por processo (também em desenvolvimento, com recarga a quente).
export const db: PrismaClient = globalForDb.acaiPrisma ?? (globalForDb.acaiPrisma = createClient())
