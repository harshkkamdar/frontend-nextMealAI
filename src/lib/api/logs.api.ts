import { apiFetch } from './client'
import type { Log, LogsSummary } from '@/types/logs.types'

export async function getLogsSummary(period: 'day' | 'week' | 'month' = 'day'): Promise<LogsSummary> {
  return apiFetch<LogsSummary>(`/v1/logs/summary?period=${period}`)
}

export async function getLogs(params?: { date?: string; type?: string }): Promise<Log[]> {
  const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  return apiFetch<Log[]>(`/v1/logs${query}`)
}

export async function createLog(data: Partial<Log>): Promise<Log> {
  return apiFetch<Log>('/v1/logs', { method: 'POST', body: data })
}

export async function updateLog(id: string, data: Partial<Log>): Promise<Log> {
  return apiFetch<Log>(`/v1/logs/${id}`, { method: 'PATCH', body: data })
}

export async function deleteLog(id: string): Promise<void> {
  return apiFetch<void>(`/v1/logs/${id}`, { method: 'DELETE' })
}
