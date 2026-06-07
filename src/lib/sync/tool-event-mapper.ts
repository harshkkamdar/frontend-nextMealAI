/**
 * FB-R6.7 Build B — Geo tool-result → invalidation topic mapper.
 *
 * Pure function: given a ChatResponse (tools_used + actions_failed), return
 * the set of sync topics to emit. Failed tools are excluded — emitting on
 * failure would refresh the UI to a state that didn't actually change and
 * make Geo's "I did X" message look right when it was wrong.
 *
 * BE coordination note: `tools_used: string[]` doesn't carry per-tool success
 * today. We cross-reference `actions_failed[].tool` instead. If both arrays
 * are populated, only tools NOT in actions_failed are treated as successful.
 *
 * When the BE upgrades to `tools_used: { name, success }[]`, this mapper
 * stays the same — only the success-extraction step changes.
 */

import type { ChatResponse } from '@/types/chat.types'
import type { SyncTopic } from './sync-bus'

const TOOL_TOPIC_MAP: Record<string, readonly SyncTopic[]> = {
  create_plan: ['plans:created', 'plans:updated'],
  update_plan: ['plans:updated'],
  deactivate_active_plan: ['plans:deactivated', 'plans:updated'],
  create_log: ['logs:created'],
  update_log: ['logs:updated'],
  delete_log: ['logs:deleted'],
  advance_to_workout: ['workout:advanced', 'plans:updated'],
  update_today_workout: ['workout:session-updated'],
}

export interface ToolInvalidationResult {
  topics: SyncTopic[]
  anyFailed: boolean
}

export function mapToolsToInvalidations(
  response: Pick<ChatResponse, 'tools_used' | 'actions_failed'>
): ToolInvalidationResult {
  const failedTools = new Set((response.actions_failed ?? []).map((f) => f.tool))
  const tools = response.tools_used ?? []

  const topics = new Set<SyncTopic>()
  for (const tool of tools) {
    if (failedTools.has(tool)) continue
    const mapped = TOOL_TOPIC_MAP[tool]
    if (!mapped) continue
    for (const t of mapped) topics.add(t)
  }

  return {
    topics: Array.from(topics),
    anyFailed: failedTools.size > 0,
  }
}
