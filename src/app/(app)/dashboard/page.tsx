'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { emphasizeGeoMeasurements, formatDashboardDate, getDashboardGeoLine, quietDayGeoLine } from '@/components/dashboard/dashboard-helpers'
import { HomeEntrance, HomeErrorCard, WATER_GOAL_GLASSES, weightDeltaText } from '@/components/dashboard/home-cards'
import { CheckInDueRow, HomeSkeleton } from '@/components/dashboard/home-today'
import { geoAction, sleepTile, stepsTile, waterGlassesToday, weightTile } from '@/components/dashboard/home-data'
import { useHealthSource } from '@/components/dashboard/health-week'
import { logWithUndo } from '@/components/dashboard/log-with-undo'
import { MacroSheet } from '@/components/dashboard/macro-sheet'
import { QuickLogSheet, type QuickLogType } from '@/components/dashboard/quick-log-sheet'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { LOG_SHEET } from '@/components/layout/tab-bar'
import { HealthConnectSheet } from '@/components/native/health-connect-sheet'
import { OfflineBand } from '@/components/shared/offline-band'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { PersonFill } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'
import { MetricStrip } from '@/components/ui/fiqr/metric-strip'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
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
import { abandonWorkoutSession, getInProgressSession, startWorkoutSession } from '@/lib/api/workout-sessions.api'
import type { MacroKey } from '@/lib/macros'
import { computeNudges } from '@/lib/nudges'
import { todayLocalISO } from '@/lib/timezone'
import { computeSelectedPlanDayIndex } from '@/lib/workout-session'
import { useUIStore } from '@/stores/ui.store'
import type { Log, LogsSummary } from '@/types/logs.types'
import type { MealPlan, Plan, WorkoutPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'
import type { Suggestion } from '@/types/suggestions.types'
import type { WorkoutSession } from '@/types/workout-session.types'

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
  /** An open workout: Next Up offers Resume. */
  inProgress: WorkoutSession | null
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

  // All in parallel; suggestions follow once the screen is drawn.
  const fetchAll = useCallback(async (): Promise<DashboardData> => {
    const failures: unknown[] = []
    const [summary, plans, profile, logs, checkIn, status, inProgress] = await Promise.all([
      withFallback(getLogsSummary('day'), null, failures),
      withFallback(getPlans({ active_only: true }), [] as Plan[], failures),
      withFallback(getProfile(), null, failures),
      // The API caps a page at 100 rows; a larger limit is rejected with 400.
      withFallback(getLogs({ days: 8, limit: 100 }), [] as Log[]),
      withFallback(getDashboardCheckIn().then((response) => response.check_in), null),
      withFallback(getCheckInStatus(), null),
      withFallback(getInProgressSession(), null),
    ])
    // Targets, plan and profile all failing means Home has nothing true to show; report it instead of zeros.
    if (failures.length === 3) throw failures[0]
    return { summary, plans, profile, logs, checkIn, status, inProgress }
  }, [])

  const { data, loading, savedAt, refetch } = useCachedQuery('dashboard', fetchAll, [today])
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
  const planDay = workoutPlan ? workoutPlan.content.days?.[computeSelectedPlanDayIndex(workoutPlan, today, today)] : undefined
  const quietLine = quietDayGeoLine({
    workout: planDay && !planDay.is_rest_day ? planDay.name || null : null,
    restDay: !!planDay?.is_rest_day,
    protein: Math.max(0, targets.protein - (day?.protein ?? 0)),
    calories: Math.max(0, targets.calories - (day?.calories ?? 0)),
  })
  const geoLine = getDashboardGeoLine(data?.checkIn?.takeaway, hasFood ? nudges : [], quietLine)
  // Geo steps out once when it has something new for you: a nudge in its line.
  const geoNudge = !data?.checkIn?.takeaway?.trim() && hasFood && nudges.some((nudge) => nudge.message?.trim())
  const pendingSuggestion = suggestions?.find((suggestion) => !hiddenSuggestionIds.includes(suggestion.id))
  const checkInDue = data?.status?.state === 'due'

  const steps = stepsTile(logs, today)
  const weight = weightTile(logs, profile?.current_weight_kg, today)
  const sleep = sleepTile(logs, today)
  const water = waterGlassesToday(logs, today)

  const openLogSheet = () => useUIStore.getState().openSheet(LOG_SHEET)
  const openGeo = () => useUIStore.getState().openSheet('geo-companion')



  // Geo's one-tap suggestion: log a usual food again. "Log a meal" is already the screen's orange action.
  const suggested = data ? geoAction(logs, today, { kcal: targets.calories - (day?.calories ?? 0), protein: targets.protein - (day?.protein ?? 0) }) : null
  const relog = suggested?.kind === 'relog' ? suggested : null
  const relogShort = relog?.name.split(',')[0] ?? ''
  const runRelog = () => {
    if (!relog) return
    setGeoBusy(true)
    void logWithUndo(relog.input, `${relogShort} logged to Snack`, refresh, () => {}).finally(() => setGeoBusy(false))
  }
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null

  const startWorkout = async (plan: WorkoutPlan, dayIndex: number) => {
    try {
      const session = await startWorkoutSession({ plan_id: plan.id, plan_day_index: dayIndex })
      router.push(`/train/session?id=${session.id}`)
    } catch {
      toast.error("Couldn't start the workout. Try again.")
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md px-gutter">
      {/* Home's header is every tab root's header; Geo's line under it carries the mark (no wordmark: the nav and the icon hold the brand). */}
      <LargeTitleHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        barTitle="Today"
        subtitle={formatDashboardDate(today)}
        actions={<RoundButton aria-label="Profile and settings" onClick={() => router.push('/settings')}><PersonFill /></RoundButton>}
      />

      <div className="-mx-gutter mt-2">
        <OfflineBand />
      </div>

      <div className="pb-4">
        {!data && loading ? <HomeSkeleton /> : !data ? (
          <div className="mt-4"><HomeErrorCard savedAt={savedAt} onRetry={refresh} /></div>
        ) : (
          <HomeEntrance.Provider value={enter}>
            <motion.div initial={enter && !reduce ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
              {/* Geo's read leads the screen (PRODUCT.md ethos 1); the divider under it is George's. */}
              <div className="border-b border-ink-09">
                <GeoLine
                  onOpen={openGeo}
                  thinking={geoBusy}
                  nudge={geoNudge}
                  action={relog ? (
                    <button
                      type="button"
                      onClick={runRelog}
                      disabled={geoBusy}
                      aria-label={`Log ${relog.name} again, ${relog.protein} g protein`}
                      className="-ml-2 min-h-11 px-2 text-[15px] font-semibold text-ink underline decoration-ink-20 decoration-1 underline-offset-4 disabled:text-ink-35"
                    >
                      Log {relogShort} again
                    </button>
                  ) : null}
                >
                  {emphasizeGeoMeasurements(geoLine)}
                </GeoLine>
              </div>

              {checkInDue && data.status ? (
                <CheckInDueRow className="mt-4" weekLabel={data.status.week.label} daysLogged={data.status.days_logged ?? null} onOpen={() => router.push('/check-in')} />
              ) : null}

              <section aria-label="Today's targets" className={cn('mt-5', enter && 'enter-rows')}>
                <SectionLabel>Today&apos;s targets</SectionLabel>
                <div className="mt-[10px] flex flex-col gap-[6px]">
                  <MacroBar name="Calories" lead current={day?.calories ?? 0} target={targets.calories} onClick={() => setActiveMacro('calories')} />
                  <MacroBar name="Protein" unit="g" current={day?.protein ?? 0} target={targets.protein} onClick={() => setActiveMacro('protein')} />
                  <MacroBar name="Carbs" unit="g" current={day?.carbs ?? 0} target={targets.carbs} onClick={() => setActiveMacro('carbs')} />
                  <MacroBar name="Fat" unit="g" current={day?.fat ?? 0} target={targets.fat} onClick={() => setActiveMacro('fat')} />
                </div>
              </section>

              <PrimaryButton type="button" className="mt-4" icon="+" trailing="Scan · Search" onClick={openLogSheet}>Log food</PrimaryButton>

              <div className="mt-4">
                <WorkoutCard
                  workoutPlan={workoutPlan}
                  today={today}
                  inProgress={data.inProgress}
                  onStart={(plan, dayIndex) => void startWorkout(plan, dayIndex)}
                  onResume={(session) => router.push(`/train/session?id=${session.id}`)}
                  onDiscard={(session) => {
                    void abandonWorkoutSession(session.id)
                      .then(() => { toast.success('Workout ended'); refresh() })
                      .catch(() => toast.error("Couldn't end the workout. Try again."))
                  }}
                  onSeeProgram={() => router.push('/train')}
                  onAskGeo={openGeo}
                />
              </div>

              <MetricStrip
                className="mt-4"
                items={[
                  {
                    label: 'Weight',
                    value: weight.kg !== null ? weight.kg.toFixed(1) : '—',
                    unit: weight.kg !== null ? 'kg' : undefined,
                    sub: weightDeltaText(weight.weekDelta) ?? 'Log today',
                    onClick: () => setQuickLog('weight'),
                    ariaLabel: weight.kg !== null ? `Weight ${weight.kg.toFixed(1)} kg, log weight` : 'Log weight',
                  },
                  {
                    label: 'Sleep',
                    value: sleep.hours !== null ? sleep.hours.toFixed(1) : '—',
                    unit: sleep.hours !== null ? 'h' : undefined,
                    sub: sleep.hours !== null ? 'last night' : 'Not logged',
                    onClick: () => (sleep.hours === null ? setQuickLog('sleep') : router.push('/dashboard/sleep')),
                    ariaLabel: sleep.hours !== null ? `Sleep ${sleep.hours.toFixed(1)} hours, open the week` : 'Log sleep',
                  },
                  {
                    label: 'Steps',
                    value: steps.today !== null ? steps.today.toLocaleString('en-US') : '—',
                    sub: health.connected === false && health.label ? 'Connect' : steps.today !== null ? 'today' : 'No data',
                    onClick: () => (health.connected === false && health.label ? setConnectOpen(true) : router.push('/dashboard/steps')),
                    ariaLabel: steps.today !== null ? `Steps ${steps.today}, open the week` : 'Steps, open the week',
                  },
                  {
                    label: 'Water',
                    value: String(water),
                    unit: `of ${WATER_GOAL_GLASSES}`,
                    sub: 'glasses',
                    onClick: () => setQuickLog('water'),
                    ariaLabel: `Water ${water} of ${WATER_GOAL_GLASSES} glasses, log water`,
                  },
                ]}
              />

              {(profile?.daily_targets_missing_fields?.length ?? 0) > 0 ? (
                <button type="button" onClick={() => router.push('/settings/profile')} className="mt-4 flex min-h-14 w-full items-center rounded-[16px] border border-ink-12 bg-card px-4 text-left active:bg-ink-04">
                  <span className="flex-1">
                    <span className="block text-body font-semibold text-ink">Add your height</span>
                    <span className="block text-caption text-ink-65">Geo needs it to set your targets</span>
                  </span>
                  <span aria-hidden="true" className="text-ink-50">›</span>
                </button>
              ) : null}

              {pendingSuggestion ? (
                <div className="mt-4">
                  <SuggestionCard suggestion={pendingSuggestion} onAction={() => setHiddenSuggestionIds((ids) => [...ids, pendingSuggestion.id])} />
                </div>
              ) : null}
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
