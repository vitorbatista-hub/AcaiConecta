import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NOME_ARQUIVO } from '@/domain/imagem'

/**
 * Armazenamento de imagens atrás de uma interface pequena, para trocar o destino sem mexer no resto (ADR-003 §3).
 * Hoje só existe o driver em disco local. O driver S3 compatível (DigitalOcean Spaces) entra quando a ADR-003
 * for aprovada; até lá, em produção, o envio de fotos fica desligado a menos que `ARMAZENAMENTO=local` seja explícito.
 */
export interface Armazenamento {
  salvar(nome: string, bytes: Buffer): Promise<void>
  ler(nome: string): Promise<Buffer | null>
  remover(nome: string): Promise<void>
}

const nomeValido = (nome: string) => {
  if (!NOME_ARQUIVO.test(nome)) throw new Error('Nome de arquivo inválido.')
  return nome
}

export function armazenamentoLocal(pasta: string): Armazenamento {
  const caminho = (nome: string) => path.join(pasta, nomeValido(nome))
  return {
    async salvar(nome, bytes) {
      await mkdir(pasta, { recursive: true })
      await writeFile(caminho(nome), bytes, { flag: 'wx' })
    },
    async ler(nome) {
      try {
        return await readFile(caminho(nome))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw e
      }
    },
    async remover(nome) {
      await rm(caminho(nome), { force: true })
    },
  }
}

/** `null` quando o envio de fotos não está disponível neste ambiente. */
export function obterArmazenamento(): Armazenamento | null {
  const driver = process.env.ARMAZENAMENTO ?? (process.env.NODE_ENV === 'production' ? '' : 'local')
  if (driver === 'local') return armazenamentoLocal(process.env.UPLOADS_DIR ?? path.join(process.cwd(), '.uploads'))
  return null
}
