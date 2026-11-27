// Contato de suporte da plataforma, em uma única linha do banco (ADR-006 etapa 5). Só no servidor.
import { db } from './db.ts'
import { validateSupportContact } from './support-rules.ts'

export async function getSupportEmail(): Promise<string> {
  return (await db.configuracoes_plataforma.findUnique({ where: { id: 1 } }))?.email_suporte ?? ''
}

export type SupportResult = { ok: true } | { ok: false; error: string; status: number }

/** O administrador define ou remove o contato; a alteração entra na trilha de auditoria. */
export async function setSupportEmail(adminId: bigint, raw: unknown): Promise<SupportResult> {
  const parsed = validateSupportContact(raw)
  if (!parsed.ok) return { ok: false, error: parsed.error, status: 400 }
  const { email } = parsed
  if ((email ?? '') === (await getSupportEmail())) return { ok: true }
  await db.$transaction([
    db.configuracoes_plataforma.upsert({ where: { id: 1 }, create: { id: 1, email_suporte: email, atualizado_por: adminId }, update: { email_suporte: email, atualizado_por: adminId } }),
    db.eventos_auditoria.create({ data: { usuario_id: adminId, acao: 'Contato de suporte atualizado', entidade_tipo: 'plataforma', entidade_id: 1, detalhes: { reason: email ? 'Canal de atendimento configurado' : 'Canal removido' } } }),
  ])
  return { ok: true }
}
