import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  OfflineError: class OfflineError extends Error {},
}))

import { apiFetch, OfflineError } from '@/lib/api/client'
import { useOfflineQueue } from '@/lib/offline/queue.store'
import { drainQueue } from '@/lib/offline/sync'

describe('drainQueue', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
    useOfflineQueue.setState({ items: [], dead: [] })
  })

  it('keeps an offline item, then delivers it once with the same idempotency key', async () => {
    const item = useOfflineQueue.getState().enqueue({
      kind: 'food_log',
      method: 'POST',
      path: '/v1/logs',
      body: { type: 'food' },
    })
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new OfflineError('offline'))
      .mockResolvedValueOnce({ id: 'server-log' })

    expect(await drainQueue()).toEqual({ sent: 0, failed: 0 })
    expect(useOfflineQueue.getState().items).toHaveLength(1)

    expect(await drainQueue()).toEqual({ sent: 1, failed: 0 })
    expect(useOfflineQueue.getState().items).toHaveLength(0)
    expect(apiFetch).toHaveBeenCalledTimes(2)
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/v1/logs', {
      method: 'POST',
      body: { type: 'food' },
      idempotencyKey: item.id,
    })
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/v1/logs', {
      method: 'POST',
      body: { type: 'food' },
      idempotencyKey: item.id,
    })
  })
})
