import { apiFetch } from './client'

export interface ProfileMemory {
  id: string
  content: string
  type: string
  created_at: string
  /** expires_at: a short-term note (a sore knee this week) that drops out after this time. */
  metadata?: { expires_at?: string } | null
}

/** Every note Geo keeps (there is no cap), leaving out short-term ones already past their end. */
export async function getProfileMemories(): Promise<ProfileMemory[]> {
  const response = await apiFetch<{ memories?: ProfileMemory[] }>('/v1/memories?limit=500')
  const now = new Date().toISOString()
  return (response.memories ?? []).filter((memory) => !memory.metadata?.expires_at || memory.metadata.expires_at > now)
}

export async function forgetMemory(id: string): Promise<void> {
  await apiFetch(`/v1/memories/${id}/archive`, {
    method: 'POST',
    body: { reason: 'Removed by the user in Settings' },
  })
}
