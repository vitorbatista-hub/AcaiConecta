import { naoAutorizado, responderSSE, usuarioDaRequisicao } from '@/server/resposta-sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Consulta do administrador: todos os pedidos, ou um só com `?codigo=`. */
export async function GET(req: Request) {
  const { token, usuario } = await usuarioDaRequisicao()
  if (usuario?.tipo !== 'ADMINISTRADOR') return naoAutorizado()
  const codigo = new URL(req.url).searchParams.get('codigo') ?? undefined
  if (codigo !== undefined && !/^AC-[A-Z0-9]{8}$/.test(codigo)) return naoAutorizado()
  return responderSSE(req, token, { tipo: 'admin', codigo })
}
