import { beforeEach, describe, expect, it } from 'vitest'

import { useOfflineQueue } from '@/lib/offline/queue.store'

describe('offline queue store', () => {
  beforeEach(() => {
    localStorage.clear()
    useOfflineQueue.setState({ items: [], dead: [] })
  })

  it('persists queued items and removes them in FIFO order', async () => {
    const first = useOfflineQueue.getState().enqueue({
      kind: 'food_log',
      method: 'POST',
      path: '/v1/logs',
      body: { name: 'oats' },
    })
    const second = useOfflineQueue.getState().enqueue({
      kind: 'meal_copy',
      method: 'POST',
      path: '/v1/meals/copy',
      body: { source_date: '2026-09-16' },
    })

    const persisted = JSON.parse(localStorage.getItem('fiqr-offline-queue') ?? '{}')
    expect(persisted.state.items.map((item: { id: string }) => item.id)).toEqual([
      first.id,
      second.id,
    ])

    useOfflineQueue.getState().remove(first.id)
    expect(useOfflineQueue.getState().items.map((item) => item.id)).toEqual([second.id])
  })
})
