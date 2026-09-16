import { apiFetch, OfflineError } from '@/lib/api/client'
import { syncBus, type SyncTopic } from '@/lib/sync/sync-bus'
import type { QueueItem, QueueKind } from '@/types/offline.types'
import { moveToDead, useOfflineQueue } from './queue.store'

let activeDrain: Promise<{ sent: number; failed: number }> | null = null

const wait = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay))

function topicFor(kind: QueueKind): SyncTopic {
  return kind.startsWith('workout_') ? 'workout:session-updated' : 'logs:created'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function send(item: QueueItem): Promise<void> {
  await apiFetch(item.path, {
    method: item.method,
    body: item.body,
    idempotencyKey: item.id,
  })
}

async function drain(): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  while (useOfflineQueue.getState().items.length > 0) {
    const item = useOfflineQueue.getState().items[0]

    try {
      await send(item)
      useOfflineQueue.getState().remove(item.id)
      syncBus.emit(topicFor(item.kind))
      sent += 1
    } catch (error) {
      if (error instanceof OfflineError) break

      failed += 1
      useOfflineQueue.getState().bump(item.id, errorMessage(error))
      const bumped = useOfflineQueue.getState().items.find((candidate) => candidate.id === item.id)
      if (bumped && bumped.attempts >= 5) {
        moveToDead(item.id)
      } else {
        await wait(Math.min(2_000 * (2 ** item.attempts), 60_000))
      }
    }
  }

  return { sent, failed }
}

export function drainQueue(): Promise<{ sent: number; failed: number }> {
  if (activeDrain) return activeDrain
  activeDrain = drain().finally(() => {
    activeDrain = null
  })
  return activeDrain
}

export function startSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => undefined

  let timer: ReturnType<typeof setTimeout> | null = null
  const scheduleDrain = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void drainQueue()
    }, 500)
  }

  window.addEventListener('fiqr:online', scheduleDrain)
  window.addEventListener('fiqr:resume', scheduleDrain)
  window.addEventListener('online', scheduleDrain)

  return () => {
    if (timer) clearTimeout(timer)
    window.removeEventListener('fiqr:online', scheduleDrain)
    window.removeEventListener('fiqr:resume', scheduleDrain)
    window.removeEventListener('online', scheduleDrain)
  }
}
