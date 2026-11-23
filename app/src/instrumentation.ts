import type { Instrumentation } from 'next'

/** Executado uma vez quando o servidor Node inicia: liga as tarefas periódicas (expiração de pedidos e expurgo). */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarAgendador } = await import('./server/agendador')
    iniciarAgendador()
  }
}

/**
 * Todo erro de servidor não tratado (página, ação ou rota) vira um log `erro_servidor`, com o identificador da requisição
 * e o `digest` que o usuário vê na tela de erro. O texto do erro e a query string não são registrados.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { caminhoSemQuery, descreverErro, idRequisicaoValido } = await import('./domain/log')
  const { registrar } = await import('./server/log')
  const cabecalho = request.headers['x-request-id']
  const id = Array.isArray(cabecalho) ? cabecalho[0] : cabecalho
  const digest = typeof err === 'object' && err !== null && 'digest' in err ? String((err as { digest: unknown }).digest) : undefined
  await registrar('error', 'erro_servidor', {
    requisicaoId: idRequisicaoValido(id) ? id : undefined,
    digest,
    metodo: request.method,
    caminho: caminhoSemQuery(request.path),
    rota: context.routePath,
    tipoRota: context.routeType,
    erro: descreverErro(err),
  })
}
