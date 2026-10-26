import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ online: true, toast: vi.fn() }))
vi.mock('@/lib/platform/network', () => ({ useOnline: () => mocks.online }))
vi.mock('@/lib/offline/sync', () => ({ drainQueue: vi.fn() }))
vi.mock('sonner', () => ({ toast: mocks.toast }))

import { OfflineBand } from '@/components/shared/offline-band'
import { moveToDead, useOfflineQueue } from '@/lib/offline/queue.store'

const item = (id: string) => ({ id, method: 'POST', path: '/v1/logs', body: {}, createdAt: '', attempts: 0 })

beforeEach(() => {
  mocks.online = true
  mocks.toast.mockReset()
  useOfflineQueue.setState({ items: [], dead: [] })
})

describe('OfflineBand (status capsule)', () => {
  it('says offline and stays hidden when online with nothing waiting', () => {
    const { rerender } = render(<OfflineBand />)
    expect(screen.queryByRole('status')).toBeNull()
    mocks.online = false
    rerender(<OfflineBand />)
    expect(screen.getByRole('status')).toHaveTextContent('Offline. Showing what you last synced.')
  })

  it('hands over to one toast when waiting changes sync after being offline', () => {
    mocks.online = false
    useOfflineQueue.setState({ items: [item('a'), item('b'), item('c')] as never })
    const { rerender } = render(<OfflineBand />)
    mocks.online = true
    rerender(<OfflineBand />)
    expect(screen.getByRole('status')).toHaveTextContent('3 changes waiting to sync')
    act(() => useOfflineQueue.setState({ items: [] }))
    expect(mocks.toast).toHaveBeenCalledWith('Back online. 3 changes synced', { id: 'fiqr-synced' })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not count changes that failed for good as synced', () => {
    useOfflineQueue.setState({ items: [item('a'), item('b')] as never })
    render(<OfflineBand />)
    act(() => moveToDead('a'))
    act(() => useOfflineQueue.setState({ items: [] }))
    expect(mocks.toast).toHaveBeenCalledWith('1 change synced', { id: 'fiqr-synced' })
  })
})
