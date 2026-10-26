'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { OfflineBand } from '@/components/shared/offline-band'
import { DeleteAccountSheet } from '@/components/settings/delete-account-sheet'
import { GLYPH, SettingsRow, SettingsSection, SettingsSelect, SettingsSkeleton, SettingsSwitch } from '@/components/settings/settings-section'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { downloadExport } from '@/lib/api/account.api'
import { logout } from '@/lib/api/auth.api'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { getSettings, updateSettings } from '@/lib/api/settings.api'
import { isNative } from '@/lib/platform'
import { disconnectHealth, healthLabel, isHealthConnected, lastHealthSync } from '@/lib/platform/health'
import { isSubscribed, manageSubscription, restorePurchases } from '@/lib/platform/purchases'
import { useAuthStore } from '@/stores/auth.store'
import type { Profile } from '@/types/profile.types'
import type { GeoPersonality, RestTimerDuration, Settings } from '@/types/settings.types'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

const PERSONALITY_OPTIONS: { value: GeoPersonality; label: string }[] = [
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'drill_sergeant', label: 'Drill sergeant' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'data_driven', label: 'Data-driven' },
]

const REST_TIMER_OPTIONS: { value: RestTimerDuration; label: string }[] = [
  { value: 60, label: '60 seconds' },
  { value: 90, label: '90 seconds' },
  { value: 120, label: '2 minutes' },
  { value: 180, label: '3 minutes' },
]

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const

export default function SettingsPage() {
  useSetGeoScreen('settings', {})
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAdmin = useIsAdmin()
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingAi, setUpdatingAi] = useState(false)
  const [showAiConfirm, setShowAiConfirm] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showHealthConnect, setShowHealthConnect] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  const loadSettings = useCallback(() => {
    Promise.all([getSettings(), getProfile()])
      .then(([nextSettings, nextProfile]) => {
        setSettings(nextSettings)
        setProfile(nextProfile)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(loadSettings, [loadSettings])

  useEffect(() => {
    let active = true
    if (isNative()) void isSubscribed().then((value) => { if (active) setSubscribed(value) })
    if (healthLabel() !== null) {
      void Promise.all([isHealthConnected(), lastHealthSync()]).then(([nextConnected, nextLastSynced]) => {
        if (!active) return
        setConnected(nextConnected)
        setLastSynced(nextLastSynced)
      })
    }
    return () => { active = false }
  }, [])

  useEffect(() => {
    return () => {
      if (reminderTimer.current) clearTimeout(reminderTimer.current)
    }
  }, [])

  const handleUpdate = useCallback(
    async (patch: Parameters<typeof updateSettings>[0]) => {
      if (!settings) return
      const previous = settings
      setSettings({ ...settings, ...patch })
      try {
        const updated = await updateSettings(patch)
        setSettings(updated)
      } catch {
        setSettings(previous)
        toast.error("Couldn't save that. Try again.")
      }
    },
    [settings],
  )

  const handleNotificationChange = (enabled: boolean) => {
    void handleUpdate({ notifications_enabled: enabled })
    window.dispatchEvent(new CustomEvent('fiqr:notifications-changed', { detail: { enabled } }))
  }

  const handleReminderChange = (value: string) => {
    setSettings((current) => current ? { ...current, notification_time: value } : current)
    if (reminderTimer.current) clearTimeout(reminderTimer.current)
    reminderTimer.current = setTimeout(() => {
      void handleUpdate({ notification_time: value })
    }, 600)
  }

  const handleAiConsent = async (enabled: boolean) => {
    setUpdatingAi(true)
    try {
      const updated = await updateProfile({ ai_consent: enabled })
      setProfile(updated)
      setShowAiConfirm(false)
    } catch {
      toast.error("Couldn't change AI processing. Try again.")
    } finally {
      setUpdatingAi(false)
    }
  }

  const handleDownload = async () => {
    setExporting(true)
    try {
      await downloadExport()
      toast.success('Your data is ready')
    } catch {
      toast.error("Couldn't download your data. Try again.")
    } finally {
      setExporting(false)
    }
  }

  const handleRestore = async () => {
    const restored = await restorePurchases()
    if (restored) setSubscribed(true)
    toast.success(restored ? 'Subscription restored' : 'No active subscription found')
  }

  const handleHealthChange = (enabled: boolean) => {
    if (enabled) {
      setShowHealthConnect(true)
      return
    }
    void disconnectHealth().then(() => {
      setConnected(false)
      setLastSynced(null)
    })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch {
      toast.error("Couldn't log out. Try again.")
      setLoggingOut(false)
    }
  }

  const header = <PushedHeader title="Settings" onBack={() => router.push('/dashboard')} backLabel="Back to Today" />

  if (loading || !settings || !profile) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        {header}
        <div className="-mx-4 mb-4 [&:empty]:hidden"><OfflineBand /></div>
        <div className="mt-2">
          {loading ? (
            <SettingsSkeleton />
          ) : (
            <ErrorState onRetry={() => { setLoading(true); loadSettings() }}>I couldn&apos;t load your settings. Check your connection and try again.</ErrorState>
          )}
        </div>
      </div>
    )
  }

  const profileName = profile.full_name || user?.email?.split('@')[0] || 'Profile'
  const email = user?.email ?? ''
  const aiEnabled = Boolean(profile.ai_consent_at)
  const native = isNative()
  const healthName = healthLabel()
  const lastSyncedValue = lastSynced
    ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(lastSynced))
    : 'Never'

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {header}
      <div className="-mx-4 mb-4 [&:empty]:hidden"><OfflineBand /></div>

      <div className="enter-rows mt-2 flex flex-col gap-7">
        <section aria-label="Profile">
          <button
            type="button"
            onClick={() => router.push('/settings/profile')}
            className="flex min-h-16 w-full items-center gap-3 rounded-[24px] border border-ink-06 bg-card px-4 py-2.5 text-left active:bg-ink-04"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-semibold text-ink">{profileName}</span>
              <span className="block truncate text-[14px] text-ink-65">{email || 'Body, targets and goals'}</span>
            </span>
            <ChevronRightIcon className={GLYPH} />
          </button>
        </section>

        <SettingsSection title="Subscription">
          {!native ? (
            <SettingsRow label="Plan" value="Manage in the app" />
          ) : subscribed ? (
            <SettingsRow label="Plan" value="FIQR Plus" />
          ) : (
            <SettingsRow label="Plan" value="Free" href="/paywall" />
          )}
          {native ? <SettingsRow label="Restore purchases" onClick={() => void handleRestore()} /> : null}
          {native && subscribed ? <SettingsRow label="Manage subscription" onClick={() => void manageSubscription()} /> : null}
        </SettingsSection>

        {healthName ? (
          <SettingsSection title={healthName} footer="Reads steps, active energy, weight, sleep and workouts. Saves the workouts you finish in FIQR.">
            <SettingsRow label="Sync health data">
              <SettingsSwitch label="Sync health data" checked={connected} onChange={handleHealthChange} />
            </SettingsRow>
            <SettingsRow label="Last synced" value={lastSyncedValue} />
          </SettingsSection>
        ) : null}

        <SettingsSection title="Notifications" footer="Geo nudges you when your check-in is ready.">
          <SettingsRow label="Push notifications">
            <SettingsSwitch label="Push notifications" checked={settings.notifications_enabled} onChange={handleNotificationChange} />
          </SettingsRow>
          <SettingsRow label="Reminder time">
            <input
              type="time"
              aria-label="Reminder time"
              value={settings.notification_time ?? '08:00'}
              onChange={(event) => handleReminderChange(event.target.value)}
              className="-my-2.5 h-11 min-w-0 rounded-[10px] bg-transparent text-right text-[15px] text-ink-65 outline-none tabular-nums focus-visible:bg-ink-04 [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <span aria-hidden="true" className={GLYPH} />
          </SettingsRow>
          <SettingsSelect label="Check-in day" value={settings.check_in_weekday} options={WEEKDAYS} onChange={(day) => void handleUpdate({ check_in_weekday: day })} />
        </SettingsSection>

        <SettingsSection title="Coaching">
          <SettingsSelect label="Geo's style" value={settings.geo_personality} options={PERSONALITY_OPTIONS} onChange={(style) => void handleUpdate({ geo_personality: style })} />
          <SettingsSelect label="Rest timer" value={settings.rest_timer_seconds} options={REST_TIMER_OPTIONS} onChange={(seconds) => void handleUpdate({ rest_timer_seconds: seconds })} />
        </SettingsSection>

        <SettingsSection title="Library">
          <SettingsRow label="My plans" onClick={() => router.push('/plans')} />
          <SettingsRow label="Chat history" onClick={() => router.push('/chat')} />
          <SettingsRow label="Activity log" onClick={() => router.push('/logs')} />
          <SettingsRow label="Food database" onClick={() => router.push('/foods')} />
          {isAdmin ? <SettingsRow label="Admin dashboard" onClick={() => router.push('/admin')} /> : null}
        </SettingsSection>

        <SettingsSection
          title="Data and AI"
          footer="With AI processing on, your food logs, photos, weight and messages go to our model providers so Geo can coach you. The privacy policy names them."
        >
          <SettingsRow label="AI processing">
            <SettingsSwitch
              label="AI processing"
              checked={aiEnabled}
              disabled={updatingAi}
              onChange={(enabled) => {
                if (enabled) void handleAiConsent(true)
                else setShowAiConfirm(true)
              }}
            />
          </SettingsRow>
          <SettingsRow label="Download my data" onClick={() => void handleDownload()} disabled={exporting}>
            {exporting ? <span aria-label="Downloading" role="status" className="size-5 animate-spin rounded-full border-2 border-ink-16 border-t-ink" /> : undefined}
          </SettingsRow>
          <SettingsRow label="Privacy policy" onClick={() => router.push('/privacy')} />
          <SettingsRow label="Support" onClick={() => router.push('/support')} />
        </SettingsSection>

        <SettingsSection
          title="About"
          footer="FIQR is a wellness and fitness coaching app, not a medical device. Geo doesn't diagnose or treat conditions or advise on medication. Check with a doctor or registered dietitian before making medical decisions."
        >
          <SettingsRow label="Version" value={APP_VERSION} />
        </SettingsSection>

        <div className="flex flex-col gap-3">
          <SettingsSection>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-[16px] font-semibold text-ink active:bg-ink-04 disabled:text-ink-65"
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </SettingsSection>
          <button
            type="button"
            onClick={() => setShowDeleteAccount(true)}
            className="mx-auto min-h-11 px-4 text-[15px] font-semibold text-ink-65 underline decoration-ink-35 underline-offset-4"
          >
            Delete account
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showAiConfirm}
        onClose={() => { if (!updatingAi) setShowAiConfirm(false) }}
        onConfirm={() => handleAiConsent(false)}
        title="Turn off AI processing?"
        description="Geo can't coach without it. You can turn it back on any time."
        confirmLabel="Turn off"
        cancelLabel="Keep it on"
        variant="danger"
      />
      <DeleteAccountSheet open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
      <HealthConnectSheet
        open={showHealthConnect}
        onClose={() => setShowHealthConnect(false)}
        onConnected={() => {
          setConnected(true)
          void lastHealthSync().then(setLastSynced)
        }}
      />
    </div>
  )
}
