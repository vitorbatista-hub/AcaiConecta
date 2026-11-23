import { describe, expect, it } from 'vitest'
import { destinoSeguro, papelExigido } from './rotas'

describe('papelExigido', () => {
  it('mapeia áreas protegidas e libera as públicas', () => {
    expect(papelExigido('/admin')).toBe('ADMINISTRADOR')
    expect(papelExigido('/admin/pedidos')).toBe('ADMINISTRADOR')
    expect(papelExigido('/operador')).toBe('OPERADOR')
    expect(papelExigido('/conta')).toBe('CLIENTE')
    expect(papelExigido('/')).toBeNull()
    expect(papelExigido('/administrador-falso')).toBeNull()
    expect(papelExigido('/entrar')).toBeNull()
  })
})

describe('destinoSeguro', () => {
  it('usa a página inicial do papel quando não há destino', () => {
    expect(destinoSeguro(null, 'OPERADOR')).toBe('/operador')
    expect(destinoSeguro('', 'CLIENTE')).toBe('/conta')
  })
  it('recusa destinos externos ou malformados', () => {
    for (const ruim of ['https://x.com', '//x.com', '/\\x.com', 'conta', '/a\nb']) {
      expect(destinoSeguro(ruim, 'CLIENTE')).toBe('/conta')
    }
  })
  it('não leva o usuário a área de outro papel', () => {
    expect(destinoSeguro('/admin', 'CLIENTE')).toBe('/conta')
    expect(destinoSeguro('/pedidos/abc?x=1', 'CLIENTE')).toBe('/pedidos/abc?x=1')
  })
})
