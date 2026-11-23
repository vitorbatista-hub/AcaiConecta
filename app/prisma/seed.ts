/**
 * Dados FICTÍCIOS de desenvolvimento local. Recusa rodar em produção.
 * As senhas abaixo existem só no banco local do docker-compose.
 */
import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV === 'production') throw new Error('Seed de desenvolvimento não pode rodar em produção.')

const prisma = new PrismaClient()
const SENHA_DEV = 'senha-de-desenvolvimento-1'

async function main() {
  const senhaHash = await hash(SENHA_DEV)
  const centro = await prisma.bairro.upsert({ where: { nome: 'Centro' }, update: { ativo: true }, create: { nome: 'Centro' } })
  await prisma.bairro.upsert({ where: { nome: 'Aldeia' }, update: {}, create: { nome: 'Aldeia', ativo: false } })

  await prisma.usuario.upsert({ where: { email: 'admin@acaiconecta.local' }, update: {}, create: { nome: 'Administrador do piloto', email: 'admin@acaiconecta.local', senhaHash, tipo: 'ADMINISTRADOR' } })
  await prisma.usuario.upsert({ where: { email: 'cliente@acaiconecta.local' }, update: {}, create: { nome: 'Cliente de teste', email: 'cliente@acaiconecta.local', telefone: '91999990000', senhaHash, tipo: 'CLIENTE' } })

  const lojas = [
    { operador: 'joao@acaiconecta.local', nome: 'Açaí do Seu João', endereco: 'Rua das Flores, 42', taxa: 0, min: 25, max: 35, aberta: true },
    { operador: 'maria@acaiconecta.local', nome: 'Açaí Amazônia', endereco: 'Av. Principal, 128', taxa: 300, min: 30, max: 40, aberta: true },
  ]
  for (const l of lojas) {
    const op = await prisma.usuario.upsert({ where: { email: l.operador }, update: {}, create: { nome: `Operador ${l.nome}`, email: l.operador, senhaHash, tipo: 'OPERADOR' } })
    const existente = await prisma.batedeira.findUnique({ where: { responsavelId: op.id } })
    if (existente) continue
    const b = await prisma.batedeira.create({
      data: {
        responsavelId: op.id, nome: l.nome, endereco: l.endereco, bairroId: centro.id, status: 'ATIVA',
        aberta: l.aberta, entregaDisponivel: true, estimativaMinutosMin: l.min, estimativaMinutosMax: l.max,
        horarios: { create: [0, 1, 2, 3, 4, 5, 6].map(d => ({ diaSemana: d, horaAbertura: new Date('1970-01-01T09:00:00Z'), horaFechamento: new Date('1970-01-01T20:00:00Z') })) },
        bairros: { create: { bairroId: centro.id, taxaEntregaCentavos: l.taxa } },
        produtos: { create: [
          { nome: 'Açaí puro 500 ml', descricao: 'Polpa tradicional batida na hora.', unidade: '500 ml', volumeMl: 500, precoCentavos: 1800 },
          { nome: 'Açaí puro 1 litro', descricao: 'Porção para compartilhar.', unidade: '1 L', volumeMl: 1000, precoCentavos: 3200 },
        ] },
      },
    })
    console.log(`Batedeira criada: ${b.nome}`)
  }
  console.log(`Seed concluído. Senha de desenvolvimento dos usuários: ${SENHA_DEV}`)
}

main().finally(() => prisma.$disconnect())
