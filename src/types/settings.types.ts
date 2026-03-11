export type GeoTone = 'supportive' | 'direct' | 'data_driven' | 'balanced'
export type GeoVerbosity = 'concise' | 'balanced' | 'detailed'
export type GeoEmojiUsage = 'none' | 'moderate' | 'frequent'

export interface GeoPersonality {
  tone: GeoTone
  verbosity: GeoVerbosity
  emoji_usage: GeoEmojiUsage
}

export interface NotificationSettings {
  push_enabled: boolean
  email_enabled: boolean
  daily_summary: boolean
  plan_suggestions: boolean
}

export interface Settings {
  id: string
  user_id: string
  geo_personality: GeoPersonality
  auto_apply_edits: boolean
  daily_evaluation_time: string // HH:mm
  notifications: NotificationSettings
  geo_personality_description?: string
  created_at: string
  updated_at: string
}

export type SettingsUpdateInput = Partial<Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
