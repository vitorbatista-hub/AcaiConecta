import { describe, expect, it } from 'vitest'
import { esperaDeLoginMs, JANELA_MS, normalizarEmail } from './limitacao'
import { expiracaoInicial, expiracaoRenovada, gerarToken, hashDaOrigem, hashDoToken, sessaoValida } from './sessao'
import { validarSenha } from './senha'

const agora = new Date('2026-11-23T15:00:00Z')
const falhas = (n: number, minutosAtras = 1) => Array.from({ length: n }, () => new Date(agora.getTime() - minutosAtras * 60_000))

describe('senha', () => {
  it('exige 8 caracteres e recusa senhas comuns, repetidas e iguais ao e-mail', () => {
    expect(validarSenha('curta')).toMatchObject({ valida: false })
    expect(validarSenha('12345678')).toMatchObject({ valida: false })
    expect(validarSenha('aaaaaaaaaa')).toMatchObject({ valida: false })
    expect(validarSenha('PASSWORD1')).toMatchObject({ valida: false })
    expect(validarSenha('a@b.com.br', 'a@b.com.br')).toMatchObject({ valida: false })
    expect(validarSenha('x'.repeat(129) + 'y')).toMatchObject({ valida: false })
    expect(validarSenha('uma frase longa e incomum')).toEqual({ valida: true })
  })
})

describe('limitação de login (ADR-001)', () => {
  it('não espera com menos de 10 falhas', () => {
    expect(esperaDeLoginMs(falhas(9), [], agora)).toBe(0)
  })
  it('espera cresce: 10 → 1 min, 15 → 5 min, 20 → 15 min, contados da última falha', () => {
    expect(esperaDeLoginMs(falhas(10, 0), [], agora)).toBe(60_000)
    expect(esperaDeLoginMs(falhas(10, 1), [], agora)).toBe(0)
    expect(esperaDeLoginMs(falhas(15, 1), [], agora)).toBe(4 * 60_000)
    expect(esperaDeLoginMs(falhas(20, 5), [], agora)).toBe(10 * 60_000)
  })
  it('falhas fora da janela de 15 minutos não contam', () => {
    expect(esperaDeLoginMs(falhas(30, 16), [], agora)).toBe(0)
    expect(JANELA_MS).toBe(900_000)
  })
  it('limite por origem é alto (CGNAT): 49 não bloqueia, 50 bloqueia por 15 min', () => {
    expect(esperaDeLoginMs([], falhas(49, 0), agora)).toBe(0)
    expect(esperaDeLoginMs([], falhas(50, 0), agora)).toBe(15 * 60_000)
  })
  it('usa a maior espera entre e-mail e origem', () => {
    expect(esperaDeLoginMs(falhas(10, 0), falhas(50, 0), agora)).toBe(15 * 60_000)
  })
  it('normaliza o e-mail', () => {
    expect(normalizarEmail('  Ana@Exemplo.COM ')).toBe('ana@exemplo.com')
  })
})

describe('sessão (ADR-001)', () => {
  it('gera tokens únicos e guarda apenas o hash', () => {
    const a = gerarToken(), b = gerarToken()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(43)
    expect(hashDoToken(a)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashDoToken(a)).not.toContain(a)
  })
  it('origem é HMAC com segredo; exige segredo longo', () => {
    const segredo = 'x'.repeat(32)
    expect(hashDaOrigem('203.0.113.7', segredo)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashDaOrigem('203.0.113.7', segredo)).not.toBe(hashDaOrigem('203.0.113.8', segredo))
    expect(hashDaOrigem('203.0.113.7', segredo)).not.toBe(hashDaOrigem('203.0.113.7', 'y'.repeat(32)))
    expect(() => hashDaOrigem('1.1.1.1', 'curto')).toThrow()
  })
  it('cliente: 30 dias renováveis; equipe: 12 horas sem renovação', () => {
    expect(expiracaoInicial('CLIENTE', agora).getTime() - agora.getTime()).toBe(30 * 86_400_000)
    expect(expiracaoInicial('OPERADOR', agora).getTime() - agora.getTime()).toBe(12 * 3_600_000)
    const meio = new Date(agora.getTime() + 3_600_000)
    const exp = expiracaoInicial('OPERADOR', agora)
    expect(expiracaoRenovada('OPERADOR', meio, exp)).toBe(exp)
    expect(expiracaoRenovada('ADMINISTRADOR', meio, exp)).toBe(exp)
    expect(expiracaoRenovada('CLIENTE', meio, expiracaoInicial('CLIENTE', agora)).getTime()).toBe(meio.getTime() + 30 * 86_400_000)
  })
  it('rejeita sessão encerrada, expirada ou de usuário inativo', () => {
    const futuro = new Date(agora.getTime() + 1000)
    expect(sessaoValida({ encerradaEm: null, expiraEm: futuro, usuarioAtivo: true }, agora)).toBe(true)
    expect(sessaoValida({ encerradaEm: agora, expiraEm: futuro, usuarioAtivo: true }, agora)).toBe(false)
    expect(sessaoValida({ encerradaEm: null, expiraEm: agora, usuarioAtivo: true }, agora)).toBe(false)
    expect(sessaoValida({ encerradaEm: null, expiraEm: futuro, usuarioAtivo: false }, agora)).toBe(false)
  })
})
