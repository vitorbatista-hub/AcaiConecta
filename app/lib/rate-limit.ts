// Limitação simples em memória para cadastro, "esqueci a senha" e redefinição (uma instância). O login usa o banco (lib/login-throttle.ts).
const attempts = new Map<string, number[]>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function tooManyAttempts(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter(time => now - time < WINDOW_MS)
  attempts.set(key, recent)
  return recent.length >= MAX_ATTEMPTS
}
export function registerFailure(key: string, now = Date.now()) {
  attempts.set(key, [...(attempts.get(key) ?? []).filter(time => now - time < WINDOW_MS), now])
  if (attempts.size > 5000) attempts.clear()
}
