'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  emphasizeGeoMeasurements,
  formatDashboardDate,
  getDashboardFirstName,
  getDashboardGeoLine,
} from '@/components/dashboard/dashboard-helpers'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { MacroBreakdownSheet } from '@/components/shared/macro-breakdown-sheet'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'
import { MetricTile } from '@/components/ui/fiqr/metric-tile'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { OfflineError } from '@/lib/api/client'
import { getDashboardCheckIn, type DashboardCheckIn } from '@/lib/api/dashboard.api'
import { createLog, getLogs, getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import type { MacroKey } from '@/lib/macros'
import { computeNudges } from '@/lib/nudges'
import { todayLocalISO } from '@/lib/timezone'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import type { Log, LogsSummary } from '@/types/logs.types'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'
import type { Suggestion } from '@/types/suggestions.types'

type QuickLogType = 'water' | 'mood' | 'sleep' | 'energy' | 'weight' | null

const EMPTY_LOGS: Log[] = []
const EMPTY_PLANS: Plan[] = []

interface DashboardData {
  summary: LogsSummary | null
  weekSummary: LogsSummary | null
  plans: Plan[]
  suggestions: Suggestion[]
  todayLogs: Log[]
  profile: Profile | null
  weightLogs: Log[]
  checkIn: DashboardCheckIn | null
  recentSleepLogs: Log[]
}

async function withFallback<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (error instanceof OfflineError) throw error
    return fallback
  }
}

function WaterSheet({ onDone }: { onDone: () => void }) {
  const [glasses, setGlasses] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await createLog({ type: 'water', payload: { glasses }, source: 'manual' })
      toast.success('Water logged')
      onDone()
    } catch {
      toast.error('Failed to log water')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-gutter pb-6">
      <p className="text-center text-[17px] font-semibold text-ink">Log Water</p>
      <div className="flex items-center justify-center gap-8 py-4">
        <button
          type="button"
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          className="w-12 h-12 rounded-full border border-ink-16 flex items-center justify-center text-ink"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-[34px] font-bold text-ink tabular-nums">{glasses}</span>
          <p className="mt-1 text-[13px] text-ink-55">glasses</p>
        </div>
        <button
          type="button"
          onClick={() => setGlasses(glasses + 1)}
          className="w-12 h-12 rounded-full border border-ink-16 flex items-center justify-center text-ink"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <PrimaryButton type="button" disabled={saving} onClick={handleSave} className="justify-center">
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </div>
  )
}

function RatingSheet({ title, onDone, type }: {
  title: string
  onDone: () => void
  type: 'mood' | 'energy'
}) {
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!rating) {
      toast.error('Select a rating')
      return
    }
    setSaving(true)
    try {
      await createLog({ type, payload: { rating }, source: 'manual' })
      toast.success(`${title} logged`)
      onDone()
    } catch {
      toast.error(`Failed to log ${title.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-gutter pb-6">
      <p className="text-center text-[17px] font-semibold text-ink">{title}</p>
      <div className="py-2 text-center">
        <span className="text-[34px] font-bold text-ink tabular-nums">{rating || '—'}</span>
        <p className="mt-1 text-[13px] text-ink-55">out of 10</p>
      </div>
      <div className="flex justify-between gap-1">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => setRating(number)}
            className={`w-8 h-8 rounded-full text-[12px] font-semibold ${number <= rating ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}
          >
            {number}
          </button>
        ))}
      </div>
      <PrimaryButton type="button" disabled={saving} onClick={handleSave} className="justify-center">
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </div>
  )
}

function SleepSheet({ onDone }: { onDone: () => void }) {
  const [hours, setHours] = useState<number | ''>('')
  const [quality, setQuality] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!hours) {
      toast.error('Enter hours slept')
      return
    }
    if (!quality) {
      toast.error('Select sleep quality')
      return
    }
    setSaving(true)
    try {
      await createLog({
        type: 'sleep',
        payload: { hours: Number(hours), quality_rating: quality },
        source: 'manual',
      })
      toast.success('Sleep logged')
      onDone()
    } catch {
      toast.error('Failed to log sleep')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 px-gutter pb-6">
      <p className="text-center text-[17px] font-semibold text-ink">Log Sleep</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          placeholder="7.5"
          value={hours}
          onChange={(event) => setHours(event.target.value ? Number(event.target.value) : '')}
          className="h-14 min-w-0 flex-1 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink outline-none focus:border-accent"
        />
        <span className="text-[15.5px] font-medium text-ink-55">hours</span>
      </div>
      <div>
        <p className="mb-2 text-[13px] text-ink-55">Sleep quality</p>
        <div className="flex justify-between gap-1">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => setQuality(number)}
              className={`w-8 h-8 rounded-full text-[12px] font-semibold ${number <= quality ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
      <PrimaryButton type="button" disabled={saving} onClick={handleSave} className="justify-center">
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </div>
  )
}

function WeightSheet({ currentWeight, onDone }: { currentWeight?: number; onDone: () => void }) {
  const [kg, setKg] = useState<number | ''>(currentWeight ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!kg) {
      toast.error('Enter your weight')
      return
    }
    setSaving(true)
    try {
      await createLog({ type: 'weight', payload: { weight_kg: Number(kg) }, source: 'manual' })
      toast.success('Weight logged')
      onDone()
    } catch {
      toast.error('Failed to log weight')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 px-gutter pb-6">
      <p className="text-center text-[17px] font-semibold text-ink">Log Weight</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          placeholder="75.0"
          value={kg}
          onChange={(event) => setKg(event.target.value ? Number(event.target.value) : '')}
          className="h-14 min-w-0 flex-1 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink outline-none focus:border-accent"
        />
        <span className="text-[15.5px] font-medium text-ink-55">kg</span>
      </div>
      <PrimaryButton type="button" disabled={saving} onClick={handleSave} className="justify-center">
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </div>
  )
}

function DashboardLogSheet({ type, onDone, onClose, currentWeight }: {
  type: QuickLogType
  onDone: () => void
  onClose: () => void
  currentWeight?: number
}) {
  return (
    <BottomSheet open={type !== null} onClose={onClose} ariaLabel="Quick log">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-3 text-ink-50"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      {type === 'water' ? <WaterSheet onDone={onDone} /> : null}
      {type === 'mood' ? <RatingSheet title="Log Mood" type="mood" onDone={onDone} /> : null}
      {type === 'sleep' ? <SleepSheet onDone={onDone} /> : null}
      {type === 'energy' ? <RatingSheet title="Log Energy" type="energy" onDone={onDone} /> : null}
      {type === 'weight' ? <WeightSheet currentWeight={currentWeight} onDone={onDone} /> : null}
    </BottomSheet>
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
      className="w-6 h-6"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const user = useAuthStore((state) => state.user)
  const [activeSheet, setActiveSheet] = useState<QuickLogType>(null)
  const [activeMacro, setActiveMacro] = useState<MacroKey | null>(null)
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<string[]>([])
  const today = todayLocalISO(tz)

  const fetchAll = useCallback(async (): Promise<DashboardData> => {
    const [summary, weekSummary, plans, suggestions, todayLogs, profile, weightLogs, checkInResponse, recentSleepLogs] = await Promise.all([
      withFallback(getLogsSummary('day'), null),
      withFallback(getLogsSummary('week'), null),
      withFallback(getPlans({ active_only: true }), [] as Plan[]),
      withFallback(getSuggestions({ status: 'pending' }), [] as Suggestion[]),
      withFallback(getLogs({ days: 1 }), [] as Log[]),
      withFallback(getProfile(), null),
      withFallback(getLogs({ type: 'weight', limit: 100 }), [] as Log[]),
      withFallback(getDashboardCheckIn(), { check_in: null }),
      withFallback(getLogs({ type: 'sleep', limit: 1 }), [] as Log[]),
    ])

    return {
      summary,
      weekSummary,
      plans,
      suggestions,
      todayLogs,
      profile,
      weightLogs,
      checkIn: checkInResponse.check_in,
      recentSleepLogs,
    }
  }, [])

  const { data, loading, refetch } = useCachedQuery('dashboard', fetchAll, [today])
  const refresh = useCallback(() => { void refetch() }, [refetch])

  useEffect(() => {
    window.addEventListener('workout:plan-deactivated', refresh)
    return () => window.removeEventListener('workout:plan-deactivated', refresh)
  }, [refresh])

  useSyncRefetch(['plans:*', 'logs:*'], refresh)
  useSetGeoScreen('dashboard', { loading: loading && !data })

  const summary = data?.summary ?? null
  const plans = data?.plans ?? EMPTY_PLANS
  const todayLogs = data?.todayLogs ?? EMPTY_LOGS
  const profile = data?.profile ?? null
  const workoutPlan = (plans.find((plan) => plan.type === 'workout') as WorkoutPlan) ?? null
  const mealPlan = (plans.find((plan) => plan.type === 'meal') as MealPlan) ?? null
  const dailyBreakdown = summary?.daily_breakdown?.find((day) => day.date === today)
  const caloriesConsumed = dailyBreakdown?.calories ?? 0
  const proteinConsumed = dailyBreakdown?.protein ?? 0
  const carbsConsumed = dailyBreakdown?.carbs ?? 0
  const fatConsumed = dailyBreakdown?.fat ?? 0
  const planTargets = mealPlan?.content.daily_targets
  const caloriesTarget = planTargets?.calories ?? profile?.daily_calorie_target ?? 0
  const proteinTarget = planTargets?.protein ?? profile?.daily_protein_g ?? 0
  const carbsTarget = planTargets?.carbs ?? profile?.daily_carbs_g ?? 0
  const fatTarget = planTargets?.fat ?? profile?.daily_fat_g ?? 0
  const profileIncomplete = (profile?.daily_targets_missing_fields?.length ?? 0) > 0

  const todayWeightLog = data?.weightLogs.find(
    (log) => (log.local_date ?? new Date(log.created_at).toISOString().split('T')[0]) === today,
  )
  const displayWeight = todayWeightLog
    ? Number((todayWeightLog.payload as { weight_kg?: number }).weight_kg)
    : profile?.current_weight_kg
  const todaySleepLogs = todayLogs.filter((log) => log.type === 'sleep')
  const sleepHours = todaySleepLogs.length > 0
    ? Number((todaySleepLogs[todaySleepLogs.length - 1].payload as { hours?: number }).hours ?? 0)
    : data?.recentSleepLogs.length
      ? Number((data.recentSleepLogs[0].payload as { hours?: number }).hours ?? 0)
      : summary?.summary.avg_sleep_hours ?? 0
  const sessionsThisWeek = data?.weekSummary?.summary?.workout_count ?? 0
  const firstName = getDashboardFirstName(profile?.full_name, user?.email)
  const nudges = useMemo(
    () => data ? computeNudges({ todayLogs, summary, mealPlan, workoutPlan, profile }) : [],
    [data, todayLogs, summary, mealPlan, workoutPlan, profile],
  )
  const geoLine = getDashboardGeoLine(data?.checkIn?.takeaway, nudges)
  const pendingSuggestion = data?.suggestions.find(
    (suggestion) => !hiddenSuggestionIds.includes(suggestion.id),
  )
  const foodLogs = todayLogs.filter((log) => log.type === 'food')

  const handleStartWorkout = async (plan: WorkoutPlan, dayIndex: number) => {
    try {
      const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIndex })
      router.push(`/train/session?id=${session.id}`)
    } catch {
      toast.error('Failed to start workout')
    }
  }

  const handleSheetDone = () => {
    setActiveSheet(null)
    void refetch()
  }

  return (
    <PageWrapper>
      <header>
        <div className="flex items-center justify-between gap-[14px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[9px]">
              <Wordmark size={22} />
              <span className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-50">
                {formatDashboardDate(today)}
              </span>
            </div>
            <h1 className="mt-[5px] text-[22px] font-semibold tracking-[-0.4px]">
              Welcome back, {firstName}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push('/settings')}
            aria-label="Settings"
            className="w-10 h-10 rounded-full bg-ink-08 border border-ink-16 text-ink-60 flex shrink-0 items-center justify-center"
          >
            <PersonIcon />
          </button>
        </div>
      </header>

      <div className="-mx-gutter">
        <OfflineBand />
      </div>

      {!data && loading ? (
        <div className="mt-4 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !data ? (
        <p className="mt-4 text-[15.5px] text-ink-62">Unable to load your dashboard.</p>
      ) : (
        <>
          <GeoLine>{emphasizeGeoMeasurements(geoLine)}</GeoLine>

          <section className="border-t border-ink-09 pt-5">
            <SectionLabel>Today&apos;s targets</SectionLabel>
            <div className="mt-[13px] flex flex-col gap-[13px]">
              <button type="button" className="w-full text-left" onClick={() => setActiveMacro('calories')}>
                <MacroBar name="Calories" current={caloriesConsumed} target={caloriesTarget} />
              </button>
              <button type="button" className="w-full text-left" onClick={() => setActiveMacro('protein')}>
                <MacroBar name="Protein" current={proteinConsumed} target={proteinTarget} unit="g" />
              </button>
              <button type="button" className="w-full text-left" onClick={() => setActiveMacro('carbs')}>
                <MacroBar name="Carbs" current={carbsConsumed} target={carbsTarget} unit="g" />
              </button>
              <button type="button" className="w-full text-left" onClick={() => setActiveMacro('fat')}>
                <MacroBar name="Fat" current={fatConsumed} target={fatTarget} unit="g" />
              </button>
            </div>
          </section>

          <div className="mt-4">
            <PrimaryButton
              type="button"
              icon="+"
              trailing="Scan · Search"
              onClick={() => router.push('/logs/new/food')}
            >
              Log food
            </PrimaryButton>
          </div>

          <div className="mt-4">
            <WorkoutCard
              workoutPlan={workoutPlan}
              today={today}
              onStart={(plan, dayIndex) => void handleStartWorkout(plan, dayIndex)}
              onSeeProgram={() => router.push('/train')}
              onAskGeo={() => useUIStore.getState().openSheet('geo-companion')}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-[10px]">
            <button type="button" className="text-left" onClick={() => setActiveSheet('weight')}>
              <MetricTile
                className="h-full"
                label="Weight"
                value={displayWeight?.toFixed(1) ?? '—'}
                unit="kg"
              />
            </button>
            <button type="button" className="text-left" onClick={() => setActiveSheet('sleep')}>
              <MetricTile
                className="h-full"
                label="Sleep"
                value={sleepHours ? sleepHours.toFixed(1) : '—'}
                unit="h"
              />
            </button>
            <button type="button" className="text-left" onClick={() => router.push('/train')}>
              <MetricTile className="h-full" label="Sessions" value={sessionsThisWeek} sub="this week" />
            </button>
          </div>

          {profileIncomplete ? (
            <Link
              href="/settings/profile"
              className="mt-4 block bg-card rounded-[16px] border border-ink-12 px-[14px] py-[13px]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">Profile</div>
              <div className="mt-[3px] text-[15.5px] font-semibold text-ink">Add your height →</div>
            </Link>
          ) : null}

          {pendingSuggestion ? (
            <div className="mt-4">
              <SuggestionCard
                suggestion={pendingSuggestion}
                onAction={() => setHiddenSuggestionIds((ids) => [...ids, pendingSuggestion.id])}
              />
            </div>
          ) : null}

          <MacroBreakdownSheet
            open={activeMacro !== null}
            macro={activeMacro ?? 'calories'}
            foodLogs={foodLogs}
            onClose={() => setActiveMacro(null)}
          />
        </>
      )}

      <DashboardLogSheet
        type={activeSheet}
        onDone={handleSheetDone}
        onClose={() => setActiveSheet(null)}
        currentWeight={profile?.current_weight_kg}
      />
    </PageWrapper>
  )
}
