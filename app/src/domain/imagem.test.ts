import { describe, expect, it } from 'vitest'
import { ErroImagem, idDaUrlLocal, NOME_ARQUIVO, urlMiniatura, urlPrincipal, validarTamanho } from './imagem'

const ID = 'a'.repeat(32)

describe('imagem', () => {
  it('reconhece só URLs geradas pelo sistema e deriva a miniatura', () => {
    expect(idDaUrlLocal(urlPrincipal(ID))).toBe(ID)
    expect(urlMiniatura(urlPrincipal(ID))).toBe(`/api/imagens/${ID}-m.webp`)
    for (const ruim of ['https://x.com/a.webp', '/api/imagens/../../etc/passwd', `/api/imagens/${ID}.png`, '/api/imagens/abc.webp', null, undefined]) {
      expect(idDaUrlLocal(ruim)).toBeNull()
    }
    expect(urlMiniatura('https://x.com/a.webp')).toBe('https://x.com/a.webp')
  })
  it('só aceita nomes de arquivo no formato gerado', () => {
    expect(NOME_ARQUIVO.test(`${ID}.webp`)).toBe(true)
    expect(NOME_ARQUIVO.test(`${ID}-m.webp`)).toBe(true)
    for (const ruim of ['../x.webp', `${ID}.webp/../a`, `${'A'.repeat(32)}.webp`, `${ID}.svg`, `${ID}.webp\n`]) expect(NOME_ARQUIVO.test(ruim)).toBe(false)
  })
  it('valida o tamanho', () => {
    expect(() => validarTamanho(0)).toThrow(ErroImagem)
    expect(() => validarTamanho(5 * 1024 * 1024 + 1)).toThrow(/5 MB/)
    expect(() => validarTamanho(1000)).not.toThrow()
  })
})
