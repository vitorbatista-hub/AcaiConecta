/**
 * Máquina de estados do pedido (PRD §12.2–12.5, fluxos.md, DEC-037).
 * Toda transição, venha de qual rota vier, passa por `validarTransicao`.
 */
export const STATUS_PEDIDO = [
  'AGUARDANDO_ACEITE',
  'ACEITO',
  'EM_PREPARO',
  'PRONTO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'RECUSADO',
  'EXPIRADO',
  'CANCELADO',
  'FALHA_NA_ENTREGA',
] as const
export type StatusPedido = (typeof STATUS_PEDIDO)[number]

export type Papel = 'CLIENTE' | 'OPERADOR' | 'ADMINISTRADOR'
export type Ator =
  | { tipo: 'USUARIO'; papel: 'CLIENTE'; usuarioId: bigint }
  | { tipo: 'USUARIO'; papel: 'OPERADOR'; usuarioId: bigint; batedeiraId: bigint }
  | { tipo: 'USUARIO'; papel: 'ADMINISTRADOR'; usuarioId: bigint }
  | { tipo: 'SISTEMA'; processo: string }

export const ESTADOS_FINAIS: ReadonlySet<StatusPedido> = new Set([
  'ENTREGUE',
  'RECUSADO',
  'EXPIRADO',
  'CANCELADO',
  'FALHA_NA_ENTREGA',
])

/** Quem pode executar cada transição permitida, e se o motivo é obrigatório. */
type Regra = { papeis: ReadonlyArray<Papel | 'SISTEMA'>; motivo: boolean }
const R = (papeis: Regra['papeis'], motivo = false): Regra => ({ papeis, motivo })

const TRANSICOES: Readonly<Record<StatusPedido, Partial<Record<StatusPedido, Regra>>>> = {
  AGUARDANDO_ACEITE: {
    ACEITO: R(['OPERADOR']),
    RECUSADO: R(['OPERADOR'], true),
    EXPIRADO: R(['SISTEMA']),
    CANCELADO: R(['CLIENTE']), // somente o cliente, e sem motivo obrigatório (PRD §12.5)
  },
  ACEITO: {
    EM_PREPARO: R(['OPERADOR']),
    CANCELADO: R(['OPERADOR', 'ADMINISTRADOR'], true),
  },
  EM_PREPARO: {
    PRONTO: R(['OPERADOR']),
    CANCELADO: R(['OPERADOR', 'ADMINISTRADOR'], true),
  },
  PRONTO: {
    SAIU_PARA_ENTREGA: R(['OPERADOR']),
    CANCELADO: R(['OPERADOR', 'ADMINISTRADOR'], true),
  },
  SAIU_PARA_ENTREGA: {
    ENTREGUE: R(['OPERADOR']),
    FALHA_NA_ENTREGA: R(['OPERADOR'], true),
  },
  ENTREGUE: {},
  RECUSADO: {},
  EXPIRADO: {},
  CANCELADO: {},
  FALHA_NA_ENTREGA: {},
}

export const MOTIVOS_RECUSA = [
  'Sem capacidade de atendimento',
  'Produto indisponível',
  'Estabelecimento não conseguiu concluir',
  'Outro',
] as const
export const MOTIVOS_CANCELAMENTO_OPERACIONAL = [
  'Impossibilidade operacional',
  'Produto indisponível',
  'Problema na produção',
  'Outro',
] as const
export const MOTIVOS_FALHA_ENTREGA = [
  'Endereço não localizado',
  'Cliente ausente',
  'Cliente não respondeu',
  'Problema com entregador',
  'Estabelecimento não conseguiu concluir',
  'Outro',
] as const

export class ErroTransicao extends Error {
  override readonly name = 'ErroTransicao'
  constructor(
    readonly codigo:
      | 'TRANSICAO_INVALIDA'
      | 'ESTADO_FINAL'
      | 'NAO_AUTORIZADO'
      | 'MOTIVO_OBRIGATORIO'
      | 'PEDIDO_ALHEIO'
      | 'PRAZO_ENCERRADO'
      | 'PRAZO_NAO_ENCERRADO',
    mensagem: string,
  ) {
    super(mensagem)
  }
}

export type PedidoParaTransicao = {
  status: StatusPedido
  clienteId: bigint
  batedeiraId: bigint
  expiraAceiteEm: Date
}

export type PedidoTransicao = {
  de: StatusPedido
  para: StatusPedido
  motivo: string | null
}

/**
 * Valida a transição e devolve o evento a gravar. Não altera nada: quem persiste deve
 * fazê-lo na mesma transação que releu o estado atual (PRD §18.3).
 */
export function validarTransicao(
  pedido: PedidoParaTransicao,
  para: StatusPedido,
  ator: Ator,
  agora: Date,
  motivo?: string | null,
): PedidoTransicao {
  const de = pedido.status
  if (ESTADOS_FINAIS.has(de)) {
    throw new ErroTransicao('ESTADO_FINAL', 'Este pedido já foi encerrado e não admite novas mudanças.')
  }
  const regra = TRANSICOES[de][para]
  if (!regra) {
    throw new ErroTransicao('TRANSICAO_INVALIDA', 'Essa mudança de estado não é permitida.')
  }
  const papel = ator.tipo === 'SISTEMA' ? 'SISTEMA' : ator.papel
  if (!regra.papeis.includes(papel)) {
    throw new ErroTransicao('NAO_AUTORIZADO', 'Você não pode executar esta ação neste pedido.')
  }
  if (ator.tipo === 'USUARIO') {
    if (ator.papel === 'CLIENTE' && ator.usuarioId !== pedido.clienteId) {
      throw new ErroTransicao('PEDIDO_ALHEIO', 'Este pedido pertence a outro cliente.')
    }
    if (ator.papel === 'OPERADOR' && ator.batedeiraId !== pedido.batedeiraId) {
      throw new ErroTransicao('PEDIDO_ALHEIO', 'Este pedido pertence a outra batedeira.')
    }
  }
  const prazoEncerrado = agora.getTime() >= pedido.expiraAceiteEm.getTime()
  if (de === 'AGUARDANDO_ACEITE') {
    if (para === 'EXPIRADO' && !prazoEncerrado) {
      throw new ErroTransicao('PRAZO_NAO_ENCERRADO', 'O prazo de resposta ainda não terminou.')
    }
    // Após o prazo, o pedido só pode expirar: não é possível aceitar, recusar nem cancelar (PRD §12.4).
    if (para !== 'EXPIRADO' && prazoEncerrado) {
      throw new ErroTransicao('PRAZO_ENCERRADO', 'O prazo de resposta terminou; o pedido não pode mais ser respondido.')
    }
  }
  const texto = motivo?.trim() ?? ''
  if (regra.motivo && texto.length === 0) {
    throw new ErroTransicao('MOTIVO_OBRIGATORIO', 'Informe o motivo.')
  }
  if (texto.length > 255) {
    throw new ErroTransicao('MOTIVO_OBRIGATORIO', 'O motivo deve ter no máximo 255 caracteres.')
  }
  return { de, para, motivo: texto.length > 0 ? texto : null }
}

/** Estados que o próprio ator pode escolher a partir do estado atual (para montar botões). */
export function proximosEstadosPermitidos(de: StatusPedido, ator: Ator): StatusPedido[] {
  const papel = ator.tipo === 'SISTEMA' ? 'SISTEMA' : ator.papel
  return (Object.entries(TRANSICOES[de]) as [StatusPedido, Regra][])
    .filter(([, regra]) => regra.papeis.includes(papel))
    .map(([estado]) => estado)
}
