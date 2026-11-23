import { usuarioDaSessao } from './auth'
import { lerCookieSessao } from './cookie-sessao'
import { consultarEventos, ultimoEventoId, type EscopoEventos } from './eventos'
import { fluxoSSE, respostaDoFluxo } from './sse'

const NUMERO = /^\d{1,19}$/

/** Ponto de partida: Last-Event-ID (reconexão) > `desde` da página > último evento atual. */
async function pontoDePartida(req: Request, escopo: EscopoEventos): Promise<bigint> {
  const cab = req.headers.get('last-event-id')
  if (cab && NUMERO.test(cab)) return BigInt(cab)
  const desde = new URL(req.url).searchParams.get('desde')
  if (desde && NUMERO.test(desde)) return BigInt(desde)
  return ultimoEventoId(escopo)
}

export function naoAutorizado() {
  return new Response('Não autorizado', { status: 401, headers: { 'Cache-Control': 'no-store' } })
}

export async function responderSSE(req: Request, token: string, escopo: EscopoEventos): Promise<Response> {
  const ultimoId = await pontoDePartida(req, escopo)
  return respostaDoFluxo(
    fluxoSSE({
      ultimoId,
      consultar: apos => consultarEventos(escopo, apos),
      // A verificação periódica não renova a sessão do cliente: só confirma que ela continua válida.
      sessaoValida: async () => (await usuarioDaSessao(token, new Date(), false)) !== null,
      sinal: req.signal,
    }),
  )
}

export async function usuarioDaRequisicao() {
  const token = await lerCookieSessao()
  return { token, usuario: await usuarioDaSessao(token) }
}
