import { apiFetch } from './client'
import type { Log, LogsSummary, CreateLogInput } from '@/types/logs.types'

export async function getLogs(params?: { type?: string; days?: number; limit?: number; offset?: number }): Promise<Log[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.days) query.set('days', String(params.days))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  const res = await apiFetch<{ logs: Log[] } | Log[]>(`/v1/logs${qs ? `?${qs}` : ''}`)
  return Array.isArray(res) ? res : res.logs ?? []
}

export async function getLogsSummary(period: 'day' | 'week' | 'month'): Promise<LogsSummary> {
  return apiFetch<LogsSummary>(`/v1/logs/summary?period=${period}`)
}

export async function createLog(data: CreateLogInput): Promise<Log> {
  return apiFetch<Log>('/v1/logs', { method: 'POST', body: data })
}

/**
 * FE-RCA F3 — batch create. The FE wants to commit a multi-item meal as
 * one user-intent unit instead of N sequential one-food sheet opens.
 *
 * Backend status: the plural `/v1/logs/batch` endpoint (BE Phase 6a) is
 * pending. Until it ships, we fan out N parallel `createLog` calls — the
 * UX win (one tap to commit the whole meal) is independent of the
 * server-side atomicity win, and this function is the single seam to
 * swap in `/v1/logs/batch` later without touching any caller.
 *
 * Failure semantics: returns the array of successfully-created Log rows.
 * Failures are surfaced via `failures.length` so the caller can render a
 * partial-success toast ("Logged 3 of 4 items — couldn't find 'maca'").
 */
export interface BatchCreateLogResult {
  created: Log[]
  failures: Array<{ index: number; error: string }>
}

export async function createLogs(items: CreateLogInput[]): Promise<BatchCreateLogResult> {
  if (items.length === 0) return { created: [], failures: [] }

  const settled = await Promise.allSettled(items.map((item) => createLog(item)))
  const created: Log[] = []
  const failures: BatchCreateLogResult['failures'] = []
  settled.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      created.push(res.value)
    } else {
      const error = res.reason instanceof Error ? res.reason.message : 'Failed to create log'
      failures.push({ index, error })
    }
  })
  return { created, failures }
}

export async function updateLog(
  id: string,
  payload: Partial<Log['payload']>
): Promise<Log> {
  return apiFetch<Log>(`/v1/logs/${id}`, { method: 'PATCH', body: { payload } })
}

export async function deleteLog(id: string): Promise<void> {
  await apiFetch(`/v1/logs/${id}`, { method: 'DELETE' })
}

export async function bulkDeleteLogs(ids: string[]): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>('/v1/logs/bulk-delete', { method: 'POST', body: { ids } })
}
