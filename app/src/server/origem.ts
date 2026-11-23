import { headers } from 'next/headers'

/** IP do cliente. Atrás de proxy reverso confiável (a definir no deploy, ADR-003) o primeiro item de x-forwarded-for. */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'desconhecido'
}

export function segredoDeOrigem(): string {
  const segredo = process.env.ORIGEM_HMAC_SECRET
  if (!segredo) throw new Error('ORIGEM_HMAC_SECRET não configurado.')
  return segredo
}
