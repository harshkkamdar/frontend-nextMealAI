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
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import type { Settings, GeoPersonality, Theme } from '@/types/settings.types'

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

export default function SettingsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

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
        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            label="Profile"
            onClick={() => router.push('/settings/profile')}
          />
          <SettingsRow label="Email" value={user?.email ?? '---'} />
        </SettingsSection>

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

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-text-secondary mb-2">Theme</p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdate({ theme: opt.value })}
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
          </div>
          <SettingsRow label="Language" value={settings.language ?? 'en'} />
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
