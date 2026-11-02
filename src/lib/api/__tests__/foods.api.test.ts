import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api/client'
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
})
