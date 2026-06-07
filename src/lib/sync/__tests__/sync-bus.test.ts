/**
 * FB-R6.7 Build B — syncBus primitive tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncBus } from '@/lib/sync/sync-bus'

describe('syncBus — primitive', () => {
  beforeEach(() => {
    syncBus.__resetForTests()
  })

  it('emits to exact-topic subscribers', () => {
    const handler = vi.fn()
    syncBus.on('plans:updated', handler)
    syncBus.emit('plans:updated')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('emits to wildcard subscribers (plans:* receives plans:updated)', () => {
    const handler = vi.fn()
    syncBus.on('plans:*', handler)
    syncBus.emit('plans:updated')
    syncBus.emit('plans:created')
    syncBus.emit('plans:deactivated')
    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('wildcard does not cross prefixes (logs:* does NOT receive plans:updated)', () => {
    const handler = vi.fn()
    syncBus.on('logs:*', handler)
    syncBus.emit('plans:updated')
    expect(handler).not.toHaveBeenCalled()
  })

  it('multiple subscribers all receive the same emit', () => {
    const a = vi.fn()
    const b = vi.fn()
    syncBus.on('logs:created', a)
    syncBus.on('logs:*', b)
    syncBus.emit('logs:created')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe stops delivery', () => {
    const handler = vi.fn()
    const unsub = syncBus.on('workout:advanced', handler)
    syncBus.emit('workout:advanced')
    unsub()
    syncBus.emit('workout:advanced')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('onMany subscribes once across many topics and unsubscribes them all', () => {
    const handler = vi.fn()
    const unsub = syncBus.onMany(['plans:updated', 'logs:created'], handler)
    syncBus.emit('plans:updated')
    syncBus.emit('logs:created')
    syncBus.emit('logs:updated') // not subscribed
    expect(handler).toHaveBeenCalledTimes(2)
    unsub()
    syncBus.emit('plans:updated')
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('payload is passed through to handlers', () => {
    const handler = vi.fn()
    syncBus.on('logs:updated', handler)
    syncBus.emit('logs:updated', { log_id: 'abc' })
    expect(handler).toHaveBeenCalledWith('logs:updated', { log_id: 'abc' })
  })
})
