// Regras puras de configuração da batedeira e do catálogo (sem banco). Usadas pelo servidor e pela interface.
import { allowedProductVolumesMl } from './domain.ts'
import { isOfficialNeighborhood } from './neighborhoods.ts'

export type Estimate = { min: number; max: number }
export type CoverageInput = { neighborhood: string; feeCents: number; min: number; max: number }
export type ScheduleInput = { day: number; opens: string; closes: string; active: boolean }
export type StoreSettings = { isOpen: boolean; deliveryAvailable: boolean; estimate: Estimate; coverage: CoverageInput[]; schedule: ScheduleInput[] }
export type ProductInput = { id?: string; name: string; description: string; volumeMl: number; priceCents: number; active: boolean; available: boolean; showUnavailable: boolean }
type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const MAX_FEE_CENTS = 100_000
const MAX_MINUTES = 600
export const formatRange = (min: number, max: number) => `${min}–${max} min`
export function parseRange(text: unknown): Estimate | null {
  const nums = typeof text === 'string' ? text.match(/\d+/g) : null
  if (!nums || nums.length !== 2) return null
  const [min, max] = nums.map(Number)
  return Number.isInteger(min) && min >= 1 && max >= min && max <= MAX_MINUTES ? { min, max } : null
}
const validEstimate = (min: unknown, max: unknown): min is number => Number.isInteger(min) && Number.isInteger(max) && (min as number) >= 1 && (max as number) >= (min as number) && (max as number) <= MAX_MINUTES
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

export function validateStoreSettings(raw: unknown): Result<StoreSettings> {
  const input = (raw ?? {}) as Record<string, unknown>
  if (typeof input.isOpen !== 'boolean' || typeof input.deliveryAvailable !== 'boolean') return fail('Informe se a batedeira está aberta e se há entrega.')
  const estimate = input.estimate as Estimate | undefined
  if (!estimate || !validEstimate(estimate.min, estimate.max)) return fail('Informe uma faixa válida, com máximo maior ou igual ao mínimo.')
  if (!Array.isArray(input.coverage) || input.coverage.length > 50) return fail('Revise os bairros atendidos.')
  const coverage: CoverageInput[] = []
  for (const item of input.coverage as Partial<CoverageInput>[]) {
    if (!item || typeof item.neighborhood !== 'string' || !isOfficialNeighborhood(item.neighborhood) || !Number.isSafeInteger(item.feeCents) || (item.feeCents as number) < 0 || (item.feeCents as number) > MAX_FEE_CENTS) return fail('Revise os bairros atendidos: use a lista oficial e uma taxa válida.')
    if (!validEstimate(item.min, item.max)) return fail(`Faixa inválida em ${item.neighborhood}: o máximo deve ser maior ou igual ao mínimo.`)
    coverage.push({ neighborhood: item.neighborhood, feeCents: item.feeCents as number, min: item.min as number, max: item.max as number })
  }
  if (new Set(coverage.map(c => c.neighborhood)).size !== coverage.length) return fail('Revise os bairros atendidos: há bairro repetido.')
  if (!Array.isArray(input.schedule) || input.schedule.length !== 7) return fail('Informe os horários dos sete dias da semana.')
  const schedule: ScheduleInput[] = []
  for (const item of input.schedule as Partial<ScheduleInput>[]) {
    const ok = item && Number.isInteger(item.day) && (item.day as number) >= 0 && (item.day as number) <= 6 && typeof item.opens === 'string' && HHMM.test(item.opens) && typeof item.closes === 'string' && HHMM.test(item.closes) && item.opens < item.closes && typeof item.active === 'boolean'
    if (!ok) return fail('Revise os horários: o fechamento deve ser após a abertura, no mesmo dia.')
    schedule.push({ day: item.day as number, opens: item.opens as string, closes: item.closes as string, active: item.active as boolean })
  }
  if (new Set(schedule.map(s => s.day)).size !== 7) return fail('Revise os horários: um dia aparece repetido.')
  return { ok: true, data: { isOpen: input.isOpen, deliveryAvailable: input.deliveryAvailable, estimate, coverage, schedule: schedule.sort((a, b) => a.day - b.day) } }
}

export function validateProduct(raw: unknown): Result<ProductInput> {
  const input = (raw ?? {}) as Record<string, unknown>
  const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  if (!name || name.length > 150 || description.length > 500 || !(allowedProductVolumesMl as readonly number[]).includes(input.volumeMl as number) || !Number.isSafeInteger(input.priceCents) || (input.priceCents as number) < 1 || (input.priceCents as number) > 100_000_00)
    return fail('Informe nome, um dos tamanhos padrão (500 ml ou 1.000 ml) e preço maior que zero.')
  if (typeof input.active !== 'boolean' || typeof input.available !== 'boolean' || typeof input.showUnavailable !== 'boolean') return fail('Revise a disponibilidade do produto.')
  return { ok: true, data: { id: typeof input.id === 'string' ? input.id.slice(0, 64) : undefined, name, description, volumeMl: input.volumeMl as number, priceCents: input.priceCents as number, active: input.active, available: input.available, showUnavailable: input.showUnavailable } }
}

export const STORE_STATUSES = ['EM_ANALISE', 'ATIVA', 'SUSPENSA', 'DESATIVADA'] as const
export type StoreStatus = (typeof STORE_STATUSES)[number]

export function validateStatusChange(raw: unknown, coverageCount: number): Result<{ id: string; status: StoreStatus; reason: string; eligibilityConfirmed: boolean }> {
  const input = (raw ?? {}) as Record<string, unknown>
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (typeof input.id !== 'string' || !/^\d{1,18}$/.test(input.id) || !(STORE_STATUSES as readonly unknown[]).includes(input.status)) return fail('Requisição inválida.')
  if (!reason || reason.length > 255) return fail('Informe o motivo administrativo (até 255 caracteres).')
  const status = input.status as StoreStatus
  if (status === 'ATIVA' && input.eligibilityConfirmed !== true) return fail('Confirme a verificação externa de elegibilidade.')
  if (status === 'ATIVA' && coverageCount < 1) return fail('A batedeira só pode ser ativada com pelo menos um bairro atendido.')
  return { ok: true, data: { id: input.id, status, reason, eligibilityConfirmed: input.eligibilityConfirmed === true } }
}
