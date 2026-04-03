export type GeoPersonality = 'nurturing' | 'drill_sergeant' | 'balanced' | 'data_driven'
export type Theme = 'light' | 'dark' | 'system'
export type NotificationType = 'daily_summary' | 'meal_reminders' | 'workout_reminders' | 'goal_achievements'

export type RestTimerDuration = 60 | 90 | 120 | 180

export interface Settings {
  id: string
  user_id: string
  notifications_enabled: boolean
  notification_time: string
  notification_types: NotificationType[]
  geo_personality: GeoPersonality
  auto_apply_suggestions: boolean
  auto_apply_threshold: number
  theme: Theme
  language: string
  share_progress: boolean
  analytics_enabled: boolean
  rest_timer_seconds: RestTimerDuration
  created_at: string
  updated_at: string
}

export type SettingsUpdateInput = Partial<Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
