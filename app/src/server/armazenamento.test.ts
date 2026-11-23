import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { armazenamentoLocal } from './armazenamento'

let pasta: string
beforeAll(async () => { pasta = await mkdtemp(path.join(tmpdir(), 'acai-arm-')) })
afterAll(async () => { await rm(pasta, { recursive: true, force: true }) })

it('grava, lê e remove só arquivos com nome gerado pelo sistema', async () => {
  const a = armazenamentoLocal(pasta)
  const nome = `${'b'.repeat(32)}.webp`
  await a.salvar(nome, Buffer.from('x'))
  expect((await a.ler(nome))?.toString()).toBe('x')
  await a.remover(nome)
  expect(await a.ler(nome)).toBeNull()
  for (const ruim of ['../segredo.webp', '/etc/passwd', 'a.webp', `${'b'.repeat(32)}.svg`]) {
    await expect(a.salvar(ruim, Buffer.from('x'))).rejects.toThrow()
    await expect(a.ler(ruim)).rejects.toThrow()
  }
})

it('não sobrescreve um arquivo existente', async () => {
  const a = armazenamentoLocal(pasta)
  const nome = `${'c'.repeat(32)}.webp`
  await a.salvar(nome, Buffer.from('1'))
  await expect(a.salvar(nome, Buffer.from('2'))).rejects.toThrow()
})
