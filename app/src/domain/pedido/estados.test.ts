import { describe, expect, it } from 'vitest'
import { type Ator, ErroTransicao, ESTADOS_FINAIS, proximosEstadosPermitidos, STATUS_PEDIDO, type StatusPedido, validarTransicao } from './estados'

const criado = new Date('2026-11-23T15:00:00Z')
const expira = new Date('2026-11-23T15:05:00Z')
const dentro = new Date('2026-11-23T15:02:00Z')
const depois = new Date('2026-11-23T15:05:00Z')

const cliente: Ator = { tipo: 'USUARIO', papel: 'CLIENTE', usuarioId: 1n }
const outroCliente: Ator = { tipo: 'USUARIO', papel: 'CLIENTE', usuarioId: 2n }
const operador: Ator = { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: 10n, batedeiraId: 100n }
const operadorAlheio: Ator = { tipo: 'USUARIO', papel: 'OPERADOR', usuarioId: 11n, batedeiraId: 101n }
const admin: Ator = { tipo: 'USUARIO', papel: 'ADMINISTRADOR', usuarioId: 99n }
const sistema: Ator = { tipo: 'SISTEMA', processo: 'expiracao' }

const pedido = (status: StatusPedido) => ({ status, clienteId: 1n, batedeiraId: 100n, expiraAceiteEm: expira })
const codigo = (fn: () => unknown) => {
  try { fn() } catch (e) { return e instanceof ErroTransicao ? e.codigo : 'OUTRO' }
  return 'OK'
}

describe('máquina de estados', () => {
  it('percorre o caminho feliz até a entrega', () => {
    const passos: [StatusPedido, StatusPedido][] = [
      ['AGUARDANDO_ACEITE', 'ACEITO'], ['ACEITO', 'EM_PREPARO'], ['EM_PREPARO', 'PRONTO'],
      ['PRONTO', 'SAIU_PARA_ENTREGA'], ['SAIU_PARA_ENTREGA', 'ENTREGUE'],
    ]
    for (const [de, para] of passos) {
      expect(validarTransicao(pedido(de), para, operador, dentro)).toEqual({ de, para, motivo: null })
    }
  })

  it('rejeita todo salto e todo retrocesso (matriz completa)', () => {
    const permitidas = new Set([
      'AGUARDANDO_ACEITE>ACEITO', 'AGUARDANDO_ACEITE>RECUSADO', 'AGUARDANDO_ACEITE>EXPIRADO', 'AGUARDANDO_ACEITE>CANCELADO',
      'ACEITO>EM_PREPARO', 'ACEITO>CANCELADO', 'EM_PREPARO>PRONTO', 'EM_PREPARO>CANCELADO',
      'PRONTO>SAIU_PARA_ENTREGA', 'PRONTO>CANCELADO', 'SAIU_PARA_ENTREGA>ENTREGUE', 'SAIU_PARA_ENTREGA>FALHA_NA_ENTREGA',
    ])
    for (const de of STATUS_PEDIDO) {
      for (const para of STATUS_PEDIDO) {
        if (permitidas.has(`${de}>${para}`)) continue
        // Um ator com todos os poderes ainda não pode executar transição inexistente.
        for (const ator of [cliente, operador, admin, sistema]) {
          const c = codigo(() => validarTransicao(pedido(de), para, ator, dentro, 'motivo'))
          expect(['ESTADO_FINAL', 'TRANSICAO_INVALIDA'], `${de}>${para}`).toContain(c)
        }
      }
    }
  })

  it('estados finais não admitem nenhuma transição', () => {
    for (const final of ESTADOS_FINAIS) {
      expect(codigo(() => validarTransicao(pedido(final), 'ACEITO', operador, dentro))).toBe('ESTADO_FINAL')
      expect(proximosEstadosPermitidos(final, operador)).toEqual([])
    }
  })

  it('exige motivo em recusa, cancelamento após aceite e falha na entrega', () => {
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'RECUSADO', operador, dentro))).toBe('MOTIVO_OBRIGATORIO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'RECUSADO', operador, dentro, '   '))).toBe('MOTIVO_OBRIGATORIO')
    expect(validarTransicao(pedido('AGUARDANDO_ACEITE'), 'RECUSADO', operador, dentro, 'Produto indisponível').motivo).toBe('Produto indisponível')
    for (const de of ['ACEITO', 'EM_PREPARO', 'PRONTO'] as const) {
      expect(codigo(() => validarTransicao(pedido(de), 'CANCELADO', operador, dentro))).toBe('MOTIVO_OBRIGATORIO')
      expect(codigo(() => validarTransicao(pedido(de), 'CANCELADO', admin, dentro))).toBe('MOTIVO_OBRIGATORIO')
      expect(codigo(() => validarTransicao(pedido(de), 'CANCELADO', admin, dentro, 'Sem insumo'))).toBe('OK')
    }
    expect(codigo(() => validarTransicao(pedido('SAIU_PARA_ENTREGA'), 'FALHA_NA_ENTREGA', operador, dentro))).toBe('MOTIVO_OBRIGATORIO')
    expect(codigo(() => validarTransicao(pedido('SAIU_PARA_ENTREGA'), 'FALHA_NA_ENTREGA', operador, dentro, 'Cliente ausente'))).toBe('OK')
  })

  it('cliente cancela só antes do aceite, sem motivo, e só o próprio pedido', () => {
    expect(validarTransicao(pedido('AGUARDANDO_ACEITE'), 'CANCELADO', cliente, dentro).motivo).toBeNull()
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'CANCELADO', outroCliente, dentro))).toBe('PEDIDO_ALHEIO')
    for (const de of ['ACEITO', 'EM_PREPARO', 'PRONTO'] as const) {
      expect(codigo(() => validarTransicao(pedido(de), 'CANCELADO', cliente, dentro, 'quero cancelar'))).toBe('NAO_AUTORIZADO')
    }
    expect(codigo(() => validarTransicao(pedido('SAIU_PARA_ENTREGA'), 'CANCELADO', cliente, dentro, 'x'))).toBe('TRANSICAO_INVALIDA')
  })

  it('depois de sair para entrega ninguém cancela', () => {
    for (const ator of [cliente, operador, admin]) {
      expect(codigo(() => validarTransicao(pedido('SAIU_PARA_ENTREGA'), 'CANCELADO', ator, dentro, 'x'))).toBe('TRANSICAO_INVALIDA')
    }
  })

  it('operador só age sobre a própria batedeira', () => {
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'ACEITO', operadorAlheio, dentro))).toBe('PEDIDO_ALHEIO')
  })

  it('administrador só cancela após o aceite; não avança nem responde pedidos', () => {
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'ACEITO', admin, dentro))).toBe('NAO_AUTORIZADO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'CANCELADO', admin, dentro, 'x'))).toBe('NAO_AUTORIZADO')
    expect(codigo(() => validarTransicao(pedido('EM_PREPARO'), 'PRONTO', admin, dentro))).toBe('NAO_AUTORIZADO')
  })

  it('o prazo de 5 minutos: no limite o pedido só pode expirar', () => {
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'ACEITO', operador, depois))).toBe('PRAZO_ENCERRADO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'RECUSADO', operador, depois, 'x'))).toBe('PRAZO_ENCERRADO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'CANCELADO', cliente, depois))).toBe('PRAZO_ENCERRADO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'EXPIRADO', sistema, depois))).toBe('OK')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'EXPIRADO', sistema, dentro))).toBe('PRAZO_NAO_ENCERRADO')
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'ACEITO', operador, new Date('2026-11-23T15:04:59.999Z')))).toBe('OK')
  })

  it('só o sistema expira pedidos', () => {
    expect(codigo(() => validarTransicao(pedido('AGUARDANDO_ACEITE'), 'EXPIRADO', operador, depois))).toBe('NAO_AUTORIZADO')
  })

  it('lista os próximos estados por papel', () => {
    expect(proximosEstadosPermitidos('AGUARDANDO_ACEITE', operador).sort()).toEqual(['ACEITO', 'RECUSADO'])
    expect(proximosEstadosPermitidos('AGUARDANDO_ACEITE', cliente)).toEqual(['CANCELADO'])
    expect(proximosEstadosPermitidos('EM_PREPARO', admin)).toEqual(['CANCELADO'])
    expect(proximosEstadosPermitidos('SAIU_PARA_ENTREGA', operador).sort()).toEqual(['ENTREGUE', 'FALHA_NA_ENTREGA'])
  })

  void criado
})
