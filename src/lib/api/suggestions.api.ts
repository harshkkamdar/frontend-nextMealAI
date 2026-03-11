import { apiFetch } from './client'
import type { Suggestion, SuggestionActionInput } from '@/types/suggestions.types'

export async function getSuggestions(params?: { status?: string }): Promise<Suggestion[]> {
  const query = params?.status ? `?status=${params.status}` : ''
  return apiFetch<Suggestion[]>(`/v1/suggestions${query}`)
}

export async function takeSuggestionAction(id: string, input: SuggestionActionInput): Promise<void> {
  return apiFetch<void>(`/v1/suggestions/${id}/action`, { method: 'POST', body: input })
}
