import { useAuthStore } from '@/stores/auth.store'
import { kvGet, kvSet } from '@/lib/platform/storage'

interface CachedPayload<T> {
  payload: T
  savedAt: string
}

function cacheKey(key: string): string {
  const userId = useAuthStore.getState().user?.id ?? 'anonymous'
  return `fiqr:cache:${userId}:${key}`
}

export async function remember(key: string, payload: unknown): Promise<void> {
  await kvSet(cacheKey(key), JSON.stringify({ payload, savedAt: new Date().toISOString() }))
}

export async function recall<T>(key: string): Promise<CachedPayload<T> | null> {
  const cached = await kvGet(cacheKey(key))
  if (!cached) return null
  try {
    return JSON.parse(cached) as CachedPayload<T>
  } catch {
    return null
  }
}
