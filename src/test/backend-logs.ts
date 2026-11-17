import type { Log } from '@/types/logs.types'

/** YYYY-MM-DD `days` from `date`. */
export const shiftDay = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

/**
 * GET /v1/logs as the backend answers it. Mirrors logs.controller.ts getLogs (days path) with GetLogsQuerySchema:
 * limit defaults to 50 and over 100 is a 400, the window runs from today-(days-1) to today+7 (meal prep), newest
 * created_at first, at most min(500, offset+limit+200) rows read, and the reply carries `pagination.hasMore`.
 */
export function backendGetLogs(rows: Log[], today: string) {
  return (path: string) => {
    const q = new URL(path, 'http://api').searchParams
    const limit = Number(q.get('limit') ?? 50)
    const offset = Number(q.get('offset') ?? 0)
    if (limit > 100) return Promise.reject(new Error('400 VALIDATION_ERROR: Number must be less than or equal to 100'))
    const days = Number(q.get('days'))
    const start = shiftDay(today, -(days - 1))
    const end = shiftDay(today, 7)
    const merged = rows
      .filter((row) => (!q.get('type') || row.type === q.get('type')) && (!days || (row.local_date! >= start && row.local_date! <= end)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, days ? Math.min(500, offset + limit + 200) : undefined)
    return Promise.resolve({ logs: merged.slice(offset, offset + limit), pagination: { total: merged.length, limit, offset, hasMore: offset + limit < merged.length } })
  }
}

/** A `logs` row as select * returns it. */
export function logRow(id: string, type: string, localDate: string, createdAt: string, payload: Record<string, unknown>): Log {
  return { id, user_id: 'u', type, source: 'manual', local_date: localDate, deleted_at: null, client_dedupe_key: null, payload, created_at: createdAt, updated_at: null } as unknown as Log
}
