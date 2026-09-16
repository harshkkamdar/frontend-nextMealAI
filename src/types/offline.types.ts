export type QueueKind =
  | 'food_log'
  | 'log'
  | 'workout_start'
  | 'workout_patch'
  | 'workout_complete'
  | 'favourite_log'
  | 'meal_copy'

export interface QueueItem {
  id: string
  kind: QueueKind
  method: 'POST' | 'PATCH'
  path: string
  body: unknown
  createdAt: string
  attempts: number
  lastError?: string
}

export type OfflineResult<T> =
  | { queued: true; item: QueueItem; optimistic: T }
  | { queued: false; data: T }
