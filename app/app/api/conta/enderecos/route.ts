import { NextResponse } from 'next/server'
import { listAddresses, removeAddressFor, saveAddressFor } from '@/lib/profile'
import { apiSession } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// Endereços do próprio cliente (DEC-040, DEC-063): POST cria ou edita, DELETE remove. Devolve a lista atualizada.
async function mutate(request: Request, action: 'save' | 'remove') {
  const auth = await apiSession(request, ['cliente'], true)
  if ('error' in auth) return auth.error
  let body: Record<string, unknown>
  try { body = (await request.json()) ?? {} } catch { return json({ error: 'Requisição inválida.' }, 400) }
  try {
    const result = action === 'save' ? await saveAddressFor(auth.session.userId, body) : await removeAddressFor(auth.session.userId, body.id)
    return result.ok ? json({ addresses: await listAddresses(auth.session.userId) }) : json({ error: result.error }, result.status)
  } catch (error) { console.error('Falha ao salvar endereço.', error instanceof Error ? error.name : 'erro'); return json({ error: 'Serviço indisponível no momento.' }, 503) }
}
export const POST = (request: Request) => mutate(request, 'save')
export const DELETE = (request: Request) => mutate(request, 'remove')
