import { createHash, createHmac, randomBytes } from 'node:crypto'

/** Sessões opacas (ADR-001 §1–3). O banco guarda só o hash SHA-256 do token. */
export type PapelSessao = 'CLIENTE' | 'OPERADOR' | 'ADMINISTRADOR'

const DIA_MS = 24 * 60 * 60 * 1000
const DURACAO_CLIENTE_MS = 30 * DIA_MS
const DURACAO_EQUIPE_MS = 12 * 60 * 60 * 1000

export function gerarToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** O IP nunca é guardado em texto: só o HMAC com segredo do servidor (ADR-001 §7). */
export function hashDaOrigem(ip: string, segredo: string): string {
  if (segredo.length < 32) throw new Error('ORIGEM_HMAC_SECRET deve ter ao menos 32 caracteres.')
  return createHmac('sha256', segredo).update(ip).digest('hex')
}

export function expiracaoInicial(papel: PapelSessao, agora: Date): Date {
  return new Date(agora.getTime() + (papel === 'CLIENTE' ? DURACAO_CLIENTE_MS : DURACAO_EQUIPE_MS))
}

/** Só a sessão do cliente é renovada a cada uso; operador e administrador têm 12 h fixas. */
export function expiracaoRenovada(papel: PapelSessao, agora: Date, atual: Date): Date {
  return papel === 'CLIENTE' ? expiracaoInicial(papel, agora) : atual
}

export type SessaoParaValidar = { encerradaEm: Date | null; expiraEm: Date; usuarioAtivo: boolean }

export function sessaoValida(s: SessaoParaValidar, agora: Date): boolean {
  return s.encerradaEm === null && s.expiraEm.getTime() > agora.getTime() && s.usuarioAtivo
}
