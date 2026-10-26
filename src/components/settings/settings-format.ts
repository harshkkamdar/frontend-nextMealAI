import type { Profile } from '@/types/profile.types'

const GOAL_WORDS: Record<string, string> = {
  fat_loss: 'fat loss',
  muscle_gain: 'muscle gain',
  maintenance: 'maintenance',
  body_recomposition: 'recomposition',
  improve_health: 'better health',
  athletic_performance: 'performance',
}

/** "78.2 kg, 2,180 kcal a day, fat loss": the profile card's one-line summary; only the parts the profile has. */
export function profileSummary(profile: Pick<Profile, 'current_weight_kg' | 'daily_calorie_target' | 'primary_goal'>): string {
  const parts: string[] = []
  if (profile.current_weight_kg != null) parts.push(`${Number(profile.current_weight_kg).toFixed(1)} kg`)
  if (profile.daily_calorie_target != null) parts.push(`${profile.daily_calorie_target.toLocaleString('en-AU')} kcal a day`)
  const goal = profile.primary_goal ? GOAL_WORDS[profile.primary_goal] : undefined
  if (goal) parts.push(goal)
  return parts.join(', ')
}

/** Up to two initials from a name ("Sam Rivera" -> "SR"); one letter for a one-word name. */
export function initials(name: string): string {
  const words = name.trim().split(/[\s-]+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
}

/** "HH:MM" or "HH:MM:SS" -> "8:00 am" (en-AU, lower case like iOS in Australia). */
export function formatClock(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

/** The next date that falls on `weekday` (0 Sunday .. 6 Saturday), today included. */
export function nextWeekday(weekday: number, now = new Date()): Date {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  date.setDate(date.getDate() + ((weekday - date.getDay() + 7) % 7))
  return date
}

/** "Sunday 1 Nov" */
export function dayAndDate(date: Date): string {
  return `${date.toLocaleDateString('en-AU', { weekday: 'long' })} ${date.getDate()} ${date.toLocaleDateString('en-AU', { month: 'short' })}`
}

/** "Today, 7:42 am", or "24 Oct, 7:42 am" for an earlier day. */
export function syncedLabel(at: Date, now = new Date()): string {
  const time = formatClock(`${at.getHours()}:${at.getMinutes()}`)
  return at.toDateString() === now.toDateString() ? `Today, ${time}` : `${at.getDate()} ${at.toLocaleDateString('en-AU', { month: 'short' })}, ${time}`
}
