'use client'

import { useState } from 'react'

import { useOnline } from '@/lib/platform/network'
import { pendingCount, useOfflineQueue } from '@/lib/offline/queue.store'
import { drainQueue } from '@/lib/offline/sync'

/**
 * Shown on every screen while offline or while changes wait to sync. Callers bleed it to the screen edge;
 * the band insets itself to the 16 pt bento gutter as one ink capsule and fades in (opacity only).
 */
export function OfflineBand() {
  const online = useOnline()
  const count = useOfflineQueue(pendingCount)
  const [retrying, setRetrying] = useState(false)

  if (online && count === 0) return null

  const retry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await drainQueue()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="w-full px-4">
      <div role="status" className="page-in flex min-h-11 items-center gap-2.5 rounded-[14px] bg-ink pl-4 pr-1.5 text-[14px] font-medium text-cream">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${online ? 'bg-accent' : 'bg-cream/60'}`} />
        {!online ? (
          <span className="py-2.5">Offline. Showing what you last synced.</span>
        ) : (
          <>
            <span className="flex-1 py-2.5">{count} change{count === 1 ? '' : 's'} waiting to sync</span>
            <button type="button" className="h-11 rounded-[10px] px-3 font-semibold text-cream underline underline-offset-4 disabled:opacity-60" disabled={retrying} onClick={() => void retry()}>
              {retrying ? 'Syncing…' : 'Retry'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
