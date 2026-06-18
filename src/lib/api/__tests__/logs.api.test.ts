/**
 * FE-RCA F3 — createLogs batch surface regression lock.
 *
 * The batch surface is the user-intent atomicity fix: George wants to
 * commit a multi-item meal as one action, not N sequential opens. Today
 * the BE plural endpoint (Phase 6a) hasn't shipped, so createLogs fans
 * out N parallel createLog calls — but the function is the single seam
 * a future patch will swap to `/v1/logs/batch` without touching callers.
 *
 * These tests lock in:
 *   - empty input → no calls, clean result
 *   - all-success → created.length matches input
 *   - partial-success → created + failures with correct indices
 *   - all-fail → failures.length === input.length, created empty
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api/client'
import { createLogs, createLog } from '@/lib/api/logs.api'
import type { CreateLogInput } from '@/types/logs.types'

const mockedApiFetch = vi.mocked(apiFetch)

function foodLogInput(name: string): CreateLogInput {
  return {
    type: 'food',
    payload: {
      food_name: name,
      quantity_g: 100,
      est_macros: { calories: 100, protein: 10, carbs: 10, fat: 1 },
      meal_type: 'breakfast',
    },
    source: 'manual',
  }
}

describe('FE-RCA F3 — createLogs batch surface', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('returns an empty result for an empty input (no API calls)', async () => {
    const result = await createLogs([])
    expect(result.created).toEqual([])
    expect(result.failures).toEqual([])
    expect(mockedApiFetch).not.toHaveBeenCalled()
  })

  it('on full success, returns all created Logs in input order', async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ id: 'log-1' })
      .mockResolvedValueOnce({ id: 'log-2' })
      .mockResolvedValueOnce({ id: 'log-3' })

    const result = await createLogs([
      foodLogInput('Oats'),
      foodLogInput('Whey'),
      foodLogInput('Banana'),
    ])

    expect(result.failures).toEqual([])
    expect(result.created).toHaveLength(3)
    expect(result.created.map((l) => l.id)).toEqual(['log-1', 'log-2', 'log-3'])
    expect(mockedApiFetch).toHaveBeenCalledTimes(3)
  })

  it('on partial failure, returns the successes and failures with their input indices', async () => {
    mockedApiFetch
      .mockResolvedValueOnce({ id: 'log-1' })
      .mockRejectedValueOnce(new Error('food not found: maca'))
      .mockResolvedValueOnce({ id: 'log-3' })

    const result = await createLogs([
      foodLogInput('Oats'),
      foodLogInput('Maca'),
      foodLogInput('Banana'),
    ])

    expect(result.created.map((l) => l.id)).toEqual(['log-1', 'log-3'])
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0].index).toBe(1)
    expect(result.failures[0].error).toContain('maca')
  })

  it('on total failure, returns empty created and one failure per input', async () => {
    mockedApiFetch
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new Error('500'))

    const result = await createLogs([foodLogInput('Oats'), foodLogInput('Whey')])

    expect(result.created).toEqual([])
    expect(result.failures).toHaveLength(2)
    expect(result.failures.map((f) => f.index)).toEqual([0, 1])
  })

  it('handles non-Error rejection reasons gracefully', async () => {
    mockedApiFetch.mockRejectedValueOnce('string-reason' as unknown as Error)
    const result = await createLogs([foodLogInput('Oats')])
    expect(result.failures[0].error).toBe('Failed to create log')
  })
})

describe('FE-RCA F3 — createLog singleton remains unchanged', () => {
  beforeEach(() => mockedApiFetch.mockReset())

  it('still POSTs a single item to /v1/logs', async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: 'log-1' })
    await createLog(foodLogInput('Oats'))
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/logs', {
      method: 'POST',
      body: foodLogInput('Oats'),
    })
  })
})
