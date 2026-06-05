/**
 * FB-R6.7 Build B — Shared dispatch helper for both chat surfaces.
 *
 * Called from `/chat/[sessionId]/page.tsx` and `<GeoCompanionSheet>` after
 * `sendMessage` resolves. Centralizes:
 *   1. Map tools_used → topics (cross-referencing actions_failed)
 *   2. Emit topics on syncBus
 *   3. Bridge to the legacy `workout:plan-deactivated` /
 *      `workout:session-updated` DOM CustomEvents so existing listeners on
 *      Activity keep working during the one-release rollout.
 *
 * The helper is intentionally framework-agnostic — no React imports — so it
 * can be unit-tested without a render harness.
 */

import type { ChatResponse } from '@/types/chat.types'
import { syncBus } from './sync-bus'
import { mapToolsToInvalidations } from './tool-event-mapper'

export interface DispatchResult {
  topics: string[]
  anyFailed: boolean
}

export function handleGeoToolResults(response: ChatResponse): DispatchResult {
  const { topics, anyFailed } = mapToolsToInvalidations(response)

  for (const t of topics) syncBus.emit(t)

  // Legacy DOM-event bridge — one release of overlap to avoid breaking
  // anything that hasn't migrated to useSyncRefetch yet.
  if (typeof window !== 'undefined') {
    if (topics.includes('plans:deactivated')) {
      window.dispatchEvent(new CustomEvent('workout:plan-deactivated'))
    }
    if (topics.includes('workout:session-updated')) {
      window.dispatchEvent(new CustomEvent('workout:session-updated'))
    }
  }

  return { topics, anyFailed }
}
