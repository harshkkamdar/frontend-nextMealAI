import { describe, expect, it } from 'vitest'
import { formatDateValue } from '@/components/ui/fiqr/date-input'

describe('formatDateValue', () => {
  it('reads YYYY-MM-DD as a local date and rejects partial values', () => {
    expect(formatDateValue('2026-01-01')).toBe('1 Jan 2026')
    expect(formatDateValue('')).toBe('')
    expect(formatDateValue('2026-01')).toBe('')
  })
})
