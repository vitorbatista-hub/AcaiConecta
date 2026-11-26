// Configuração do Prisma (CLI). A URL vem do ambiente: nunca versionar valores reais (ADR-006).
import { defineConfig } from 'prisma/config'

try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
