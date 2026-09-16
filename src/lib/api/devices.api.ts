import { apiFetch } from './client'

export interface RegisterDeviceInput {
  token: string
  platform: 'ios' | 'android' | 'web'
  app_version: string
}

export async function registerDevice(input: RegisterDeviceInput): Promise<void> {
  await apiFetch<void>('/v1/devices', { method: 'POST', body: input })
}

export async function unregisterDevice(token: string): Promise<void> {
  await apiFetch<void>(`/v1/devices/${encodeURIComponent(token)}`, { method: 'DELETE' })
}
