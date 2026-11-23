import { ErroBatedeira } from '@/domain/batedeira-status'
import { ErroProduto } from '@/domain/catalogo'
import { ErroConfiguracao } from '@/domain/configuracao'
import { ErroImagem } from '@/domain/imagem'
import { descreverErro } from '@/domain/log'
import { ErroPedido } from '@/domain/pedido/calculo'
import { ErroTransicao } from '@/domain/pedido/estados'
import { ErroNegocio } from './erros'
import { log } from './log'

/**
 * Mensagem segura para o usuário; erros inesperados são relançados e não vazam detalhe (o Next os registra em
 * `onRequestError`). Recusas esperadas (regra de negócio) ficam no log como aviso, só com o tipo e o código.
 */
export function mensagemDoErro(e: unknown): string {
  if (
    e instanceof ErroNegocio || e instanceof ErroPedido || e instanceof ErroTransicao || e instanceof ErroConfiguracao ||
    e instanceof ErroBatedeira || e instanceof ErroImagem || e instanceof ErroProduto
  ) {
    void log.warn('acao_recusada', { erro: descreverErro(e) })
    return e.message
  }
  throw e
}
