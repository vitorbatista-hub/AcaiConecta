import { describe, expect, it } from 'vitest'
import { caminhoSemQuery, descreverErro, idRequisicaoValido, redigir } from './log'

describe('redigir', () => {
  it('omite credenciais, dados pessoais e texto livre, em qualquer nível', () => {
    const r = redigir({
      pedido: 'AC-ABCDEFGH', total: 3200, senha: 'x', token: 'y', email: 'a@b.c', telefone: '9199', enderecoSnapshot: 'Rua A',
      motivo: 'texto livre', aninhado: { cookie: 'z', ok: 1 }, lista: [{ authorization: 'Bearer abc', ok: 2 }],
    }) as Record<string, unknown>
    expect(r).toEqual({
      pedido: 'AC-ABCDEFGH', total: 3200, senha: '[omitido]', token: '[omitido]', email: '[omitido]', telefone: '[omitido]',
      enderecoSnapshot: '[omitido]', motivo: '[omitido]', aninhado: { cookie: '[omitido]', ok: 1 }, lista: [{ authorization: '[omitido]', ok: 2 }],
    })
  })
  it('converte bigint e datas, limita texto longo e profundidade', () => {
    expect(redigir(10n)).toBe('10')
    expect(redigir(new Date('2026-11-23T12:00:00Z'))).toBe('2026-11-23T12:00:00.000Z')
    expect((redigir('a'.repeat(500)) as string).length).toBe(201)
    expect(redigir({ a: { b: { c: { d: 1 } } } })).toEqual({ a: { b: { c: '[omitido]' } } })
  })
})

describe('descreverErro', () => {
  it('não inclui a mensagem, que pode conter dados', () => {
    const e = Object.assign(new Error('Unique constraint failed on email=maria@exemplo.com'), { code: 'P2002' })
    const d = descreverErro(e)
    expect(d.tipo).toBe('Error')
    expect(d.codigo).toBe('P2002')
    expect(JSON.stringify(d)).not.toContain('maria@')
  })
  it('usa o código de negócio quando existe e aceita valores que não são Error', () => {
    expect(descreverErro(Object.assign(new Error('x'), { codigo: 'PRAZO_ENCERRADO' })).codigo).toBe('PRAZO_ENCERRADO')
    expect(descreverErro('texto com senha')).toEqual({ tipo: 'string' })
  })
})

describe('requisição', () => {
  it('aceita só identificadores simples, contra injeção de linha de log', () => {
    expect(idRequisicaoValido('7d1f0c2e-5b2a-4c3d-9e8f-1a2b3c4d5e6f')).toBe(true)
    for (const ruim of ['', 'curto', 'a\nb'.padEnd(20, 'x'), 'x'.repeat(65), 'com espaço aqui', null, undefined]) expect(idRequisicaoValido(ruim)).toBe(false)
  })
  it('remove a query do caminho', () => {
    expect(caminhoSemQuery('/entrar?proximo=%2Fadmin&token=abc')).toBe('/entrar')
    expect(caminhoSemQuery('/pedidos/AC-ABCDEFGH')).toBe('/pedidos/AC-ABCDEFGH')
  })
})
