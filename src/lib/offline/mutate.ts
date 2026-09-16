import { apiFetch } from '@/lib/api/client'
import { isOnline } from '@/lib/platform/network'
import { enqueueWithId } from './queue.store'
import type { OfflineResult, QueueItem, QueueKind } from '@/types/offline.types'

export async function offlineMutate<T>(
  kind: QueueKind,
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  optimistic: (item: QueueItem) => T,
): Promise<OfflineResult<T>> {
  const idempotencyKey = crypto.randomUUID()
  const queue = () => enqueueWithId({ kind, method, path, body }, idempotencyKey)

  if (!(await isOnline())) {
    const item = queue()
    return { queued: true, item, optimistic: optimistic(item) }
  }

  try {
    const data = await apiFetch<T>(path, { method, body, idempotencyKey })
    return { queued: false, data }
  } catch (error) {
    if (!(error instanceof Error) || error.name !== 'OfflineError') throw error
    const item = queue()
    return { queued: true, item, optimistic: optimistic(item) }
  }
}
