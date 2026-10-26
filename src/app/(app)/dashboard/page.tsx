'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { emphasizeGeoMeasurements, formatDashboardDate, getDashboardGeoLine } from '@/components/dashboard/dashboard-helpers'
import {
  CheckInCard,
  HeroCard,
  HomeEntrance,
  HomeSkeleton,
  MealsCard,
  SleepTile,
  StepsTile,
  WaterTile,
  WeightTile,
  type HealthSource,
} from '@/components/dashboard/home-cards'
import { mealRows, sleepTile, stepsTile, waterGlassesToday, weightTile } from '@/components/dashboard/home-data'
import { QuickLogSheet, type QuickLogType } from '@/components/dashboard/quick-log-sheet'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { LOG_SHEET } from '@/components/layout/tab-bar'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { MacroBreakdownSheet } from '@/components/shared/macro-breakdown-sheet'
import { OfflineBand } from '@/components/shared/offline-band'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ChartFill, PersonFill } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useFirstPaint } from '@/lib/use-first-paint'
import { cn } from '@/lib/utils'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { OfflineError } from '@/lib/api/client'
import { getCheckInStatus, type CheckInStatus } from '@/lib/api/check-in.api'
import { getDashboardCheckIn, type DashboardCheckIn } from '@/lib/api/dashboard.api'
import { getLogs, getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { healthLabel, isHealthConnected, lastHealthSync } from '@/lib/platform/health'
import type { MacroKey } from '@/lib/macros'
import { computeNudges } from '@/lib/nudges'
import { todayLocalISO } from '@/lib/timezone'
import { useUIStore } from '@/stores/ui.store'
import type { Log, LogsSummary } from '@/types/logs.types'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'
import type { Suggestion } from '@/types/suggestions.types'

const EMPTY_LOGS: Log[] = []
const EMPTY_PLANS: Plan[] = []

interface DashboardData {
  summary: LogsSummary | null
  plans: Plan[]
  profile: Profile | null
  /** Eight days of every log type: today's food and water, the sleep strip, weight trend and steps. */
  logs: Log[]
  checkIn: DashboardCheckIn | null
  status: CheckInStatus | null
}

async function withFallback<T>(request: Promise<T>, fallback: T, failures?: unknown[]): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (error instanceof OfflineError) throw error
    failures?.push(error)
    return fallback
  }
}

function useHealthSource(): { label: string | null; connected: boolean | null; syncedAt: string | null; recheck: () => void } {
  const label = healthLabel()
  const [state, setState] = useState<{ connected: boolean | null; syncedAt: string | null }>({ connected: null, syncedAt: null })
  const recheck = useCallback(() => {
    if (!label) return
    void Promise.all([isHealthConnected(), lastHealthSync()]).then(([connected, syncedAt]) => setState({ connected, syncedAt }))
  }, [label])
  useEffect(recheck, [recheck])
  return { label, ...state, recheck }
}

export default function DashboardPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const today = todayLocalISO(tz)
  const [quickLog, setQuickLog] = useState<QuickLogType>(null)
  const [activeMacro, setActiveMacro] = useState<MacroKey | null>(null)
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<string[]>([])
  const [connectOpen, setConnectOpen] = useState(false)
  const health = useHealthSource()
  const enter = useFirstPaint('dashboard')

  // Six requests in parallel at most (Q24); suggestions follow once the screen is drawn.
  const fetchAll = useCallback(async (): Promise<DashboardData> => {
    const failures: unknown[] = []
    const [summary, plans, profile, logs, checkIn, status] = await Promise.all([
      withFallback(getLogsSummary('day'), null, failures),
      withFallback(getPlans({ active_only: true }), [] as Plan[], failures),
      withFallback(getProfile(), null, failures),
      withFallback(getLogs({ days: 8, limit: 500 }), [] as Log[]),
      withFallback(getDashboardCheckIn().then((response) => response.check_in), null),
      withFallback(getCheckInStatus(), null),
    ])
    // Targets, plan and profile all failing means Home has nothing true to show; report it instead of zeros.
    if (failures.length === 3) throw failures[0]
    return { summary, plans, profile, logs, checkIn, status }
  }, [])

  const { data, loading, refetch } = useCachedQuery('dashboard', fetchAll, [today])
  const refresh = useCallback(() => { void refetch() }, [refetch])
  const fetchSuggestions = useCallback(() => getSuggestions({ status: 'pending' }).catch(() => [] as Suggestion[]), [])
  const { data: suggestions } = useCachedQuery('dashboard-suggestions', fetchSuggestions, [today, !!data])

  useEffect(() => {
    window.addEventListener('workout:plan-deactivated', refresh)
    return () => window.removeEventListener('workout:plan-deactivated', refresh)
  }, [refresh])
  const { recheck } = health
  useSyncRefetch(['plans:*', 'logs:*'], useCallback(() => { refresh(); recheck() }, [refresh, recheck]))
  useSetGeoScreen('dashboard', { loading: loading && !data })

  const summary = data?.summary ?? null
  const plans = data?.plans ?? EMPTY_PLANS
  const logs = data?.logs ?? EMPTY_LOGS
  const profile = data?.profile ?? null
  const workoutPlan = (plans.find((plan) => plan.type === 'workout') as WorkoutPlan) ?? null
  const mealPlan = (plans.find((plan) => plan.type === 'meal') as MealPlan) ?? null
  const day = summary?.daily_breakdown?.find((entry) => entry.date === today)
  const targets = mealPlan?.content.daily_targets
  const todayLogs = useMemo(() => logs.filter((log) => (log.local_date ?? log.created_at.slice(0, 10)) === today), [logs, today])
  const nudges = useMemo(
    () => data ? computeNudges({ todayLogs, summary, mealPlan, workoutPlan, profile }) : [],
    [data, todayLogs, summary, mealPlan, workoutPlan, profile],
  )
  // Nothing logged all week (a new account): Geo's first-meal line, not "you haven't eaten in a while".
  const hasFood = logs.some((log) => log.type === 'food')
  const geoLine = getDashboardGeoLine(data?.checkIn?.takeaway, hasFood ? nudges : [])
  const pendingSuggestion = suggestions?.find((suggestion) => !hiddenSuggestionIds.includes(suggestion.id))
  const checkInDue = data?.status?.state === 'due'

  const steps = stepsTile(logs, today)
  const weight = weightTile(logs, profile?.current_weight_kg, today)
  const sleep = sleepTile(logs, today)
  const source: HealthSource | null = health.label && health.connected ? { label: health.label, syncedAt: health.syncedAt } : null

  const startWorkout = async (plan: WorkoutPlan, dayIndex: number) => {
    try {
      const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIndex })
      router.push(`/train/session?id=${session.id}`)
    } catch {
      toast.error("Couldn't start the workout. Try again.")
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md px-4">
      <LargeTitleHeader
        title="Today"
        subtitle={formatDashboardDate(today)}
        actions={(
          <>
            {checkInDue ? null : <RoundButton aria-label="This week" onClick={() => router.push('/check-in')}><ChartFill /></RoundButton>}
            <RoundButton aria-label="Settings" onClick={() => router.push('/settings')}><PersonFill /></RoundButton>
          </>
        )}
      />

      <div className="-mx-4 mt-3">
        <OfflineBand />
      </div>

      {!data && loading ? (
        <HomeSkeleton />
      ) : null}
      {/* The skeleton fades out over the arriving cards instead of leaving a bare frame (motion-feel N6). */}
      {data && enter ? <div aria-hidden="true" className="skeleton-out pointer-events-none absolute inset-x-4 top-[calc(108px+var(--safe-top))]"><HomeSkeleton /></div> : null}
      {!data && loading ? null : !data ? (
        <div className="mt-5 rounded-[24px] bg-card px-5 pb-5 pt-1 shadow-[var(--shadow-card)]"><ErrorState onRetry={refresh}>I couldn&apos;t load today. Check your connection and try again.</ErrorState></div>
      ) : (
        <HomeEntrance.Provider value={enter}>
        <div className="mt-5 flex flex-col gap-3">
          {checkInDue && data.status ? (
            <div className={cn(enter && 'enter-hero')}><CheckInCard weekLabel={data.status.week.label} onOpen={() => router.push('/check-in')} /></div>
          ) : null}

          <div className={cn(enter && 'enter-hero')}>
            <HeroCard
              calories={{ current: day?.calories ?? 0, target: targets?.calories ?? profile?.daily_calorie_target ?? 0 }}
              macros={{
                protein: [day?.protein ?? 0, targets?.protein ?? profile?.daily_protein_g ?? 0],
                carbs: [day?.carbs ?? 0, targets?.carbs ?? profile?.daily_carbs_g ?? 0],
                fat: [day?.fat ?? 0, targets?.fat ?? profile?.daily_fat_g ?? 0],
              }}
              geoLine={emphasizeGeoMeasurements(geoLine)}
              onOpenMacro={setActiveMacro}
            />
          </div>

          <div className={cn('grid grid-cols-2 gap-[10px]', enter && 'enter-tiles')}>
            <StepsTile
              today={steps.today}
              yesterday={steps.yesterday}
              source={source}
              connectLabel={health.connected === false ? health.label : null}
              onConnect={() => setConnectOpen(true)}
            />
            <WeightTile {...weight} onLog={() => setQuickLog('weight')} />
            <WaterTile glasses={waterGlassesToday(logs, today)} onLog={() => setQuickLog('water')} />
            <SleepTile hours={sleep.hours} nights={sleep.nights} source={source} onLog={() => setQuickLog('sleep')} />
          </div>

          <div className={cn('contents', enter && 'enter-rows')}>
          <div>
            <WorkoutCard
              workoutPlan={workoutPlan}
              today={today}
              onStart={(plan, dayIndex) => void startWorkout(plan, dayIndex)}
              onSeeProgram={() => router.push('/train')}
              onAskGeo={() => useUIStore.getState().openSheet('geo-companion')}
            />
          </div>

          <section className="mt-3">
            <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-65">Meals</h2>
            <MealsCard rows={mealRows(logs, today)} onOpen={() => router.push('/food')} onLog={() => useUIStore.getState().openSheet(LOG_SHEET)} />
          </section>
          </div>

          {(profile?.daily_targets_missing_fields?.length ?? 0) > 0 ? (
            <button type="button" onClick={() => router.push('/settings/profile')} className="flex min-h-16 items-center rounded-[24px] bg-card px-5 text-left shadow-[var(--shadow-card)] active:scale-[.98]">
              <span className="flex-1">
                <span className="block text-[15.5px] font-semibold text-ink">Add your height</span>
                <span className="block text-[13px] text-ink-65">Geo needs it to set your targets</span>
              </span>
            </button>
          ) : null}

          {pendingSuggestion ? (
            <SuggestionCard suggestion={pendingSuggestion} onAction={() => setHiddenSuggestionIds((ids) => [...ids, pendingSuggestion.id])} />
          ) : null}

          <MacroBreakdownSheet
            open={activeMacro !== null}
            macro={activeMacro ?? 'calories'}
            foodLogs={todayLogs.filter((log) => log.type === 'food')}
            onClose={() => setActiveMacro(null)}
          />
        </div>
        </HomeEntrance.Provider>
      )}

      <QuickLogSheet
        type={quickLog}
        onDone={() => { setQuickLog(null); refresh() }}
        onClose={() => setQuickLog(null)}
        currentWeight={weight.kg ?? undefined}
      />
      <HealthConnectSheet open={connectOpen} onClose={() => setConnectOpen(false)} onConnected={() => { recheck(); refresh() }} />
    </div>
  )
}
