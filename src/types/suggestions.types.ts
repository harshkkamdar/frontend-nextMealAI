export type SuggestionAction = 'approve' | 'reject' | 'dismiss'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'dismissed' | 'applied' | 'expired'
export type SuggestionType = 'meal_swap' | 'macro_adjustment' | 'workout_modification' | 'rest_day' | 'hydration' | 'sleep' | 'general'

export interface Suggestion {
  id: string
  user_id: string
  type: SuggestionType
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
