import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { ErroImagem } from '@/domain/imagem'
import { processarImagem } from './imagens'

const jpeg = (w = 2000, h = 1500) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#639' } }).jpeg().withMetadata({ exif: { IFD0: { ImageDescription: 'localizacao-secreta' } } }).toBuffer()

describe('processarImagem', () => {
  it('regrava como WebP em dois tamanhos, sem aumentar e sem metadados', async () => {
    const entrada = await jpeg()
    expect((await sharp(entrada).metadata()).exif).toBeDefined()
    const { principal, miniatura } = await processarImagem(entrada)
    const p = await sharp(principal).metadata(), m = await sharp(miniatura).metadata()
    expect(p.format).toBe('webp'); expect(p.width).toBe(1280)
    expect(m.format).toBe('webp'); expect(m.width).toBe(480)
    expect(p.exif).toBeUndefined(); expect(principal.includes(Buffer.from('localizacao-secreta'))).toBe(false)
    const pequena = await processarImagem(await jpeg(300, 200))
    expect((await sharp(pequena.principal).metadata()).width).toBe(300)
  })

  it('aplica a orientação EXIF antes de remover os metadados', async () => {
    const girada = await sharp({ create: { width: 400, height: 100, channels: 3, background: '#000' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer()
    const { principal } = await processarImagem(girada)
    const m = await sharp(principal).metadata()
    expect([m.width, m.height]).toEqual([100, 400])
  })

  it('aceita PNG e recusa SVG, texto, arquivo vazio e GIF animado', async () => {
    const png = await sharp({ create: { width: 50, height: 50, channels: 4, background: '#fff' } }).png().toBuffer()
    await expect(processarImagem(png)).resolves.toBeDefined()
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>')
    await expect(processarImagem(svg)).rejects.toBeInstanceOf(ErroImagem)
    await expect(processarImagem(Buffer.from('não sou uma imagem'))).rejects.toBeInstanceOf(ErroImagem)
    await expect(processarImagem(Buffer.alloc(0))).rejects.toThrow(/arquivo/)
    const gif = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#f00' } }).gif().toBuffer()
    await expect(processarImagem(gif)).rejects.toBeInstanceOf(ErroImagem)
  })

  it('recusa imagem acima do tamanho máximo', async () => {
    await expect(processarImagem(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow(/5 MB/)
  })
})
