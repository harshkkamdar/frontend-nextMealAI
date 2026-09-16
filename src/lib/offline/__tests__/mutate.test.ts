import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  OfflineError: class OfflineError extends Error {},
}))

vi.mock('@/lib/platform/network', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/platform/network')>()
  return { ...actual, isOnline: vi.fn().mockResolvedValue(false) }
})

import { apiFetch } from '@/lib/api/client'
import { offlineMutate } from '@/lib/offline/mutate'
import { useOfflineQueue } from '@/lib/offline/queue.store'

describe('offlineMutate', () => {
  beforeEach(() => {
    useOfflineQueue.setState({ items: [], dead: [] })
  })

  it('queues the mutation and returns its optimistic value while offline', async () => {
    const result = await offlineMutate(
      'meal_copy',
      'POST',
      '/v1/meals/copy',
      { source_date: '2026-09-16' },
      () => ({ copied: 2 }),
    )

    expect(result.queued).toBe(true)
    expect(result.queued && result.optimistic).toEqual({ copied: 2 })
    expect(useOfflineQueue.getState().items).toHaveLength(1)
    expect(useOfflineQueue.getState().items[0].path).toBe('/v1/meals/copy')
    expect(vi.mocked(apiFetch)).not.toHaveBeenCalled()
  })
})
