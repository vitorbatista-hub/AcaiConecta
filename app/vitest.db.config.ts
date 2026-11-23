import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Testes que exigem o MySQL local (`pnpm db:up && pnpm db:migrate`).
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.db.test.ts'], environment: 'node', fileParallelism: false, testTimeout: 20000 },
})
