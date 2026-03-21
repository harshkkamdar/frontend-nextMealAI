import { apiFetch } from './client'
import type { Suggestion, SuggestionActionInput } from '@/types/suggestions.types'

export async function getSuggestions(params?: { status?: string; type?: string }): Promise<Suggestion[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.type) query.set('type', params.type)
  const qs = query.toString()
  const res = await apiFetch<{ suggestions: Suggestion[] } | Suggestion[]>(`/v1/suggestions${qs ? `?${qs}` : ''}`)
  return Array.isArray(res) ? res : res.suggestions ?? []
}

export async function takeSuggestionAction(id: string, input: SuggestionActionInput): Promise<void> {
  await apiFetch(`/v1/suggestions/${id}/action`, { method: 'POST', body: input })
}
