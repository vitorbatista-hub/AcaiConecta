// Gera o "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central) para a simulação.
// A chave abaixo é fictícia: o protótipo não move dinheiro nem confirma pagamentos.
export const demoPixKey = '00000000-0000-4000-8000-000000000000'

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`
const ascii = (value: string, max: number) => value.normalize('NFD').replace(/[^\x20-\x7E]/g, '').toUpperCase().slice(0, max)

export function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildPixPayload(totalCents: number, merchantName: string, key = demoPixKey) {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error('Valor inválido para o Pix.')
  const amount = (totalCents / 100).toFixed(2)
  const body = field('00', '01') + field('26', field('00', 'br.gov.bcb.pix') + field('01', key)) + field('52', '0000') + field('53', '986') + field('54', amount) + field('58', 'BR') + field('59', ascii(merchantName, 25) || 'ACAICONECTA') + field('60', 'CAMETA') + field('62', field('05', '***')) + '6304'
  return body + crc16(body)
}
