import { describe, expect, it } from 'vitest'
import { acoesDisponiveis, aplicarAcaoBatedeira, ErroBatedeira } from './batedeira-status'

const ok = { operadorAtivo: true, bairroAtendido: true, produtoDisponivel: true, horarioCadastrado: true }

describe('estados da batedeira', () => {
  it('ativa quando os requisitos estão atendidos, sem exigir motivo', () => {
    expect(aplicarAcaoBatedeira('EM_ANALISE', 'ATIVAR', null, ok)).toEqual({ para: 'ATIVA', motivo: null, auditoria: 'BATEDEIRA_ATIVADA' })
  })
  it('recusa ativar com requisito pendente e lista o que falta', () => {
    expect(() => aplicarAcaoBatedeira('EM_ANALISE', 'ATIVAR', null, { ...ok, produtoDisponivel: false })).toThrow(/produto/)
  })
  it('suspender, reativar e desativar exigem motivo', () => {
    expect(() => aplicarAcaoBatedeira('ATIVA', 'SUSPENDER', ' ', ok)).toThrow(ErroBatedeira)
    expect(aplicarAcaoBatedeira('ATIVA', 'SUSPENDER', 'Reclamações', ok).para).toBe('SUSPENSA')
    expect(aplicarAcaoBatedeira('SUSPENSA', 'REATIVAR', 'Resolvido', ok).para).toBe('ATIVA')
    expect(() => aplicarAcaoBatedeira('SUSPENSA', 'DESATIVAR', '', ok)).toThrow(ErroBatedeira)
  })
  it('só permite ações coerentes com o estado e DESATIVADA é terminal', () => {
    expect(() => aplicarAcaoBatedeira('ATIVA', 'ATIVAR', null, ok)).toThrow(ErroBatedeira)
    expect(() => aplicarAcaoBatedeira('EM_ANALISE', 'SUSPENDER', 'x', ok)).toThrow(ErroBatedeira)
    expect(acoesDisponiveis('DESATIVADA')).toEqual([])
    expect(acoesDisponiveis('ATIVA').map(a => a.acao)).toEqual(['SUSPENDER', 'DESATIVAR'])
  })
})
