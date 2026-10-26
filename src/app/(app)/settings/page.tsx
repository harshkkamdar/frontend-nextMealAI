'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { OfflineBand } from '@/components/shared/offline-band'
import { DeleteAccountSheet } from '@/components/settings/delete-account-sheet'
import { GLYPH, GROUP_CARD, SettingsMenu, SettingsRow, SettingsSection, SettingsSkeleton, SettingsSwitch, type MenuOption } from '@/components/settings/settings-section'
import { dayAndDate, formatClock, initials, nextWeekday, profileSummary, syncedLabel } from '@/components/settings/settings-format'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
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
import { goBack } from '@/lib/navigation'

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

// Each style previews how Geo would say the same thing (the menu shows what the choice does, mock "Grouped list").
const PERSONALITY_OPTIONS: MenuOption<GeoPersonality>[] = [
  { value: 'balanced', label: 'Balanced', detail: '"Protein is 48 g short. Greek yoghurt closes it."' },
  { value: 'nurturing', label: 'Nurturing', detail: '"Good day so far. A little more protein at dinner and you are there."' },
  { value: 'drill_sergeant', label: 'Drill sergeant', detail: '"48 g of protein left. Get it in before 8."' },
  { value: 'data_driven', label: 'Data-driven', detail: '"Protein 92 of 140 g, 66%. Gap: 48 g."' },
]

const REST_TIMER_OPTIONS: MenuOption<RestTimerDuration>[] = [
  { value: 60, label: '60 seconds' },
  { value: 90, label: '90 seconds' },
  { value: 120, label: '2 minutes' },
  { value: 180, label: '3 minutes' },
]

const WEEKDAYS: MenuOption<number>[] = [1, 2, 3, 4, 5, 6, 0].map((value) => ({
  value,
  label: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][value]!,
}))

const REMINDER_TIMES = ['06:00', '07:00', '07:30', '08:00', '09:00', '12:00', '18:00', '20:00']
/** The menu's times, plus a saved time that is not one of them so it still shows as chosen. */
const reminderOptions = (saved: string): MenuOption<string>[] =>
  [...new Set([...REMINDER_TIMES, saved])].sort().map((value) => ({ value, label: formatClock(value) }))

export default function SettingsPage() {
  useSetGeoScreen('settings', {})
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAdmin = useIsAdmin()
  const tilt = usePressTilt<HTMLButtonElement>()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingAi, setUpdatingAi] = useState(false)
  const [showAiConfirm, setShowAiConfirm] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showHealthConnect, setShowHealthConnect] = useState(false)
  const [showPlanNote, setShowPlanNote] = useState(false)
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

  // Every control saves itself: optimistic, reverted on failure with a Retry in the status capsule.
  async function handleUpdate(patch: Parameters<typeof updateSettings>[0]): Promise<boolean> {
    if (!settings) return false
    const previous = settings
    setSettings({ ...settings, ...patch })
    try {
      setSettings(await updateSettings(patch))
      return true
    } catch {
      setSettings(previous)
      toast.error("Couldn't save that. Try again.", { action: { label: 'Retry', onClick: () => void handleUpdate(patch) } })
      return false
    }
  }

  const handleNotificationChange = (enabled: boolean) => {
    void handleUpdate({ notifications_enabled: enabled })
    window.dispatchEvent(new CustomEvent('fiqr:notifications-changed', { detail: { enabled } }))
  }

  const handleReminderChange = async (value: string) => {
    if (await handleUpdate({ notification_time: value })) toast(`Geo nudges from ${formatClock(value)}`)
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
    toast(restored ? 'Subscription restored' : 'No active subscription found')
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

  const header = <PushedHeader title="Settings" onBack={() => goBack(router, '/dashboard')} backLabel="Back to Today" />

  if (loading || !settings || !profile) {
    return (
      <div className="mx-auto w-full max-w-md px-gutter pb-[calc(24px+var(--safe-bottom))]">
        {header}
        <div className="-mx-gutter mb-2.5 [&:empty]:hidden"><OfflineBand /></div>
        <div className="mt-1">
          {loading ? (
            <SettingsSkeleton />
          ) : (
            <div className={`${GROUP_CARD} p-4`}>
              <ErrorState onRetry={() => { setLoading(true); loadSettings() }}>I couldn&apos;t load your settings. Check your connection and try again.</ErrorState>
            </div>
          )}
        </div>
      </div>
    )
  }

  const profileName = profile.full_name || user?.email?.split('@')[0] || 'Profile'
  const summary = profileSummary(profile) || user?.email || 'Body, targets and goals'
  const aiEnabled = Boolean(profile.ai_consent_at)
  const native = isNative()
  const healthName = healthLabel()
  const lastSyncedValue = lastSynced ? syncedLabel(new Date(lastSynced)) : 'Never'
  const reminder = (settings.notification_time ?? '08:00').slice(0, 5)
  const checkInDay = settings.check_in_weekday ?? 0

  return (
    <div className="mx-auto w-full max-w-md px-gutter pb-[calc(24px+var(--safe-bottom))]">
      {header}
      <div className="-mx-gutter mb-2.5 [&:empty]:hidden"><OfflineBand /></div>

      <div className="enter-rows mt-1 flex flex-col gap-[22px]">
        <section aria-label="Profile">
          <button
            type="button"
            {...tilt}
            onClick={() => router.push('/settings/profile')}
            className={`${GROUP_CARD} flex min-h-[72px] w-full items-center gap-3 py-3 pl-3.5 pr-4 text-left`}
          >
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-body-sm font-bold text-ink">{initials(profileName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-headline text-ink">{profileName}</span>
              <span className="mt-0.5 block truncate text-[14px] leading-[1.35] text-ink-65">{summary}</span>
            </span>
            <ChevronRightIcon className={GLYPH} />
          </button>
        </section>

        <SettingsSection title="Subscription">
          {/* Plans are sold only in the phone app; on web the row explains that instead of opening the paywall. */}
          {native ? (
            <SettingsRow label="Plan" value={subscribed ? 'FIQR Plus' : 'Free'} href="/paywall" />
          ) : (
            <SettingsRow label="Plan" value="Free" onClick={() => setShowPlanNote(true)} />
          )}
          {native ? <SettingsRow label="Restore purchases" action onClick={() => void handleRestore()} /> : null}
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

        <div>
          <SettingsSection
            title="Reminders and check-in"
            footer={`Next check-in: ${dayAndDate(nextWeekday(checkInDay))}. Geo only nudges after your reminder time.`}
          >
            <SettingsRow label="Push notifications">
              <SettingsSwitch label="Push notifications" checked={settings.notifications_enabled} onChange={handleNotificationChange} />
            </SettingsRow>
            <SettingsMenu label="Reminder time" value={reminder} options={reminderOptions(reminder)} onChange={(value) => void handleReminderChange(value)} />
            <SettingsMenu label="Check-in day" value={checkInDay} options={WEEKDAYS} onChange={(day) => void handleUpdate({ check_in_weekday: day })} />
          </SettingsSection>
          {/* What the reminder will look like on the lock screen, at the chosen time. With nudges off it fades back
              instead of leaving, so nothing below jumps when the switch flips. */}
          <figure
            aria-label="Example nudge"
            aria-hidden={!settings.notifications_enabled || undefined}
            className={`mx-0.5 mt-2.5 grid transition-opacity duration-200 ${settings.notifications_enabled ? 'opacity-100' : 'opacity-35'} grid-cols-[32px_1fr_auto] gap-x-2.5 gap-y-0.5 rounded-[18px] bg-card/65 px-3 py-2.5 text-[14px] leading-[1.35] shadow-[0_0_0_.5px_rgba(17,28,53,.1)]`}
          >
            <span aria-hidden="true" className="row-span-2 grid size-8 place-items-center rounded-[8px] bg-ink text-[10px] font-extrabold tracking-[.02em] text-cream">FIQR</span>
            <b className="font-bold text-ink">Your check-in is ready</b>
            <time className="text-label font-normal text-ink-65">{formatClock(reminder)}</time>
            <span className="col-span-2 col-start-2 text-ink-80">Geo has read the week. Open FIQR to see what changes.</span>
          </figure>
        </div>

        <SettingsSection title="Coaching">
          <SettingsMenu label="Coaching style" value={settings.geo_personality} options={PERSONALITY_OPTIONS} onChange={(style) => void handleUpdate({ geo_personality: style })} />
          <SettingsMenu label="Rest timer" value={settings.rest_timer_seconds} options={REST_TIMER_OPTIONS} onChange={(seconds) => void handleUpdate({ rest_timer_seconds: seconds })} />
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

        <div className="flex flex-col items-center gap-3">
          <div className="w-full">
            <SettingsSection label="Account">
              <SettingsRow label={<span className="font-semibold">{loggingOut ? 'Logging out…' : 'Log out'}</span>} action disabled={loggingOut} onClick={() => void handleLogout()} />
            </SettingsSection>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteAccount(true)}
            className="min-h-11 px-4 text-body font-bold text-ink-65 underline decoration-ink-35 underline-offset-4"
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
        description="Geo can't coach without it. Your logs stay, and you can turn it back on any time."
        confirmLabel="Turn off"
        cancelLabel="Keep it on"
        variant="danger"
      />
      <BottomSheet open={showPlanNote} onClose={() => setShowPlanNote(false)} ariaLabel="Your plan">
        <div className="px-6 pb-4 pt-3">
          <h2 className="text-hero font-bold text-ink">Your plan lives in the app</h2>
          <p className="mt-2 text-body leading-[1.45] text-ink-65">FIQR Plus is sold in the FIQR app on iPhone and Android. Open it there to subscribe or change your plan.</p>
          <button type="button" onClick={() => setShowPlanNote(false)} className="mt-5 h-btn w-full rounded-full bg-ink text-body font-bold text-cream transition-transform duration-100 active:scale-[.97]">
            Got it
          </button>
        </div>
      </BottomSheet>
      <DeleteAccountSheet open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} onDownload={() => void handleDownload()} exporting={exporting} />
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
