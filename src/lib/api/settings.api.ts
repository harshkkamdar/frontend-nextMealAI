import { apiFetch } from './client'
import type { Settings, SettingsUpdateInput } from '@/types/settings.types'

export async function getSettings(): Promise<Settings> {
  return apiFetch<Settings>('/v1/settings')
}

export async function updateSettings(data: SettingsUpdateInput): Promise<Settings> {
  return apiFetch<Settings>('/v1/settings', { method: 'PATCH', body: data })
}
