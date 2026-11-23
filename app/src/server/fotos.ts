import { randomBytes } from 'node:crypto'
import { prisma } from '@/db/client'
import { idDaUrlLocal, urlPrincipal } from '@/domain/imagem'
import { obterArmazenamento, type Armazenamento } from './armazenamento'
import { ErroNegocio } from './erros'
import { processarImagem } from './imagens'

export type AlvoFoto = { tipo: 'batedeira' } | { tipo: 'produto'; produtoId: bigint }

const exigirArmazenamento = (): Armazenamento => {
  const a = obterArmazenamento()
  if (!a) throw new ErroNegocio('ARMAZENAMENTO_INDISPONIVEL', 'O envio de fotos não está disponível neste ambiente.')
  return a
}

const removerArquivos = async (a: Armazenamento, url: string | null) => {
  const id = idDaUrlLocal(url)
  if (!id) return // URL externa ou ausente: não é nossa para apagar
  await Promise.allSettled([a.remover(`${id}.webp`), a.remover(`${id}-m.webp`)])
}

/** Lê a URL atual do alvo, só se ele pertencer à batedeira informada. */
async function urlAtual(batedeiraId: bigint, alvo: AlvoFoto): Promise<{ existe: boolean; url: string | null }> {
  if (alvo.tipo === 'batedeira') {
    const b = await prisma.batedeira.findUnique({ where: { id: batedeiraId }, select: { imagemUrl: true } })
    return { existe: Boolean(b), url: b?.imagemUrl ?? null }
  }
  const p = await prisma.produto.findFirst({ where: { id: alvo.produtoId, batedeiraId, ativo: true }, select: { imagemUrl: true } })
  return { existe: Boolean(p), url: p?.imagemUrl ?? null }
}

async function gravarUrl(batedeiraId: bigint, alvo: AlvoFoto, url: string | null, esperada: string | null): Promise<boolean> {
  // Condiciona à URL lida: dois envios simultâneos não deixam arquivo órfão sem que um deles perceba.
  const r =
    alvo.tipo === 'batedeira'
      ? await prisma.batedeira.updateMany({ where: { id: batedeiraId, imagemUrl: esperada }, data: { imagemUrl: url } })
      : await prisma.produto.updateMany({ where: { id: alvo.produtoId, batedeiraId, ativo: true, imagemUrl: esperada }, data: { imagemUrl: url } })
  return r.count > 0
}

/** Envia ou substitui a foto. O operador só mexe na própria batedeira e nos próprios produtos. */
export async function enviarFoto(batedeiraId: bigint, alvo: AlvoFoto, bytes: Buffer): Promise<{ url: string }> {
  const armazenamento = exigirArmazenamento()
  const atual = await urlAtual(batedeiraId, alvo)
  if (!atual.existe) throw new ErroNegocio('NAO_ENCONTRADO', 'Item não encontrado.')
  const { principal, miniatura } = await processarImagem(bytes)
  const id = randomBytes(16).toString('hex')
  await armazenamento.salvar(`${id}.webp`, principal)
  await armazenamento.salvar(`${id}-m.webp`, miniatura)
  const url = urlPrincipal(id)
  if (!(await gravarUrl(batedeiraId, alvo, url, atual.url))) {
    await removerArquivos(armazenamento, url)
    throw new ErroNegocio('CONFLITO', 'A foto foi alterada por outra ação. Tente de novo.')
  }
  await removerArquivos(armazenamento, atual.url)
  return { url }
}

export async function removerFoto(batedeiraId: bigint, alvo: AlvoFoto): Promise<void> {
  const armazenamento = exigirArmazenamento()
  const atual = await urlAtual(batedeiraId, alvo)
  if (!atual.existe) throw new ErroNegocio('NAO_ENCONTRADO', 'Item não encontrado.')
  if (atual.url === null) return
  if (!(await gravarUrl(batedeiraId, alvo, null, atual.url))) throw new ErroNegocio('CONFLITO', 'A foto foi alterada por outra ação. Tente de novo.')
  await removerArquivos(armazenamento, atual.url)
}
