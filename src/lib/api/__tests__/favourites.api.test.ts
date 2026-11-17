import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), online: true }))
vi.mock('@/lib/api/client', () => ({ apiFetch: mocks.apiFetch }))
vi.mock('@/lib/platform/network', () => ({ isOnline: () => Promise.resolve(mocks.online) }))

import { syncBus } from '@/lib/sync/sync-bus'
import { useOfflineQueue } from '@/lib/offline/queue.store'
import { logFavouriteWithStatus } from '../favourites.api'

describe('logFavouriteWithStatus', () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset()
    mocks.online = true
    useOfflineQueue.setState({ items: [] })
  })

  it('tells open screens (Home, Food) a log was created once the favourite logs', async () => {
    // favourites.controller.ts logFavouriteHandler's 200.
    mocks.apiFetch.mockResolvedValueOnce({ success: true, favourite: 'Weekday breakfast', logged: 2, total: 2, target_date: '2026-11-17', items: [] })
    const heard = vi.fn()
    const off = syncBus.onMany(['logs:*'], heard)
    await logFavouriteWithStatus('fav-1', { target_meal_type: 'breakfast' })
    off()
    expect(heard).toHaveBeenCalled()
  })

  it('a queued favourite waits for the queue to send it before screens hear of it', async () => {
    mocks.online = false
    const heard = vi.fn()
    const off = syncBus.onMany(['logs:*'], heard)
    const result = await logFavouriteWithStatus('fav-1')
    off()
    expect(result.queued).toBe(true)
    expect(heard).not.toHaveBeenCalled()
  })
})
