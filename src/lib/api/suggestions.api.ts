import { apiFetch } from './client'
import type { Suggestion, SuggestionActionInput } from '@/types/suggestions.types'

interface SuggestionsResponse {
  suggestions: Suggestion[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

export async function getSuggestions(params?: { status?: string }): Promise<Suggestion[]> {
  const query = params?.status ? `?status=${params.status}` : ''
  const result = await apiFetch<SuggestionsResponse>(`/v1/suggestions${query}`)
  return result.suggestions ?? []
}

export async function takeSuggestionAction(id: string, input: SuggestionActionInput): Promise<void> {
  return apiFetch<void>(`/v1/suggestions/${id}/action`, { method: 'POST', body: input })
}
