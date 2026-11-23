import { FUSO_PILOTO } from '../disponibilidade'
import { ESTADOS_FINAIS, type StatusPedido } from './estados'

/** Textos e agrupamentos de exibição do pedido para o cliente (PRD §12.2, §15.2). */
export const ROTULO_STATUS: Readonly<Record<StatusPedido, string>> = {
  AGUARDANDO_ACEITE: 'Aguardando resposta',
  ACEITO: 'Aceito',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
  CANCELADO: 'Cancelado',
  FALHA_NA_ENTREGA: 'Falha na entrega',
}

export const DESCRICAO_STATUS: Readonly<Record<StatusPedido, string>> = {
  AGUARDANDO_ACEITE: 'A batedeira tem até 5 minutos para aceitar ou recusar o pedido.',
  ACEITO: 'A batedeira aceitou o pedido e vai começar o preparo.',
  EM_PREPARO: 'Seu açaí está sendo batido.',
  PRONTO: 'O pedido está pronto e vai sair para entrega.',
  SAIU_PARA_ENTREGA: 'O pedido está a caminho. Tenha o pagamento em mãos.',
  ENTREGUE: 'Pedido entregue. Bom proveito!',
  RECUSADO: 'A batedeira não pôde atender este pedido. Nada foi cobrado.',
  EXPIRADO: 'A batedeira não respondeu no prazo. Nada foi cobrado.',
  CANCELADO: 'O pedido foi cancelado. Nada foi cobrado.',
  FALHA_NA_ENTREGA: 'Não foi possível concluir a entrega.',
}

/** Etapas do acompanhamento feliz; estados finais sem sucesso não têm etapa. */
export const ETAPAS = ['AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'] as const

export function etapaDoStatus(status: StatusPedido): number | null {
  const i = (ETAPAS as readonly string[]).indexOf(status)
  return i < 0 ? null : i
}

export const pedidoEncerrado = (status: StatusPedido) => ESTADOS_FINAIS.has(status)

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export function textoProximaAbertura(p: { diasAFrente: number; diaSemana: number; abertura: string }): string {
  const quando = p.diasAFrente === 0 ? 'hoje' : p.diasAFrente === 1 ? 'amanhã' : (DIAS[p.diaSemana] ?? '')
  return `${quando} às ${p.abertura}`
}

export const textoEstimativa = (min: number, max: number) => (min === max ? `${min} min` : `${min} a ${max} min`)

const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO_PILOTO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO_PILOTO, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const horaLocal = (d: Date) => formatoHora.format(d)
export const dataHoraLocal = (d: Date) => formatoDataHora.format(d).replace(',', ' às')

export type EventoParaExibir = {
  tipo: 'PEDIDO_CRIADO' | 'STATUS_ALTERADO' | 'PEDIDO_RECUSADO' | 'PEDIDO_CANCELADO' | 'MENSAGEM_OPERACIONAL' | 'INTERVENCAO_ADMINISTRATIVA'
  statusNovo: StatusPedido | null
  motivo: string | null
  mensagem: string | null
}

/** Linha da linha do tempo mostrada ao cliente, com o motivo quando houver. */
export function descreverEvento(e: EventoParaExibir): { titulo: string; detalhe: string | null } {
  switch (e.tipo) {
    case 'PEDIDO_CRIADO':
      return { titulo: 'Pedido enviado', detalhe: null }
    case 'MENSAGEM_OPERACIONAL':
      return { titulo: 'Mensagem da batedeira', detalhe: e.mensagem }
    case 'INTERVENCAO_ADMINISTRATIVA':
      return { titulo: 'Atendimento do suporte', detalhe: e.mensagem ?? e.motivo }
    default: {
      const titulo = e.statusNovo ? ROTULO_STATUS[e.statusNovo] : 'Atualização do pedido'
      return { titulo, detalhe: e.motivo ? `Motivo: ${e.motivo}` : null }
    }
  }
}
