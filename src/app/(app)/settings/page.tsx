'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { DeleteAccountSheet } from '@/components/settings/delete-account-sheet'
import { SettingsRow, SettingsSection } from '@/components/settings/settings-section'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { downloadExport } from '@/lib/api/account.api'
import { logout } from '@/lib/api/auth.api'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { getSettings, updateSettings } from '@/lib/api/settings.api'
import { isNative } from '@/lib/platform'
import { disconnectHealth, healthLabel, isHealthConnected, lastHealthSync } from '@/lib/platform/health'
import { isSubscribed, manageSubscription, restorePurchases } from '@/lib/platform/purchases'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import type { Profile } from '@/types/profile.types'
import type { GeoPersonality, RestTimerDuration, Settings } from '@/types/settings.types'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

const PERSONALITY_OPTIONS: { value: GeoPersonality; label: string }[] = [
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'drill_sergeant', label: 'Drill Sergeant' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'data_driven', label: 'Data-Driven' },
]

const REST_TIMER_OPTIONS: { value: RestTimerDuration; label: string }[] = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
]

const WEEKDAYS = [
  { value: 0, short: 'S', label: 'Sunday' },
  { value: 1, short: 'M', label: 'Monday' },
  { value: 2, short: 'T', label: 'Tuesday' },
  { value: 3, short: 'W', label: 'Wednesday' },
  { value: 4, short: 'T', label: 'Thursday' },
  { value: 5, short: 'F', label: 'Friday' },
  { value: 6, short: 'S', label: 'Saturday' },
] as const

function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label="Back to dashboard" className="text-ink">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Settings</h1>
    </div>
  )
}

function RowChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-ink-50"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function SettingsSwitch({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 rounded-full p-0.5 disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-ink-08',
      )}
    >
      <span
        className={cn(
          'block h-6 w-6 rounded-full bg-card transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

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

  useEffect(() => {
    Promise.all([getSettings(), getProfile()])
      .then(([nextSettings, nextProfile]) => {
        setSettings(nextSettings)
        setProfile(nextProfile)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

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
        toast.error('Failed to update settings')
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
      toast.error('Failed to update AI processing')
    } finally {
      setUpdatingAi(false)
    }
  }

  const handleDownload = async () => {
    setExporting(true)
    try {
      await downloadExport()
      toast.success('Export ready')
    } catch {
      toast.error('Failed to download data')
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
      toast.error('Failed to log out')
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <BackHeader onBack={() => router.push('/dashboard')} />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageWrapper>
    )
  }

  if (!settings || !profile) {
    return (
      <PageWrapper>
        <BackHeader onBack={() => router.push('/dashboard')} />
        <p className="text-[15.5px] text-ink-62">Unable to load settings.</p>
      </PageWrapper>
    )
  }

  const profileName = profile.full_name || user?.email?.split('@')[0] || 'Profile'
  const email = user?.email ?? '---'
  const aiEnabled = Boolean(profile.ai_consent_at)
  const native = isNative()
  const healthName = healthLabel()
  const lastSyncedValue = lastSynced
    ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(lastSynced))
    : 'Never'

  return (
    <PageWrapper>
      <BackHeader onBack={() => router.push('/dashboard')} />

      <div className="space-y-7">
        <SettingsSection title="Profile">
          <button
            type="button"
            onClick={() => router.push('/settings/profile')}
            className="min-h-14 w-full px-[14px] py-2.5 flex items-center gap-3 text-left"
          >
            <span className="w-10 h-10 rounded-full bg-ink-08 border border-ink-16 flex shrink-0 items-center justify-center text-ink">
              <PersonIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15.5px] font-semibold text-ink">{profileName}</span>
              <span className="block truncate text-[13.5px] text-ink-55">{email}</span>
            </span>
            <RowChevron />
          </button>
        </SettingsSection>

        <SettingsSection title="Subscription">
          {!native ? (
            <SettingsRow label="Plan" value="Manage in the FIQR app" />
          ) : subscribed ? (
            <SettingsRow label="Plan" value="FIQR Plus" />
          ) : (
            <Link href="/paywall" className="min-h-14 w-full px-[14px] flex items-center justify-between text-left text-[15.5px]">
              <span className="font-medium text-ink">Plan</span>
              <span className="flex items-center gap-2"><span className="text-[13.5px] text-ink-55">Free</span><RowChevron /></span>
            </Link>
          )}
          {native ? <SettingsRow label="Restore purchases" onClick={() => void handleRestore()} /> : null}
          {native && subscribed ? <SettingsRow label="Manage subscription" onClick={() => void manageSubscription()} /> : null}
        </SettingsSection>

        <SettingsSection title="Library">
          <SettingsRow label="My plans" onClick={() => router.push('/plans')} />
          <SettingsRow label="Chat history" onClick={() => router.push('/chat')} />
          <SettingsRow label="Activity log" onClick={() => router.push('/logs')} />
          <SettingsRow label="Food database" onClick={() => router.push('/foods')} />
          {isAdmin ? <SettingsRow label="Admin dashboard" onClick={() => router.push('/admin')} /> : null}
        </SettingsSection>

        <div>
          <SettingsSection title="Notifications">
            <SettingsRow label="Push notifications">
              <SettingsSwitch
                label="Push notifications"
                checked={settings.notifications_enabled}
                onChange={handleNotificationChange}
              />
            </SettingsRow>
            <SettingsRow label="Reminder time">
              <input
                type="time"
                value={settings.notification_time ?? '08:00'}
                onChange={(event) => handleReminderChange(event.target.value)}
                className="bg-transparent text-[15.5px] text-ink outline-none"
              />
            </SettingsRow>
          </SettingsSection>
          <p className="mt-2 px-[14px] text-[13px] text-ink-55">
            Geo nudges you when a check-in is ready or you&apos;ve gone quiet. No marketing.
          </p>
        </div>

        <div>
          <SettingsSection title="Check-in day">
            <div className="min-h-14 px-[14px] py-2.5 flex items-center justify-between gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  aria-label={day.label}
                  aria-pressed={settings.check_in_weekday === day.value}
                  onClick={() => void handleUpdate({ check_in_weekday: day.value })}
                  className={cn(
                    'h-9 w-9 rounded-full text-[13.5px] font-semibold',
                    settings.check_in_weekday === day.value
                      ? 'bg-ink text-cream'
                      : 'bg-ink-08 text-ink',
                  )}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </SettingsSection>
          <p className="mt-2 px-[14px] text-[13px] text-ink-55">
            Your weekly check-in lands on this day.
          </p>
        </div>

        {healthName ? (
          <div>
            <SettingsSection title={healthName}>
              <SettingsRow label="Sync health data">
                <SettingsSwitch label="Sync health data" checked={connected} onChange={handleHealthChange} />
              </SettingsRow>
              <SettingsRow label="Last synced" value={lastSyncedValue} />
            </SettingsSection>
            <p className="mt-2 px-[14px] text-[13px] text-ink-55">
              Reads steps, active energy, weight, sleep and workouts. Saves workouts you finish in FIQR.
            </p>
          </div>
        ) : null}

        <SettingsSection title="Geo">
          <div className="px-[14px] py-3 flex flex-wrap gap-2">
            {PERSONALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void handleUpdate({ geo_personality: option.value })}
                className={cn(
                  'rounded-full px-3 h-9 text-[13.5px] font-semibold',
                  settings.geo_personality === option.value
                    ? 'bg-accent text-cream'
                    : 'bg-ink-08 text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Training">
          <div className="px-[14px] py-3">
            <p className="mb-2 text-[13px] font-semibold text-ink-62">Rest timer</p>
            <div className="flex flex-wrap gap-2">
              {REST_TIMER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void handleUpdate({ rest_timer_seconds: option.value })}
                  className={cn(
                    'rounded-full px-3 h-9 text-[13.5px] font-semibold',
                    settings.rest_timer_seconds === option.value
                      ? 'bg-accent text-cream'
                      : 'bg-ink-08 text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Data & AI">
          <div>
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
            <p className="px-[14px] pb-4 text-[13px] leading-[1.45] text-ink-62">
              Your food logs, photos, weight and messages are sent to our model providers to generate coaching. See the privacy policy for who they are.
            </p>
          </div>
          <SettingsRow label="Download my data" onClick={() => void handleDownload()}>
            {exporting ? (
              <span
                aria-label="Downloading"
                className="h-5 w-5 rounded-full border-2 border-ink-16 border-t-ink animate-spin"
              />
            ) : undefined}
          </SettingsRow>
          <SettingsRow label="Privacy policy" onClick={() => router.push('/privacy')} />
          <SettingsRow label="Support" onClick={() => router.push('/support')} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="Version" value={APP_VERSION} />
          <p className="px-[14px] py-4 text-[13px] leading-[1.45] text-ink-62">
            FIQR is a wellness and fitness coaching app, not a medical device. Geo does not diagnose or treat conditions or advise on medication. Check with a doctor or registered dietitian before making medical decisions.
          </p>
        </SettingsSection>

        <div>
          <SecondaryButton type="button" onNavy={false} disabled={loggingOut} onClick={handleLogout}>
            {loggingOut ? 'Logging out...' : 'Log out'}
          </SecondaryButton>
          <button
            type="button"
            onClick={() => setShowDeleteAccount(true)}
            className="text-[15.5px] font-semibold text-ink-60 underline-offset-4 underline mt-4 mx-auto block"
          >
            Delete account
          </button>
        </div>
      </div>

      <BottomSheet
        open={showAiConfirm}
        onClose={() => setShowAiConfirm(false)}
        dismissible={!updatingAi}
        ariaLabel="Turn off AI processing?"
      >
        <div className="px-gutter pb-6 pt-3">
          <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Turn off AI processing?</h2>
          <p className="mt-3 text-[15.5px] leading-[1.45] text-ink-62">
            Geo can&apos;t coach without it. You can turn it back on any time.
          </p>
          <div className="mt-5">
            <SecondaryButton
              type="button"
              onNavy={false}
              disabled={updatingAi}
              onClick={() => void handleAiConsent(false)}
            >
              Turn off
            </SecondaryButton>
          </div>
          <button
            type="button"
            disabled={updatingAi}
            onClick={() => setShowAiConfirm(false)}
            className="mx-auto mt-4 block text-[15.5px] font-semibold text-ink-60"
          >
            Keep on
          </button>
        </div>
      </BottomSheet>

      <DeleteAccountSheet
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
      <HealthConnectSheet
        open={showHealthConnect}
        onClose={() => setShowHealthConnect(false)}
        onConnected={() => {
          setConnected(true)
          void lastHealthSync().then(setLastSynced)
        }}
      />
    </PageWrapper>
  )
}
