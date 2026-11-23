import { expect, it } from 'vitest'
import { inicioDoDiaLocal } from './dia'

it('o dia de Cametá começa às 03:00 UTC', () => {
  expect(inicioDoDiaLocal(new Date('2026-11-23T12:34:56.789Z')).toISOString()).toBe('2026-11-23T03:00:00.000Z')
  // 01:00 UTC ainda é o dia anterior em Cametá (22:00)
  expect(inicioDoDiaLocal(new Date('2026-11-23T01:00:00Z')).toISOString()).toBe('2026-11-22T03:00:00.000Z')
})
