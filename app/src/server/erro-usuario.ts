import { ErroBatedeira } from '@/domain/batedeira-status'
import { ErroImagem } from '@/domain/imagem'
import { ErroConfiguracao } from '@/domain/configuracao'
import { ErroProduto } from '@/domain/catalogo'
import { ErroPedido } from '@/domain/pedido/calculo'
import { ErroTransicao } from '@/domain/pedido/estados'
import { ErroNegocio } from './erros'

/** Mensagem segura para o usuário; erros inesperados são relançados e não vazam detalhe. */
export function mensagemDoErro(e: unknown): string {
  if (e instanceof ErroNegocio || e instanceof ErroPedido || e instanceof ErroTransicao || e instanceof ErroConfiguracao || e instanceof ErroBatedeira || e instanceof ErroImagem || e instanceof ErroProduto) return e.message
  throw e
}
