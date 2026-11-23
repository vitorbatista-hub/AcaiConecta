import { NOME_ARQUIVO } from '@/domain/imagem'
import { obterArmazenamento } from '@/server/armazenamento'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Serve as fotos públicas do catálogo. O nome é aleatório e imutável, então o cache pode ser longo. */
export async function GET(_: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params
  const armazenamento = obterArmazenamento()
  if (!armazenamento || !NOME_ARQUIVO.test(arquivo)) return new Response('Não encontrado', { status: 404 })
  const bytes = await armazenamento.ler(arquivo)
  if (!bytes) return new Response('Não encontrado', { status: 404 })
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/webp',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
