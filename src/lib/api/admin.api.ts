/**
 * FB-R6-S2-v2 · Admin dashboard API wrappers.
 *
 * `getAdminMetrics` uses the shared apiFetch (JSON path, refresh-token
 * handling included).
 *
 * `exportActiveUsersCsv` is a direct fetch because apiFetch parses JSON;
 * CSV needs the raw Blob + the Content-Disposition filename. We still
 * carry the auth header manually.
 */

import { apiFetch } from './client'
import { useAuthStore } from '@/stores/auth.store'
import type { AdminMetricsResponse } from '@/types/admin.types'

export async function getAdminMetrics(): Promise<AdminMetricsResponse> {
  return apiFetch<AdminMetricsResponse>('/v1/admin/metrics')
}

export async function exportActiveUsersCsv(): Promise<{ blob: Blob; filename: string }> {
  const accessToken = useAuthStore.getState().accessToken
  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const res = await fetch('/api/v1/admin/active-users/export.csv', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`CSV export failed: ${res.status}`)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^";]+)"?/)
  const today = new Date().toISOString().slice(0, 10)
  const filename = match ? match[1] : `active-users-${today}.csv`

  return { blob, filename }
}
