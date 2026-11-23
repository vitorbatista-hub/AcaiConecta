/** Limitação de tentativas de login (ADR-001 §4). Funções puras: quem consulta o banco só fornece os horários das falhas. */
export const JANELA_MS = 15 * 60 * 1000

const ESPERA_EMAIL = [
  { falhas: 20, esperaMs: 15 * 60 * 1000 },
  { falhas: 15, esperaMs: 5 * 60 * 1000 },
  { falhas: 10, esperaMs: 60 * 1000 },
] as const
const LIMITE_ORIGEM = { falhas: 50, esperaMs: 15 * 60 * 1000 } as const

function naJanela(falhas: readonly Date[], agora: Date): Date[] {
  return falhas.filter(f => agora.getTime() - f.getTime() < JANELA_MS)
}

function esperaRestanteMs(falhas: readonly Date[], esperaMs: number, agora: Date): number {
  const ultima = Math.max(...falhas.map(f => f.getTime()))
  return Math.max(0, ultima + esperaMs - agora.getTime())
}

/** Milissegundos que ainda é preciso aguardar antes de verificar a senha; 0 libera a tentativa. */
export function esperaDeLoginMs(
  falhasDoEmail: readonly Date[],
  falhasDaOrigem: readonly Date[],
  agora: Date,
): number {
  let espera = 0
  const email = naJanela(falhasDoEmail, agora)
  const regra = ESPERA_EMAIL.find(r => email.length >= r.falhas)
  if (regra) espera = Math.max(espera, esperaRestanteMs(email, regra.esperaMs, agora))
  const origem = naJanela(falhasDaOrigem, agora)
  if (origem.length >= LIMITE_ORIGEM.falhas) {
    espera = Math.max(espera, esperaRestanteMs(origem, LIMITE_ORIGEM.esperaMs, agora))
  }
  return espera
}

/** Resposta única para e-mail inexistente, senha errada e tentativa em espera (ADR-001 §5). */
export const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos, ou acesso temporariamente indisponível. Tente novamente em instantes.'

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}
