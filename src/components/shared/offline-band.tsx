'use client'

import { useState } from 'react'

import { useOnline } from '@/lib/platform/network'
import { pendingCount, useOfflineQueue } from '@/lib/offline/queue.store'
import { drainQueue } from '@/lib/offline/sync'

export function OfflineBand() {
  const online = useOnline()
  const count = useOfflineQueue(pendingCount)
  const [retrying, setRetrying] = useState(false)

  if (online && count === 0) return null

  if (!online) {
    return (
      <div className="w-full bg-ink px-gutter py-2 text-[13px] font-medium text-cream">
        Offline · showing your last synced data
      </div>
    )
  }

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
    <div className="flex w-full items-center justify-between bg-accent-10 px-gutter py-2 text-[13px] font-medium text-ink">
      <span>{count} change{count === 1 ? '' : 's'} waiting to sync</span>
      <button type="button" className="underline" disabled={retrying} onClick={() => void retry()}>
        Retry
      </button>
    </div>
  )
}
