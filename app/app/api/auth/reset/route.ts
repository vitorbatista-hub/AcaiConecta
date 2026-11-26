import { NextResponse } from 'next/server'
import { consumeResetToken } from '@/lib/accounts'
import { clientIp, hashPassword, sameOrigin } from '@/lib/auth'
import { registerFailure, tooManyAttempts } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Requisição recusada.' }, 403)
  let body: { token?: unknown; password?: unknown }
  try { body = await request.json() } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const token = typeof body.token === 'string' ? body.token.slice(0, 200) : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < 8 || password.length > 200) return json({ error: 'A senha deve ter de 8 a 200 caracteres.' }, 400)
  const key = `x:${clientIp(request)}`
  if (tooManyAttempts(key)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, 429)
  if (!token || !(await consumeResetToken(token, hashPassword(password)))) {
    registerFailure(key)
    return json({ error: 'Link inválido ou expirado. Solicite uma nova redefinição.' }, 400)
  }
  return json({ ok: true })
}
