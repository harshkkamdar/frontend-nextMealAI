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

export async function deleteLog(id: string): Promise<void> {
  await apiFetch(`/v1/logs/${id}`, { method: 'DELETE' })
}
