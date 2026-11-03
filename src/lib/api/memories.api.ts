import { apiFetch } from './client'

export interface ProfileMemory {
  id: string
  content: string
  type: string
  created_at: string
}

export async function getProfileMemories(): Promise<ProfileMemory[]> {
  const response = await apiFetch<{ memories?: ProfileMemory[] }>('/v1/memories?limit=50')
  return response.memories ?? []
}

export async function forgetMemory(id: string): Promise<void> {
  await apiFetch(`/v1/memories/${id}/archive`, {
    method: 'POST',
    body: { reason: 'Removed by the user in Settings' },
  })
}
