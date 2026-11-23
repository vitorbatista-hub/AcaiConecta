import { z } from 'zod'
import { TAMANHO_MAXIMO_BYTES } from '@/domain/imagem'
import { mensagemDoErro } from '@/server/erro-usuario'
import { enviarFoto, removerFoto, type AlvoFoto } from '@/server/fotos'
import { usuarioDaRequisicao } from '@/server/resposta-sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const json = (corpo: Record<string, unknown>, status = 200) => Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } })

/** Só aceita requisições feitas pelo próprio site: o navegador sempre envia Origin em POST. */
function origemConfiavel(req: Request): boolean {
  const origem = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origem || !host) return false
  try {
    return new URL(origem).host === host
  } catch {
    return false
  }
}

const Campos = z.object({
  acao: z.enum(['enviar', 'remover']),
  alvo: z.enum(['batedeira', 'produto']),
  produtoId: z.string().regex(/^\d{1,19}$/).optional(),
})

/** Envio e remoção de foto da batedeira ou de um produto dela. A batedeira vem sempre da sessão. */
export async function POST(req: Request) {
  if (!origemConfiavel(req)) return json({ erro: 'Origem não permitida.' }, 403)
  const { usuario } = await usuarioDaRequisicao()
  if (usuario?.tipo !== 'OPERADOR' || usuario.batedeiraId === null) return json({ erro: 'Entre como operador para continuar.' }, 401)
  // Recusa antes de ler o corpo; o limite do arquivo é conferido de novo depois.
  const tamanho = Number(req.headers.get('content-length') ?? '0')
  if (!Number.isFinite(tamanho) || tamanho > TAMANHO_MAXIMO_BYTES + 512 * 1024) return json({ erro: 'A imagem deve ter no máximo 5 MB.' }, 413)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json({ erro: 'Requisição inválida.' }, 400)
  }
  const campos = Campos.safeParse({ acao: form.get('acao'), alvo: form.get('alvo'), produtoId: form.get('produtoId') ?? undefined })
  if (!campos.success) return json({ erro: 'Requisição inválida.' }, 400)
  const { acao, alvo, produtoId } = campos.data
  if (alvo === 'produto' && !produtoId) return json({ erro: 'Produto não informado.' }, 400)
  const destino: AlvoFoto = alvo === 'batedeira' ? { tipo: 'batedeira' } : { tipo: 'produto', produtoId: BigInt(produtoId as string) }

  try {
    if (acao === 'remover') {
      await removerFoto(usuario.batedeiraId, destino)
      return json({ ok: true })
    }
    const arquivo = form.get('arquivo')
    if (!(arquivo instanceof File)) return json({ erro: 'Escolha um arquivo de imagem.' }, 400)
    const { url } = await enviarFoto(usuario.batedeiraId, destino, Buffer.from(await arquivo.arrayBuffer()))
    return json({ ok: true, url })
  } catch (e) {
    try {
      return json({ erro: mensagemDoErro(e) }, 400)
    } catch {
      return json({ erro: 'Não foi possível enviar a foto agora. Tente de novo.' }, 500)
    }
  }
}
