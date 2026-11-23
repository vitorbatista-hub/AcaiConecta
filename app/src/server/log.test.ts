import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { log } from './log'

let saida: string[]
let erros: string[]
beforeEach(() => {
  saida = []
  erros = []
  vi.stubEnv('LOG_LEVEL', 'info')
  vi.spyOn(process.stdout, 'write').mockImplementation(((c: string) => (saida.push(String(c)), true)) as never)
  vi.spyOn(process.stderr, 'write').mockImplementation(((c: string) => (erros.push(String(c)), true)) as never)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

describe('log estruturado', () => {
  it('escreve uma linha JSON com tempo, nível, evento e o pedido, sem campos sensíveis', async () => {
    await log.info('pedido_criado', { pedido: 'AC-ABCDEFGH', totalCentavos: 3200, email: 'a@b.c', senha: 'x', batedeira: 7n })
    expect(saida).toHaveLength(1)
    const linha = JSON.parse(saida[0] as string)
    expect(linha).toMatchObject({ nivel: 'info', evento: 'pedido_criado', pedido: 'AC-ABCDEFGH', totalCentavos: 3200, batedeira: '7', email: '[omitido]', senha: '[omitido]' })
    expect(typeof linha.ts).toBe('string')
    expect(saida[0]).not.toContain('a@b.c')
  })

  it('avisos e erros vão para stderr; debug é filtrado no nível info', async () => {
    await log.warn('login_recusado', { motivo: 'invalido' })
    await log.error('erro_servidor', { erro: new Error('segredo no texto') })
    await log.debug('detalhe')
    expect(erros).toHaveLength(2)
    expect(saida).toHaveLength(0)
    expect(erros.join('')).not.toContain('segredo no texto')
  })

  it('fica em silêncio com LOG_LEVEL=silent e nunca lança', async () => {
    vi.stubEnv('LOG_LEVEL', 'silent')
    await expect(log.error('x')).resolves.toBeUndefined()
    expect(erros).toHaveLength(0)
  })
})
