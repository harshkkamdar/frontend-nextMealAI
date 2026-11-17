import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api/client'
import { syncBus } from '@/lib/sync/sync-bus'
import { logFromEstimate } from '../foods.api'

describe('logFromEstimate', () => {
  beforeEach(() => vi.mocked(apiFetch).mockReset())

  it('includes the chosen meal and local date when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({})
    await logFromEstimate('estimate-1', { items: [] }, { meal_type: 'lunch', local_date: '2026-11-02' })
    expect(apiFetch).toHaveBeenCalledWith('/v1/foods/log-from-estimate', {
      method: 'POST',
      body: { estimate_id: 'estimate-1', edits: { items: [] }, meal_type: 'lunch', local_date: '2026-11-02' },
    })
  })

  it('tells open screens a log was created, like createLog', async () => {
    // Mirrors food-estimates.controller.ts logFromEstimate's 201: the created logs row, the estimate id and when it was used.
    vi.mocked(apiFetch).mockResolvedValueOnce({
      log: { id: 'log-1', user_id: 'u', type: 'food', source: 'menu_scan', local_date: '2026-11-17', payload: { food_name: 'Chicken', meal_type: 'lunch' }, created_at: '2026-11-17T01:00:00.000Z' },
      estimate_id: 'estimate-1',
      consumed_at: '2026-11-17T01:00:00.000Z',
    })
    const heard = vi.fn()
    const off = syncBus.onMany(['logs:*'], heard)
    await logFromEstimate('estimate-1', undefined, { meal_type: 'lunch' })
    off()
    expect(heard).toHaveBeenCalledWith('logs:created', undefined)
  })
})
