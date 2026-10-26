'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { emphasizeGeoMeasurements, formatDashboardDate, getDashboardGeoLine } from '@/components/dashboard/dashboard-helpers'
import {
  CheckInCard,
  HeroCard,
  HomeEntrance,
  HomeErrorCard,
  HomeSkeleton,
  MealsCard,
  SleepTile,
  StepsTile,
  WATER_GOAL_GLASSES,
  WaterTile,
  WeightTile,
  type HealthSource,
  type HeroAction,
} from '@/components/dashboard/home-cards'
import { geoAction, mealRows, sleepTile, stepsTile, waterGlassesToday, weightTile } from '@/components/dashboard/home-data'
import { useHealthSource } from '@/components/dashboard/health-week'
import { logWithUndo } from '@/components/dashboard/log-with-undo'
import { MacroSheet } from '@/components/dashboard/macro-sheet'
import { QuickLogSheet, type QuickLogType } from '@/components/dashboard/quick-log-sheet'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { LOG_SHEET } from '@/components/layout/tab-bar'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { OfflineBand } from '@/components/shared/offline-band'
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

export default function DashboardPage() {
  const router = useRouter()
  const tz = useUserTimezone()
  const today = todayLocalISO(tz)
  const reduce = useReducedMotion()
  const [quickLog, setQuickLog] = useState<QuickLogType>(null)
  const [activeMacro, setActiveMacro] = useState<MacroKey | null>(null)
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<string[]>([])
  const [connectOpen, setConnectOpen] = useState(false)
  const [geoBusy, setGeoBusy] = useState(false)
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

  const { data, loading, savedAt, refetch } = useCachedQuery('dashboard', fetchAll, [today])
  const refresh = useCallback(() => { void refetch() }, [refetch])
  const fetchSuggestions = useCallback(() => getSuggestions({ status: 'pending' }).catch(() => [] as Suggestion[]), [])
  const { data: suggestions } = useCachedQuery('dashboard-suggestions', fetchSuggestions, [today, !!data])

  // Glasses added with the tile's + before the refetch lands; tied to the data they were added on, so fresh data replaces them.
  const [waterExtra, setWaterExtra] = useState<{ on: DashboardData | null; n: number }>({ on: null, n: 0 })
  const addWater = (n: number) => setWaterExtra((prev) => ({ on: data, n: (prev.on === data ? prev.n : 0) + n }))

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
  const planTargets = mealPlan?.content.daily_targets
  const targets: Record<MacroKey, number> = {
    calories: planTargets?.calories ?? profile?.daily_calorie_target ?? 0,
    protein: planTargets?.protein ?? profile?.daily_protein_g ?? 0,
    carbs: planTargets?.carbs ?? profile?.daily_carbs_g ?? 0,
    fat: planTargets?.fat ?? profile?.daily_fat_g ?? 0,
  }
  const todayLogs = useMemo(() => logs.filter((log) => (log.local_date ?? log.created_at.slice(0, 10)) === today), [logs, today])
  const todayFood = useMemo(() => todayLogs.filter((log) => log.type === 'food'), [todayLogs])
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
  const water = waterGlassesToday(logs, today) + (waterExtra.on === data ? waterExtra.n : 0)
  const source: HealthSource | null = health.label && health.connected ? { label: health.label, syncedAt: health.syncedAt } : null

  const openLogSheet = () => useUIStore.getState().openSheet(LOG_SHEET)
  const openGeo = () => useUIStore.getState().openSheet('geo-companion')

  const addGlass = () => {
    addWater(1)
    void logWithUndo(
      { type: 'water', payload: { glasses: 1 }, source: 'quick_log' },
      `Glass added, ${water + 1} of ${WATER_GOAL_GLASSES}`,
      refresh,
      () => addWater(-1),
    ).then((ok) => { if (!ok) addWater(-1) })
  }

  const suggested = data ? geoAction(logs, today, { kcal: targets.calories - (day?.calories ?? 0), protein: targets.protein - (day?.protein ?? 0) }) : null
  let action: HeroAction | null = null
  if (suggested?.kind === 'log-meal') {
    action = { label: 'Log a meal', onRun: openLogSheet }
  } else if (suggested?.kind === 'relog') {
    action = {
      label: `Log ${suggested.name.split(',')[0]}`,
      ariaLabel: `Log ${suggested.name} again, ${suggested.protein} g protein`,
      busy: geoBusy,
      onRun: () => {
        setGeoBusy(true)
        void logWithUndo(suggested.input, `${suggested.name} logged to Snack`, refresh, () => {}).finally(() => setGeoBusy(false))
      },
      onMore: openGeo,
    }
  }

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

      <div className="mt-4 pb-4">
        {!data && loading ? <HomeSkeleton /> : !data ? (
          <HomeErrorCard savedAt={savedAt} onRetry={refresh} />
        ) : (
          <HomeEntrance.Provider value={enter}>
            {/* Cold start: Home settles forward from 1.04 while the ring draws, once per session (Q23). */}
            <motion.div
              className="flex flex-col gap-[10px]"
              initial={enter && !reduce ? { opacity: 0, scale: 1.04 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ scale: { type: 'spring', stiffness: 260, damping: 30 }, opacity: { duration: 0.22, ease: 'easeOut' } }}
            >
              {checkInDue && data.status ? (
                <CheckInCard weekLabel={data.status.week.label} daysLogged={data.status.days_logged ?? null} onOpen={() => router.push('/check-in')} />
              ) : null}

              <HeroCard
                calories={{ current: day?.calories ?? 0, target: targets.calories }}
                macros={{
                  protein: [day?.protein ?? 0, targets.protein],
                  carbs: [day?.carbs ?? 0, targets.carbs],
                  fat: [day?.fat ?? 0, targets.fat],
                }}
                geoLine={emphasizeGeoMeasurements(geoLine)}
                action={action}
                onOpenMacro={setActiveMacro}
              />

              <div className={cn('grid grid-cols-2 gap-[10px]', enter && 'enter-tiles')}>
                <WaterTile glasses={water} onOpen={() => setQuickLog('water')} onAdd={addGlass} />
                <WeightTile kg={weight.kg} weekDelta={weight.weekDelta} onLog={() => setQuickLog('weight')} />
                <StepsTile
                  today={steps.today}
                  yesterday={steps.yesterday}
                  source={source}
                  connectLabel={health.connected === false ? health.label : null}
                  onConnect={() => setConnectOpen(true)}
                  onOpen={() => router.push('/dashboard/steps')}
                />
                <SleepTile hours={sleep.hours} nights={sleep.nights} source={source} onOpen={() => (sleep.hours === null ? setQuickLog('sleep') : router.push('/dashboard/sleep'))} />
              </div>

              <div className={cn('flex flex-col gap-[10px]', enter && 'enter-rows')}>
                <WorkoutCard
                  workoutPlan={workoutPlan}
                  today={today}
                  onStart={(plan, dayIndex) => void startWorkout(plan, dayIndex)}
                  onSeeProgram={() => router.push('/train')}
                  onAskGeo={openGeo}
                />

                <section className="mt-2">
                  <h2 className="mb-2 px-1 text-caption font-semibold text-ink-65">Meals</h2>
                  <MealsCard rows={mealRows(logs, today)} onOpen={() => router.push('/food')} onLog={openLogSheet} />
                </section>

                {(profile?.daily_targets_missing_fields?.length ?? 0) > 0 ? (
                  <button type="button" onClick={() => router.push('/settings/profile')} className="flex min-h-16 items-center rounded-[22px] bg-card px-4 text-left shadow-[var(--shadow-card)] active:scale-[.98]">
                    <span className="flex-1">
                      <span className="block text-body font-semibold text-ink">Add your height</span>
                      <span className="block text-caption text-ink-65">Geo needs it to set your targets</span>
                    </span>
                  </button>
                ) : null}

                {pendingSuggestion ? (
                  <SuggestionCard suggestion={pendingSuggestion} onAction={() => setHiddenSuggestionIds((ids) => [...ids, pendingSuggestion.id])} />
                ) : null}
              </div>
            </motion.div>

            <MacroSheet
              open={activeMacro !== null}
              macro={activeMacro ?? 'calories'}
              foodLogs={todayFood}
              targets={targets}
              onClose={() => setActiveMacro(null)}
              onLogMeal={() => { setActiveMacro(null); openLogSheet() }}
            />
          </HomeEntrance.Provider>
        )}
      </div>

      <QuickLogSheet
        type={quickLog}
        onDone={() => { setQuickLog(null); refresh() }}
        onClose={() => setQuickLog(null)}
        water={water}
        weight={{ ...weight, today }}
      />
      <HealthConnectSheet open={connectOpen} onClose={() => setConnectOpen(false)} onConnected={() => { recheck(); refresh(); toast.success(`${health.label ?? 'Health'} connected, 30 days synced`) }} />
    </div>
  )
}
