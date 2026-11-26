import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRange, parseRange, validateProduct, validateStatusChange, validateStoreSettings } from '../lib/store-rules.ts'

const schedule = Array.from({ length: 7 }, (_, day) => ({ day, opens: '09:00', closes: '18:00', active: day > 0 }))
const settings = { isOpen: true, deliveryAvailable: true, estimate: { min: 25, max: 35 }, coverage: [{ neighborhood: 'Centro', feeCents: 250, min: 20, max: 30 }], schedule }

test('faixa estimada: lê e formata "25–35 min" e recusa faixas inválidas', () => {
  assert.deepEqual(parseRange('25–35 min'), { min: 25, max: 35 })
  assert.equal(formatRange(25, 35), '25–35 min')
  for (const bad of ['35–25 min', '0–10 min', 'abc', '10', '5–9999 min', undefined]) assert.equal(parseRange(bad), null, String(bad))
})

test('configuração da batedeira: aceita o válido e recusa bairro fora da lista, taxa negativa, repetido e horário invertido', () => {
  assert.equal(validateStoreSettings(settings).ok, true)
  assert.equal(validateStoreSettings({ ...settings, coverage: [] }).ok, true, 'sem bairro é permitido salvar; só a ativação exige')
  const cases = [
    { coverage: [{ ...settings.coverage[0], neighborhood: 'Zona rural' }] },
    { coverage: [{ ...settings.coverage[0], feeCents: -1 }] },
    { coverage: [{ ...settings.coverage[0], feeCents: 1.5 }] },
    { coverage: [{ ...settings.coverage[0], min: 40, max: 30 }] },
    { coverage: [settings.coverage[0], settings.coverage[0]] },
    { estimate: { min: 0, max: 5 } },
    { schedule: schedule.slice(1) },
    { schedule: schedule.map((s, i) => (i === 2 ? { ...s, opens: '18:00', closes: '09:00' } : s)) },
    { schedule: schedule.map((s, i) => (i === 2 ? { ...s, opens: '25:00' } : s)) },
    { schedule: schedule.map(s => ({ ...s, day: 1 })) },
    { isOpen: 'sim' },
  ]
  for (const patch of cases) assert.equal(validateStoreSettings({ ...settings, ...patch }).ok, false, JSON.stringify(patch).slice(0, 80))
  assert.equal(validateStoreSettings(null).ok, false)
})

test('produto: nome, tamanho padrão (500 ml ou 1 L) e preço em centavos inteiros maiores que zero', () => {
  const ok = { name: '  Açaí  de 15 ', description: '', volumeMl: 1000, priceCents: 1500, active: true, available: true, showUnavailable: false }
  assert.equal(validateProduct(ok).data.name, 'Açaí de 15')
  for (const patch of [{ name: '' }, { name: 'x'.repeat(151) }, { volumeMl: 750 }, { priceCents: 0 }, { priceCents: 12.5 }, { priceCents: -1 }, { description: 'x'.repeat(501) }, { active: 'sim' }]) assert.equal(validateProduct({ ...ok, ...patch }).ok, false, JSON.stringify(patch))
})

test('situação da batedeira: motivo obrigatório; ativar exige elegibilidade e ao menos um bairro', () => {
  const ok = { id: '12', status: 'ATIVA', reason: ' Conferida ', eligibilityConfirmed: true }
  assert.equal(validateStatusChange(ok, 1).data.reason, 'Conferida')
  assert.equal(validateStatusChange(ok, 0).ok, false)
  assert.equal(validateStatusChange({ ...ok, eligibilityConfirmed: false }, 1).ok, false)
  assert.equal(validateStatusChange({ ...ok, reason: '  ' }, 1).ok, false)
  assert.equal(validateStatusChange({ ...ok, status: 'OUTRA' }, 1).ok, false)
  assert.equal(validateStatusChange({ ...ok, id: 'abc' }, 1).ok, false)
  assert.equal(validateStatusChange({ ...ok, status: 'SUSPENSA', eligibilityConfirmed: false }, 0).ok, true, 'suspender não exige bairro nem elegibilidade')
})
