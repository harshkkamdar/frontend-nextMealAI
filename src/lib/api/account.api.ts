import { useAuthStore } from '@/stores/auth.store'
import { API_BASE, apiFetch } from './client'

export async function deleteAccount(): Promise<void> {
  await apiFetch('/v1/account', {
    method: 'DELETE',
    body: { confirm: 'DELETE' },
  })
}

export async function downloadExport(): Promise<void> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${API_BASE}/v1/account/export`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to download account export')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'fiqr-export.json'
  link.click()
  URL.revokeObjectURL(url)
}
