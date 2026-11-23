import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/db/client'
import { idDaUrlLocal } from '@/domain/imagem'
import { type Cenario, criarCenario, limparCenario } from './fixtures.test-util'
import { enviarFoto, removerFoto } from './fotos'

let c: Cenario
let pasta: string
const foto = () => sharp({ create: { width: 800, height: 600, channels: 3, background: '#639' } }).jpeg().toBuffer()
const arquivos = async () => (await readdir(pasta)).sort()

beforeAll(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), 'acai-fotos-'))
  process.env.ARMAZENAMENTO = 'local'
  process.env.UPLOADS_DIR = pasta
  c = await criarCenario()
})
afterAll(async () => {
  await limparCenario(c)
  await rm(pasta, { recursive: true, force: true })
  delete process.env.ARMAZENAMENTO
  delete process.env.UPLOADS_DIR
  await prisma.$disconnect()
})

describe('fotos da batedeira e dos produtos', () => {
  it('envia, substitui (apagando os arquivos antigos) e remove a foto da batedeira', async () => {
    const { url } = await enviarFoto(c.batedeira.id, { tipo: 'batedeira' }, await foto())
    const id1 = idDaUrlLocal(url)
    expect(id1).not.toBeNull()
    expect((await prisma.batedeira.findUniqueOrThrow({ where: { id: c.batedeira.id } })).imagemUrl).toBe(url)
    expect(await arquivos()).toEqual([`${id1}-m.webp`, `${id1}.webp`])

    const { url: url2 } = await enviarFoto(c.batedeira.id, { tipo: 'batedeira' }, await foto())
    const id2 = idDaUrlLocal(url2)
    expect(id2).not.toBe(id1)
    expect(await arquivos()).toEqual([`${id2}-m.webp`, `${id2}.webp`])

    await removerFoto(c.batedeira.id, { tipo: 'batedeira' })
    expect((await prisma.batedeira.findUniqueOrThrow({ where: { id: c.batedeira.id } })).imagemUrl).toBeNull()
    expect(await arquivos()).toEqual([])
  })

  it('o operador só mexe nos produtos da própria batedeira', async () => {
    await expect(enviarFoto(c.batedeira.id, { tipo: 'produto', produtoId: c.deOutra.id }, await foto())).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' })
    await expect(removerFoto(c.batedeira.id, { tipo: 'produto', produtoId: c.deOutra.id })).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' })
    expect((await prisma.produto.findUniqueOrThrow({ where: { id: c.deOutra.id } })).imagemUrl).toBeNull()
    expect(await arquivos()).toEqual([])
    await enviarFoto(c.batedeira.id, { tipo: 'produto', produtoId: c.litro.id }, await foto())
    expect((await prisma.produto.findUniqueOrThrow({ where: { id: c.litro.id } })).imagemUrl).toMatch(/^\/api\/imagens\/[a-f0-9]{32}\.webp$/)
    await removerFoto(c.batedeira.id, { tipo: 'produto', produtoId: c.litro.id })
  })

  it('arquivo inválido não grava nada nem altera a foto atual', async () => {
    const { url } = await enviarFoto(c.batedeira.id, { tipo: 'batedeira' }, await foto())
    await expect(enviarFoto(c.batedeira.id, { tipo: 'batedeira' }, Buffer.from('<svg onload=alert(1)>'))).rejects.toThrow()
    expect((await prisma.batedeira.findUniqueOrThrow({ where: { id: c.batedeira.id } })).imagemUrl).toBe(url)
    expect(await arquivos()).toHaveLength(2)
    await removerFoto(c.batedeira.id, { tipo: 'batedeira' })
  })

  it('sem armazenamento configurado em produção, o envio fica indisponível', async () => {
    const antes = { arm: process.env.ARMAZENAMENTO, env: process.env.NODE_ENV }
    delete process.env.ARMAZENAMENTO
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    try {
      await expect(enviarFoto(c.batedeira.id, { tipo: 'batedeira' }, await foto())).rejects.toMatchObject({ codigo: 'ARMAZENAMENTO_INDISPONIVEL' })
    } finally {
      process.env.ARMAZENAMENTO = antes.arm
      ;(process.env as Record<string, string | undefined>).NODE_ENV = antes.env
    }
  })
})
