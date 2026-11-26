import { NextResponse } from 'next/server'
import { createResetToken } from '@/lib/accounts'
import { sendPasswordReset } from '@/lib/email'
import { clientIp, sameOrigin } from '@/lib/auth'
import { registerFailure, tooManyAttempts } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const GENERIC = 'Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Requisição recusada.' }, 403)
  let body: { email?: unknown }
  try { body = await request.json() } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Informe um e-mail válido.' }, 400)
  const keys = [`f:${clientIp(request)}`, `f:${email}`]
  if (keys.some(key => tooManyAttempts(key))) return json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, 429)
  keys.forEach(key => registerFailure(key))

  // A resposta é a mesma exista ou não a conta, para não revelar quem tem cadastro.
  const created = await createResetToken(email)
  if (created) {
    const base = process.env.APP_URL?.replace(/\/$/, '') || new URL(request.url).origin
    await sendPasswordReset(email, `${base}/redefinir-senha?token=${created.token}`).catch(() => console.error('Falha ao enviar a redefinição de senha.'))
  }
  return json({ message: GENERIC })
}
