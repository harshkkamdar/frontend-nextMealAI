'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { SettingsSection, SettingsRow } from '@/components/settings/settings-section'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getSettings, updateSettings } from '@/lib/api/settings.api'
import { logout } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import {
  LogOut,
  ChevronRight,
  CalendarDays,
  MessageCircle,
  BarChart3,
  FileText,
  Droplets,
  SmilePlus,
  Moon,
  Zap,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import type { Settings, GeoPersonality, Theme, RestTimerDuration } from '@/types/settings.types'

const PERSONALITY_OPTIONS: { value: GeoPersonality; label: string }[] = [
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'drill_sergeant', label: 'Drill Sergeant' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'data_driven', label: 'Data-Driven' },
]

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const REST_TIMER_OPTIONS: { value: RestTimerDuration; label: string }[] = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
]

const QUICK_LOG_ITEMS = [
  { icon: Droplets, label: 'Water', color: '#3B82F6', bg: 'bg-blue-50', route: '/logs/new/water' },
  { icon: SmilePlus, label: 'Mood', color: '#FF9F0A', bg: 'bg-amber-50', route: '/logs/new/mood' },
  { icon: Moon, label: 'Sleep', color: '#6366F1', bg: 'bg-indigo-50', route: '/logs/new/sleep' },
  { icon: Zap, label: 'Energy', color: '#E8663C', bg: 'bg-accent-light', route: '/logs/new/energy' },
  { icon: Scale, label: 'Weight', color: '#A855F7', bg: 'bg-purple-50', route: '/logs/new/weight' },
]

const FEATURE_LINKS: {
  icon: typeof CalendarDays
  label: string
  route: string
  color: string
  disabled?: boolean
}[] = [
  { icon: CalendarDays, label: 'My Plans', route: '/plans', color: '#E8663C' },
  { icon: MessageCircle, label: 'Chat History', route: '/chat', color: '#3B82F6' },
  { icon: BarChart3, label: 'Activity Log', route: '/logs', color: '#34C759' },
  { icon: FileText, label: 'Food Database', route: '/foods', color: '#6B6560' },
]

export default function SettingsPage() {
  useSetGeoScreen('settings', {})
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { setTheme: setAppTheme } = useTheme()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        if (s.theme) setAppTheme(s.theme)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [setAppTheme])

  const handleUpdate = useCallback(
    async (patch: Parameters<typeof updateSettings>[0]) => {
      if (!settings) return
      const optimistic = { ...settings, ...patch }
      setSettings(optimistic)
      try {
        const updated = await updateSettings(patch)
        setSettings(updated)
      } catch {
        setSettings(settings)
        toast.error('Failed to update settings')
      }
    },
    [settings]
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch {
      toast.error('Failed to log out')
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">More</h1>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageWrapper>
    )
  }

  if (!settings) {
    return (
      <PageWrapper>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">More</h1>
        <p className="text-text-secondary text-sm">Unable to load settings.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">More</h1>

      <div className="space-y-4">
        {/* Profile Card */}
        <button
          type="button"
          onClick={() => router.push('/settings/profile')}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white text-base font-semibold">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex flex-col items-start text-left min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate w-full">
              {user?.email?.split('@')[0] ?? 'Profile'}
            </span>
            <span className="text-xs text-text-secondary truncate w-full">
              {user?.email ?? '---'}
            </span>
          </div>
          <ChevronRight className="ml-auto w-4 h-4 shrink-0 text-text-tertiary" />
        </button>

        {/* Features */}
        <SettingsSection title="Features">
          {FEATURE_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => !item.disabled && router.push(item.route)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-surface-hover'
                )}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${item.color}14` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="font-medium text-text-primary">{item.label}</span>
                {item.disabled && (
                  <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    Soon
                  </span>
                )}
                <ChevronRight className="ml-auto w-4 h-4 text-text-tertiary" />
              </button>
            )
          })}
        </SettingsSection>

        {/* Quick Log */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary px-4 pt-4 pb-2">
            Quick Log
          </p>
          <div className="flex items-start justify-around px-4 py-3">
            {QUICK_LOG_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.route)}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full',
                      item.bg
                    )}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[11px] font-medium text-text-secondary">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsRow label="Enabled">
            <button
              type="button"
              role="switch"
              aria-checked={settings.notifications_enabled}
              onClick={() =>
                handleUpdate({ notifications_enabled: !settings.notifications_enabled })
              }
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                settings.notifications_enabled ? 'bg-accent' : 'bg-surface-hover'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  settings.notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </SettingsRow>
          <SettingsRow label="Reminder time">
            <input
              type="time"
              value={settings.notification_time ?? '08:00'}
              onChange={(e) => handleUpdate({ notification_time: e.target.value })}
              className="bg-transparent text-sm text-text-primary outline-none"
            />
          </SettingsRow>
        </SettingsSection>

        {/* Geo Personality */}
        <SettingsSection title="Geo Personality">
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {PERSONALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdate({ geo_personality: opt.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    settings.geo_personality === opt.value
                      ? 'bg-accent border-accent text-white'
                      : 'bg-background border-border text-text-primary hover:bg-surface-hover'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Workout Settings */}
        <SettingsSection title="Workout">
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-text-secondary mb-2">Default Rest Timer</p>
            <div className="flex gap-2">
              {REST_TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdate({ rest_timer_seconds: opt.value } as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    (settings.rest_timer_seconds ?? 90) === opt.value
                      ? 'bg-accent border-accent text-white'
                      : 'bg-background border-border text-text-primary hover:bg-surface-hover'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-text-secondary mb-2">Theme</p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    handleUpdate({ theme: opt.value })
                    setAppTheme(opt.value)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    settings.theme === opt.value
                      ? 'bg-accent border-accent text-white'
                      : 'bg-background border-border text-text-primary hover:bg-surface-hover'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-tertiary px-4 pb-2">Theme applies immediately</p>
          </div>
          <SettingsRow label="Language" value="English (coming soon)" />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <SettingsRow label="Share progress">
            <button
              type="button"
              role="switch"
              aria-checked={settings.share_progress}
              onClick={() => handleUpdate({ share_progress: !settings.share_progress })}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                settings.share_progress ? 'bg-accent' : 'bg-surface-hover'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  settings.share_progress ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </SettingsRow>
          <SettingsRow label="Analytics">
            <button
              type="button"
              role="switch"
              aria-checked={settings.analytics_enabled}
              onClick={() =>
                handleUpdate({ analytics_enabled: !settings.analytics_enabled })
              }
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                settings.analytics_enabled ? 'bg-accent' : 'bg-surface-hover'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  settings.analytics_enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </SettingsRow>
        </SettingsSection>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </PageWrapper>
  )
}
