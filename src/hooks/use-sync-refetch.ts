/**
 * FB-R6.7 Build B — React hook for sync-bus consumers.
 *
 * One-liner adoption: every page that owns a fetchFn subscribes to the
 * topics that should re-run it. Example:
 *
 *   useSyncRefetch(['plans:*'], fetchPlans)
 *
 * Topic arrays are joined into a stable key for the useEffect deps so callers
 * don't have to memoize a literal array on every render.
 */

import { useEffect } from 'react'
import { syncBus, type SyncTopicOrWildcard } from '@/lib/sync/sync-bus'

export function useSyncRefetch(
  topics: readonly SyncTopicOrWildcard[],
  handler: () => void,
): void {
  const topicsKey = topics.join('|')
  useEffect(() => {
    const unsub = syncBus.onMany(topics as SyncTopicOrWildcard[], () => handler())
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, handler])
}
