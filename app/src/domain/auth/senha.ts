/** Regras mínimas de senha da ADR-001 (NIST SP 800-63B): tamanho e recusa de senhas comuns. */
export const SENHA_MIN = 8
export const SENHA_MAX = 128

// Amostra das senhas mais usadas. Antes do piloto, substituir por lista maior (ex.: top 100 mil).
const COMUNS = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', 'qwertyui', 'qwertyuiop', 'password',
  'password1', 'senha123', 'senha1234', 'senha@123', 'abc12345', 'abcd1234', 'iloveyou', 'admin123',
  'brasil123', 'brasil2026', 'mudar123', 'minhasenha', 'acaiconecta', 'acai1234', 'cameta123', 'cameta2026',
  '123123123', '987654321', '1q2w3e4r', 'qazwsxedc', '12341234', '87654321',
])

export type ResultadoSenha = { valida: true } | { valida: false; motivo: string }

export function validarSenha(senha: string, email?: string): ResultadoSenha {
  if (senha.length < SENHA_MIN) return { valida: false, motivo: `A senha deve ter ao menos ${SENHA_MIN} caracteres.` }
  if (senha.length > SENHA_MAX) return { valida: false, motivo: `A senha deve ter no máximo ${SENHA_MAX} caracteres.` }
  const normal = senha.toLowerCase()
  if (COMUNS.has(normal) || /^(.)\1+$/.test(senha)) {
    return { valida: false, motivo: 'Essa senha é muito comum. Escolha outra.' }
  }
  if (email && normal === email.trim().toLowerCase()) {
    return { valida: false, motivo: 'A senha não pode ser igual ao e-mail.' }
  }
  return { valida: true }
}
