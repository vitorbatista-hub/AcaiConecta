import { naoAutorizado, responderSSE, usuarioDaRequisicao } from '@/server/resposta-sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Fila do operador: eventos dos pedidos da própria batedeira. */
export async function GET(req: Request) {
  const { token, usuario } = await usuarioDaRequisicao()
  if (usuario?.tipo !== 'OPERADOR' || usuario.batedeiraId === null) return naoAutorizado()
  return responderSSE(req, token, { tipo: 'batedeira', batedeiraId: usuario.batedeiraId })
}
