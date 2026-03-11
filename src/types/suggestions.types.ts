export type SuggestionAction = 'approve' | 'reject' | 'dismiss'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'dismissed'

export interface Suggestion {
  id: string
  user_id: string
  title: string
  description: string
  confidence?: number
  status: SuggestionStatus
  feedback?: string
  created_at: string
  updated_at: string
}

export interface SuggestionActionInput {
  action: SuggestionAction
  feedback?: string
}
