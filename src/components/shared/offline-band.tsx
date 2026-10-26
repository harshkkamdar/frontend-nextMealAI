'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useOnline } from '@/lib/platform/network'
import { pendingCount, useOfflineQueue } from '@/lib/offline/queue.store'
import { drainQueue } from '@/lib/offline/sync'
import { cn } from '@/lib/utils'

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

/**
 * The status capsule (SPATIAL-BUILD system states, mock "Status capsule"): one glass capsule under the header while
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
        className="glass page-in flex min-h-11 items-center gap-2.5 rounded-[22px] pl-4 pr-1.5 text-body-sm font-semibold text-ink"
        style={{ boxShadow: 'inset 0 1px 0 #fff, 0 0 0 .5px rgba(17,28,53,.1), 0 10px 24px -14px rgba(17,28,53,.3)' }}
      >
        {/* Ring = nothing is moving (offline); filled = changes waiting. Ink, never orange (orange is the screen's action). */}
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', online ? 'bg-ink' : 'shadow-[inset_0_0_0_2px_#111C35]')} />
        {!online ? (
          <span className="py-2">{queuesSaves ? 'Offline. This saves on your phone and sends later.' : 'Offline. Showing what you last synced.'}</span>
        ) : (
          <>
            <span className="flex-1 py-2">{plural(count)} waiting to sync</span>
            <button type="button" className="h-11 rounded-[18px] px-3 font-bold text-ink transition-colors duration-150 active:bg-ink-06 disabled:text-ink-65" disabled={retrying} onClick={() => void retry()}>
              {retrying ? 'Syncing…' : 'Retry'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
