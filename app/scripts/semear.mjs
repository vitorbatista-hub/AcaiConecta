// Semeia os dados de referência (13 bairros urbanos, DEC-057). Idempotente: pode rodar várias vezes.
// Uso: pnpm db:semear (exige DATABASE_URL e o banco migrado).
try { process.loadEnvFile('.env') } catch { /* sem .env: usa o ambiente */ }

const { officialNeighborhoods } = await import('../lib/neighborhoods.ts')
const { db } = await import('../lib/db.ts')

try {
  for (const { name, alternative } of officialNeighborhoods) {
    await db.bairros.upsert({
      where: { nome: name },
      create: { nome: name, nome_alternativo: alternative ?? null },
      update: { nome_alternativo: alternative ?? null },
    })
  }
  console.log(`${officialNeighborhoods.length} bairros semeados.`)
} finally {
  await db.$disconnect()
}
