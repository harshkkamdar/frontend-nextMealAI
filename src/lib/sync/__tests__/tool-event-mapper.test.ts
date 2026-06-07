/**
 * FB-R6.7 Build B — tool-result → invalidation topic mapper tests.
 */

import { describe, it, expect } from 'vitest'
import { mapToolsToInvalidations } from '@/lib/sync/tool-event-mapper'

describe('mapToolsToInvalidations', () => {
  it('maps create_plan to plans:created + plans:updated', () => {
    const r = mapToolsToInvalidations({ tools_used: ['create_plan'] })
    expect(new Set(r.topics)).toEqual(new Set(['plans:created', 'plans:updated']))
    expect(r.anyFailed).toBe(false)
  })

  it('maps update_plan to plans:updated only', () => {
    const r = mapToolsToInvalidations({ tools_used: ['update_plan'] })
    expect(r.topics).toEqual(['plans:updated'])
  })

  it('maps deactivate_active_plan to plans:deactivated + plans:updated', () => {
    const r = mapToolsToInvalidations({ tools_used: ['deactivate_active_plan'] })
    expect(new Set(r.topics)).toEqual(new Set(['plans:deactivated', 'plans:updated']))
  })

  it('maps create_log to logs:created', () => {
    const r = mapToolsToInvalidations({ tools_used: ['create_log'] })
    expect(r.topics).toEqual(['logs:created'])
  })

  it('maps advance_to_workout to workout:advanced + plans:updated', () => {
    const r = mapToolsToInvalidations({ tools_used: ['advance_to_workout'] })
    expect(new Set(r.topics)).toEqual(new Set(['workout:advanced', 'plans:updated']))
  })

  it('failed tools are excluded from topic list (no phantom refetch)', () => {
    const r = mapToolsToInvalidations({
      tools_used: ['create_log', 'update_plan'],
      actions_failed: [{ tool: 'create_log', error: 'duplicate_window' }],
    })
    expect(r.topics).toEqual(['plans:updated'])
    expect(r.anyFailed).toBe(true)
  })

  it('returns empty topics when all tools failed', () => {
    const r = mapToolsToInvalidations({
      tools_used: ['create_log'],
      actions_failed: [{ tool: 'create_log', error: 'duplicate_window' }],
    })
    expect(r.topics).toEqual([])
    expect(r.anyFailed).toBe(true)
  })

  it('deduplicates overlapping topics from multiple tools', () => {
    const r = mapToolsToInvalidations({
      tools_used: ['create_plan', 'update_plan', 'deactivate_active_plan'],
    })
    // plans:updated should appear only once.
    expect(r.topics.filter((t) => t === 'plans:updated').length).toBe(1)
  })

  it('ignores unknown tool names gracefully', () => {
    const r = mapToolsToInvalidations({
      tools_used: ['some_future_tool', 'create_log'],
    })
    expect(r.topics).toEqual(['logs:created'])
  })

  it('empty response → no topics and no failed flag', () => {
    const r = mapToolsToInvalidations({})
    expect(r.topics).toEqual([])
    expect(r.anyFailed).toBe(false)
  })
})
