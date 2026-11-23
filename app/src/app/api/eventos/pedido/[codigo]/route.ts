import { naoAutorizado, responderSSE, usuarioDaRequisicao } from '@/server/resposta-sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Acompanhamento do cliente: eventos de um único pedido, e só se for dele. */
export async function GET(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const { token, usuario } = await usuarioDaRequisicao()
  if (usuario?.tipo !== 'CLIENTE' || !/^AC-[A-Z0-9]{8}$/.test(codigo)) return naoAutorizado()
  return responderSSE(req, token, { tipo: 'pedido', codigo, clienteId: usuario.id })
}
