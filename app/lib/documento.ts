// Validação de CPF e CNPJ (dígitos verificadores). Aceita máscara; devolve só os dígitos.
export const onlyDigits = (value: string) => value.replace(/\D/g, '')

const allEqual = (digits: string) => /^(\d)\1+$/.test(digits)

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value)
  if (d.length !== 11 || allEqual(d)) return false
  const check = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return check(9) === Number(d[9]) && check(10) === Number(d[10])
}

export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value)
  if (d.length !== 14 || allEqual(d)) return false
  const check = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, i) => total + Number(d[i]) * weight, 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return check(12) === Number(d[12]) && check(13) === Number(d[13])
}

/** CPF (11 dígitos) ou CNPJ (14 dígitos) válido; senão, null. */
export function parseDocumento(value: string): { kind: 'CPF' | 'CNPJ'; digits: string } | null {
  const digits = onlyDigits(value)
  if (digits.length === 11 && isValidCpf(digits)) return { kind: 'CPF', digits }
  if (digits.length === 14 && isValidCnpj(digits)) return { kind: 'CNPJ', digits }
  return null
}

export function maskDocumento(digits: string): string {
  return digits.length === 11 ? `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**` : digits.length === 14 ? `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**` : ''
}
