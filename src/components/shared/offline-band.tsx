'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useOnline } from '@/lib/platform/network'
import { pendingCount, useOfflineQueue } from '@/lib/offline/queue.store'
import { drainQueue } from '@/lib/offline/sync'
import { GeoMark } from '@/components/shared/geo-avatar'

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

/**
 * The status capsule (DESIGN.md component 12): one navy capsule under the header while
 * offline or while changes wait to sync. Callers bleed it to the screen edge; it insets itself to the 16 pt gutter.
 * `queuesSaves`: the screen's save is queued while offline (log screens), so the capsule says it will send later.
 * When waiting changes finish syncing it hands over to a toast in the same capsule style ("Back online. 3 changes synced").
 */
export function OfflineBand({ queuesSaves = false }: { queuesSaves?: boolean } = {}) {
  const online = useOnline()
  const count = useOfflineQueue(pendingCount)
  const dead = useOfflineQueue((state) => state.dead.length)
  const [retrying, setRetrying] = useState(false)
  const last = useRef({ count, dead, offline: !online })

  useEffect(() => {
    const before = last.current
    // Items that failed for good (moved to dead) or were cleared at log out did not sync, so they are not counted.
    const synced = dead >= before.dead ? before.count - (dead - before.dead) : 0
    if (online && count === 0 && synced > 0) {
      // One id, so the copies of this band on pages kept behind the open one raise a single toast.
      toast(`${before.offline ? 'Back online. ' : ''}${plural(synced)} synced`, { id: 'fiqr-synced' })
    }
    last.current = { count, dead, offline: count > 0 ? before.offline || !online : !online }
  }, [online, count, dead])

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
    <div className="w-full px-gutter">
      <div
        role="status"
        className="page-in flex min-h-11 items-center gap-2.5 rounded-[22px] bg-ink pl-3.5 pr-1.5 text-[14px] font-medium text-cream"
      >
        {/* Geo at the start: dimmed while offline, working while changes sync (the /geo page, "Offline"). */}
        <GeoMark size={20} tone="cream" muted={!online} working={retrying} />
        {!online ? (
          <span className="py-2">{queuesSaves ? 'Offline. This saves on your phone and sends later.' : 'Offline. Showing what you last synced.'}</span>
        ) : (
          <>
            <span className="flex-1 py-2">{plural(count)} waiting to sync</span>
            <button type="button" className="h-11 rounded-[18px] px-3 font-bold text-cream transition-opacity duration-150 active:opacity-60 disabled:text-cream-60" disabled={retrying} onClick={() => void retry()}>
              {retrying ? 'Syncing…' : 'Retry'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
