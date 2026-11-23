import type { StatusBatedeira } from './disponibilidade'

/** Estados administrativos da batedeira (PRD §10.1, US-05, flows.md). `DESATIVADA` é terminal: fora da plataforma. */
export type AcaoBatedeira = 'ATIVAR' | 'SUSPENDER' | 'REATIVAR' | 'DESATIVAR'

const TRANSICOES: Readonly<Record<AcaoBatedeira, { de: readonly StatusBatedeira[]; para: StatusBatedeira; motivo: boolean; auditoria: string }>> = {
  ATIVAR: { de: ['EM_ANALISE'], para: 'ATIVA', motivo: false, auditoria: 'BATEDEIRA_ATIVADA' },
  SUSPENDER: { de: ['ATIVA'], para: 'SUSPENSA', motivo: true, auditoria: 'BATEDEIRA_SUSPENSA' },
  REATIVAR: { de: ['SUSPENSA'], para: 'ATIVA', motivo: true, auditoria: 'BATEDEIRA_REATIVADA' },
  DESATIVAR: { de: ['EM_ANALISE', 'ATIVA', 'SUSPENSA'], para: 'DESATIVADA', motivo: true, auditoria: 'BATEDEIRA_DESATIVADA' },
}

export class ErroBatedeira extends Error {
  override readonly name = 'ErroBatedeira'
}

export type RequisitosAtivacao = {
  operadorAtivo: boolean
  bairroAtendido: boolean
  produtoDisponivel: boolean
  horarioCadastrado: boolean
}

export const ROTULO_REQUISITO: Readonly<Record<keyof RequisitosAtivacao, string>> = {
  operadorAtivo: 'Operador responsável com conta ativa',
  bairroAtendido: 'Ao menos um bairro habilitado atendido, com taxa definida',
  produtoDisponivel: 'Ao menos um produto ativo e disponível',
  horarioCadastrado: 'Ao menos um horário regular ativo',
}

export function requisitosPendentes(r: RequisitosAtivacao): string[] {
  return (Object.keys(ROTULO_REQUISITO) as (keyof RequisitosAtivacao)[]).filter(k => !r[k]).map(k => ROTULO_REQUISITO[k])
}

/** Valida a ação e devolve o novo estado, o motivo normalizado e o código de auditoria. */
export function aplicarAcaoBatedeira(
  atual: StatusBatedeira,
  acao: AcaoBatedeira,
  motivo: string | null | undefined,
  requisitos: RequisitosAtivacao,
): { para: StatusBatedeira; motivo: string | null; auditoria: string } {
  const t = TRANSICOES[acao]
  if (!t.de.includes(atual)) throw new ErroBatedeira('Essa ação não é permitida no estado atual da batedeira.')
  const texto = motivo?.trim() ?? ''
  if (t.motivo && !texto) throw new ErroBatedeira('Informe o motivo.')
  if (texto.length > 255) throw new ErroBatedeira('O motivo deve ter no máximo 255 caracteres.')
  if (acao === 'ATIVAR' || acao === 'REATIVAR') {
    const faltam = requisitosPendentes(requisitos)
    if (faltam.length > 0) throw new ErroBatedeira(`Requisitos pendentes: ${faltam.join('; ')}.`)
  }
  return { para: t.para, motivo: texto || null, auditoria: t.auditoria }
}

export function acoesDisponiveis(atual: StatusBatedeira): { acao: AcaoBatedeira; motivo: boolean }[] {
  return (Object.keys(TRANSICOES) as AcaoBatedeira[])
    .filter(a => TRANSICOES[a].de.includes(atual))
    .map(acao => ({ acao, motivo: TRANSICOES[acao].motivo }))
}
