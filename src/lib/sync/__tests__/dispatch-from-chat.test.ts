/**
 * FB-R6.7 Build B — handleGeoToolResults helper tests.
 *
 * Verifies the shared dispatch helper (both chat surfaces call this):
 *   1. Emits sync topics on syncBus for each successful tool.
 *   2. Bridges legacy DOM CustomEvents (workout:plan-deactivated,
 *      workout:session-updated) so existing listeners keep working.
 *   3. Suppresses topic emits when actions_failed names the tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleGeoToolResults } from '@/lib/sync/dispatch-from-chat'
import { syncBus } from '@/lib/sync/sync-bus'

function baseResponse(over: Partial<Parameters<typeof handleGeoToolResults>[0]> = {}) {
  return {
    session_id: 'sess-1',
    response: { content: '', role: 'assistant' as const },
    tools_used: [] as string[],
    actions_taken: [],
    actions_failed: [],
    ...over,
  }
}

describe('handleGeoToolResults', () => {
  beforeEach(() => {
    syncBus.__resetForTests()
  })

  it('emits plans:updated on syncBus after a successful update_plan', () => {
    const handler = vi.fn()
    syncBus.on('plans:updated', handler)
    handleGeoToolResults(baseResponse({ tools_used: ['update_plan'] }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('emits logs:created after a successful create_log', () => {
    const handler = vi.fn()
    syncBus.on('logs:created', handler)
    handleGeoToolResults(baseResponse({ tools_used: ['create_log'] }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does NOT emit topics when actions_failed includes the tool', () => {
    const handler = vi.fn()
    syncBus.on('logs:created', handler)
    const result = handleGeoToolResults(
      baseResponse({
        tools_used: ['create_log'],
        actions_failed: [{ tool: 'create_log', error: 'duplicate_window' }],
      })
    )
    expect(handler).not.toHaveBeenCalled()
    expect(result.anyFailed).toBe(true)
  })

  it('bridges deactivate_active_plan to the legacy workout:plan-deactivated DOM event', () => {
    const domHandler = vi.fn()
    window.addEventListener('workout:plan-deactivated', domHandler)
    handleGeoToolResults(baseResponse({ tools_used: ['deactivate_active_plan'] }))
    expect(domHandler).toHaveBeenCalledTimes(1)
    window.removeEventListener('workout:plan-deactivated', domHandler)
  })

  it('bridges update_today_workout to the legacy workout:session-updated DOM event', () => {
    const domHandler = vi.fn()
    window.addEventListener('workout:session-updated', domHandler)
    handleGeoToolResults(baseResponse({ tools_used: ['update_today_workout'] }))
    expect(domHandler).toHaveBeenCalledTimes(1)
    window.removeEventListener('workout:session-updated', domHandler)
  })

  it('does NOT bridge legacy event when the tool failed', () => {
    const domHandler = vi.fn()
    window.addEventListener('workout:plan-deactivated', domHandler)
    handleGeoToolResults(
      baseResponse({
        tools_used: ['deactivate_active_plan'],
        actions_failed: [{ tool: 'deactivate_active_plan', error: 'unknown' }],
      })
    )
    expect(domHandler).not.toHaveBeenCalled()
    window.removeEventListener('workout:plan-deactivated', domHandler)
  })

  it('returns topics list for caller (used by chat page for toast gating)', () => {
    const result = handleGeoToolResults(baseResponse({ tools_used: ['create_plan'] }))
    expect(new Set(result.topics)).toEqual(new Set(['plans:created', 'plans:updated']))
    expect(result.anyFailed).toBe(false)
  })
})
