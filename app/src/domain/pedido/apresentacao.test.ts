import { describe, expect, it } from 'vitest'
import { descreverEvento, etapaDoStatus, textoEstimativa, textoProximaAbertura } from './apresentacao'

describe('apresentação do pedido', () => {
  it('etapas só existem no caminho de sucesso', () => {
    expect(etapaDoStatus('AGUARDANDO_ACEITE')).toBe(0)
    expect(etapaDoStatus('ENTREGUE')).toBe(5)
    expect(etapaDoStatus('RECUSADO')).toBeNull()
    expect(etapaDoStatus('FALHA_NA_ENTREGA')).toBeNull()
  })
  it('descreve próxima abertura e estimativa', () => {
    expect(textoProximaAbertura({ diasAFrente: 0, diaSemana: 1, abertura: '09:00' })).toBe('hoje às 09:00')
    expect(textoProximaAbertura({ diasAFrente: 1, diaSemana: 2, abertura: '09:00' })).toBe('amanhã às 09:00')
    expect(textoProximaAbertura({ diasAFrente: 3, diaSemana: 4, abertura: '08:30' })).toBe('quinta-feira às 08:30')
    expect(textoEstimativa(25, 35)).toBe('25 a 35 min')
    expect(textoEstimativa(30, 30)).toBe('30 min')
  })
  it('linha do tempo mostra o motivo da recusa', () => {
    expect(descreverEvento({ tipo: 'PEDIDO_RECUSADO', statusNovo: 'RECUSADO', motivo: 'Produto indisponível', mensagem: null })).toEqual({
      titulo: 'Recusado',
      detalhe: 'Motivo: Produto indisponível',
    })
    expect(descreverEvento({ tipo: 'MENSAGEM_OPERACIONAL', statusNovo: null, motivo: null, mensagem: 'O entregador chegou.' }).detalhe).toBe('O entregador chegou.')
  })
})
