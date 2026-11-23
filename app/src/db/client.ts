import { PrismaClient } from '@prisma/client'

// Uma única instância por processo (evita esgotar conexões no modo de desenvolvimento).
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient = globalParaPrisma.prisma ?? new PrismaClient({ errorFormat: 'minimal' })

if (process.env.NODE_ENV !== 'production') globalParaPrisma.prisma = prisma
