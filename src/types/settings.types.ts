// Actual backend settings DB schema
export interface Settings {
  id: string
  user_id: string
  notifications_enabled: boolean
  notification_time: string // HH:mm:ss
  notification_types: string[]
  geo_personality: string // plain string e.g. 'balanced', 'supportive'
  auto_apply_suggestions: boolean
  auto_apply_threshold: number
  theme: string
  language: string
  share_progress: boolean
  analytics_enabled: boolean
  created_at: string
  updated_at: string
}

export type SettingsUpdateInput = Partial<Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
