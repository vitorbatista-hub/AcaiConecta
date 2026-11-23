import sharp from 'sharp'
import { ErroImagem, FORMATOS_PERMITIDOS, LADO_MINIATURA_PX, LADO_PRINCIPAL_PX, PIXELS_MAXIMOS, validarTamanho } from '@/domain/imagem'

/**
 * Valida pelo conteúdo (não pelo tipo declarado pelo navegador), corrige a orientação, remove todos os metadados
 * (EXIF, inclusive localização do celular) e regrava como WebP em dois tamanhos. SVG e demais formatos são recusados.
 */
export async function processarImagem(bytes: Buffer): Promise<{ principal: Buffer; miniatura: Buffer }> {
  validarTamanho(bytes.length)
  const base = () => sharp(bytes, { limitInputPixels: PIXELS_MAXIMOS, failOn: 'error' })
  let formato: string | undefined
  try {
    const meta = await base().metadata()
    formato = meta.format
    if ((meta.pages ?? 1) > 1) throw new ErroImagem('Envie uma imagem estática, sem animação.')
  } catch (e) {
    if (e instanceof ErroImagem) throw e
    throw new ErroImagem('Não foi possível ler a imagem. Envie um arquivo JPEG, PNG ou WebP.')
  }
  if (!(FORMATOS_PERMITIDOS as readonly string[]).includes(formato ?? '')) {
    throw new ErroImagem('Formato não aceito. Envie um arquivo JPEG, PNG ou WebP.')
  }
  try {
    const redimensionar = (lado: number, qualidade: number) =>
      base().rotate().resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true }).webp({ quality: qualidade }).toBuffer()
    const [principal, miniatura] = await Promise.all([redimensionar(LADO_PRINCIPAL_PX, 80), redimensionar(LADO_MINIATURA_PX, 75)])
    return { principal, miniatura }
  } catch {
    throw new ErroImagem('Não foi possível processar a imagem. Tente outra foto.')
  }
}
