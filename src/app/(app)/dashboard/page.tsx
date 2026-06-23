'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { getLogsSummary, getLogs, createLog } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { getProfile } from '@/lib/api/profile.api'
import { getGreeting, formatDate } from '@/lib/utils'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { CalendarDays, ChevronRight, X, Minus, Plus } from 'lucide-react'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { NextUpCard } from '@/components/dashboard/next-up-card'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { WorkoutCard } from '@/components/dashboard/workout-card'
import { SuggestionCard } from '@/components/dashboard/suggestion-card'
import { WeightChart } from '@/components/dashboard/weight-chart'
import { NudgeCard } from '@/components/dashboard/nudge-card'
import { CheckInCard } from '@/components/dashboard/check-in-card'
import { getDashboardCheckIn, type DashboardCheckIn } from '@/lib/api/dashboard.api'
import { computeNudges, type Nudge } from '@/lib/nudges'
import { useUIStore } from '@/stores/ui.store'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { toast } from 'sonner'
import type { MealPlan, WorkoutPlan, Plan } from '@/types/plans.types'
import type { LogsSummary, Log } from '@/types/logs.types'
import type { Profile } from '@/types/profile.types'
import type { Suggestion } from '@/types/suggestions.types'

type QuickLogType = 'water' | 'mood' | 'sleep' | 'energy' | 'weight' | null

// ── Inline quick-log sheets ──────────────────────────────────────────────────

function WaterSheet({ onDone }: { onDone: () => void }) {
  const [glasses, setGlasses] = useState(1)
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    setSaving(true)
    try {
      await createLog({ type: 'water', payload: { glasses }, source: 'manual' })
      toast.success('Water logged')
      onDone()
    } catch { toast.error('Failed to log water') } finally { setSaving(false) }
  }
  return (
    <div className="space-y-6">
      <p className="text-[17px] font-semibold text-text-primary text-center">Log Water</p>
      <div className="flex items-center justify-center gap-8 py-4">
        <button type="button" onClick={() => setGlasses(Math.max(0, glasses - 1))}
          className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center text-accent">
          <Minus className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-5xl font-bold text-text-primary tabular-nums">{glasses}</span>
          <p className="text-sm text-text-secondary mt-1">glasses</p>
        </div>
        <button type="button" onClick={() => setGlasses(glasses + 1)}
          className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center text-accent">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <button onClick={handle} disabled={saving}
        className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function RatingSheet({ title, color, onDone, type }: { title: string; color: string; onDone: () => void; type: 'mood' | 'energy' }) {
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    if (!rating) { toast.error('Select a rating'); return }
    setSaving(true)
    try {
      await createLog({ type, payload: { rating }, source: 'manual' })
      toast.success(`${title} logged`)
      onDone()
    } catch { toast.error(`Failed to log ${title.toLowerCase()}`) } finally { setSaving(false) }
  }
  return (
    <div className="space-y-6">
      <p className="text-[17px] font-semibold text-text-primary text-center">{title}</p>
      <div className="text-center py-2">
        <span className="text-5xl font-bold text-text-primary tabular-nums">{rating || '—'}</span>
        <p className="text-sm text-text-secondary mt-1">out of 10</p>
      </div>
      <div className="flex gap-2 justify-between">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${n <= rating ? `${color} text-white` : 'bg-surface-hover text-text-secondary'}`}>
            {n}
          </button>
        ))}
      </div>
      <button onClick={handle} disabled={saving}
        className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function SleepSheet({ onDone }: { onDone: () => void }) {
  const [hours, setHours] = useState<number | ''>('')
  const [quality, setQuality] = useState(0)
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    if (!hours) { toast.error('Enter hours slept'); return }
    if (!quality) { toast.error('Select sleep quality'); return }
    setSaving(true)
    try {
      await createLog({ type: 'sleep', payload: { hours: Number(hours), quality_rating: quality }, source: 'manual' })
      toast.success('Sleep logged')
      onDone()
    } catch { toast.error('Failed to log sleep') } finally { setSaving(false) }
  }
  return (
    <div className="space-y-5">
      <p className="text-[17px] font-semibold text-text-primary text-center">Log Sleep</p>
      <div className="flex items-center justify-center gap-2 py-2">
        <input type="number" step="0.5" min="0" max="24" placeholder="7.5"
          value={hours} onChange={(e) => setHours(e.target.value ? Number(e.target.value) : '')}
          className="w-24 text-center text-4xl font-bold bg-transparent border-b-2 border-border focus:border-accent outline-none py-1 text-text-primary" />
        <span className="text-lg text-text-secondary font-medium">hrs</span>
      </div>
      <div>
        <p className="text-xs text-text-secondary mb-2">Sleep quality</p>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => setQuality(n)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${n <= quality ? 'bg-[#6366F1] text-white' : 'bg-surface-hover text-text-secondary'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handle} disabled={saving}
        className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function WeightSheet({ currentWeight, onDone }: { currentWeight?: number; onDone: () => void }) {
  const [kg, setKg] = useState<number | ''>(currentWeight ?? '')
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    if (!kg) { toast.error('Enter your weight'); return }
    setSaving(true)
    try {
      await createLog({ type: 'weight', payload: { weight_kg: Number(kg) }, source: 'manual' })
      toast.success('Weight logged')
      onDone()
    } catch { toast.error('Failed to log weight') } finally { setSaving(false) }
  }
  const todayLabel = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-[17px] font-semibold text-text-primary">Log Weight</p>
        <p className="text-xs text-text-tertiary mt-0.5">Today · {todayLabel}</p>
      </div>
      <div className="flex items-center justify-center gap-2 py-4">
        <input type="number" step="0.1" placeholder="75.0"
          value={kg} onChange={(e) => setKg(e.target.value ? Number(e.target.value) : '')}
          className="w-28 text-center text-4xl font-bold bg-transparent border-b-2 border-border focus:border-accent outline-none py-1 text-text-primary" />
        <span className="text-lg text-text-secondary font-medium">kg</span>
      </div>
      <button onClick={handle} disabled={saving}
        className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

// ── Bottom sheet overlay ─────────────────────────────────────────────────────

function QuickLogSheet({ type, onDone, onClose, currentWeight }: {
  type: QuickLogType
  onDone: () => void
  onClose: () => void
  currentWeight?: number
}) {
  if (!type) return null
  return (
    <>
      {/* Backdrop — z-[49] so it's above page content but BELOW the nav bar (z-50) */}
      <div
        className="fixed inset-0 z-[49] bg-black/40"
        onClick={onClose}
      />
      {/* Sheet panel — z-[51] above nav, positioned just above it */}
      <div className="fixed bottom-[60px] left-0 right-0 z-[51] bg-background rounded-t-2xl px-5 pt-3 pb-6 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <button type="button" onClick={onClose} className="absolute top-3 right-4 text-text-tertiary">
          <X className="w-5 h-5" />
        </button>
        {type === 'water' && <WaterSheet onDone={onDone} />}
        {type === 'mood' && <RatingSheet title="Log Mood" color="bg-[#FF9F0A]" type="mood" onDone={onDone} />}
        {type === 'sleep' && <SleepSheet onDone={onDone} />}
        {type === 'energy' && <RatingSheet title="Log Energy" color="bg-accent" type="energy" onDone={onDone} />}
        {type === 'weight' && <WeightSheet currentWeight={currentWeight} onDone={onDone} />}
      </div>
    </>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const tz = useUserTimezone()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<LogsSummary | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [todayLogs, setTodayLogs] = useState<Log[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weightLogs, setWeightLogs] = useState<Log[]>([])
  // Sleep is a "last night" metric — log it for yesterday and it still belongs on
  // today's card. todayLogs (days:1) can't see a yesterday-stamped row, so fetch
  // the single most-recent sleep log regardless of date.
  const [recentSleepLogs, setRecentSleepLogs] = useState<Log[]>([])
  const [activeSheet, setActiveSheet] = useState<QuickLogType>(null)
  // FB-R6-10 — check-in card; null when user has <7 days of data (BE gate)
  // or while loading. Falls back silently to existing onboarding cards.
  const [checkIn, setCheckIn] = useState<DashboardCheckIn | null>(null)

  const today = todayLocalISO(tz)

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, plansRes, suggestionsRes, logsRes, profileRes, weightRes, checkInRes, sleepRes] = await Promise.all([
        getLogsSummary('day').catch(() => null),
        getPlans({ active_only: true }).catch(() => [] as Plan[]),
        getSuggestions({ status: 'pending' }).catch(() => [] as Suggestion[]),
        getLogs({ days: 1 }).catch(() => [] as Log[]),
        getProfile().catch(() => null),
        getLogs({ type: 'weight', limit: 100 }).catch(() => [] as Log[]),
        // FB-R6-10: optional, gracefully nulls out on any failure (incl. 404
        // if the BE endpoint isn't shipped on this branch yet).
        getDashboardCheckIn().catch(() => ({ check_in: null })),
        getLogs({ type: 'sleep', limit: 1 }).catch(() => [] as Log[]),
      ])
      setSummary(summaryRes)
      setPlans(plansRes)
      setSuggestions(suggestionsRes)
      setTodayLogs(logsRes)
      setProfile(profileRes)
      setWeightLogs(weightRes)
      setCheckIn(checkInRes.check_in)
      setRecentSleepLogs(sleepRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // FB-R6-08 — refetch when Geo deactivates the active plan via chat so the
  // dashboard cards (workout, next-up nutrition) reflect the new state
  // without a manual reload. Legacy DOM-event listener kept ONE release
  // while syncBus rolls out.
  useEffect(() => {
    const handler = () => { fetchData() }
    window.addEventListener('workout:plan-deactivated', handler)
    return () => {
      window.removeEventListener('workout:plan-deactivated', handler)
    }
  }, [fetchData])

  // FB-R6.7 Build B — chat→UI sync. Plans + logs both feed dashboard cards.
  useSyncRefetch(['plans:*', 'logs:*'], fetchData)

  useSetGeoScreen('dashboard', { loading })

  const mealPlan = (plans.find((p) => p.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((p) => p.type === 'workout') as WorkoutPlan) ?? null

  // FE-RCA F1 — Dashboard/Diary divergence fix.
  // Previous: fell back to `summary?.daily_breakdown?.[0]` when today had no
  // bucket. Because the BE orders daily_breakdown by created_at ASC ([0] is
  // the EARLIEST day), this rendered yesterday's calories as if they were
  // today's. Diary, correctly filtering by local_date, showed 0. The user
  // saw two different answers and trust collapsed.
  // Cure: only the today-bucket counts. No row → zero. Matches Diary's
  // strict-equality filter exactly.
  const dailyBreakdown = summary?.daily_breakdown?.find((d) => d.date === today)
  const caloriesConsumed = dailyBreakdown?.calories ?? 0
  const proteinConsumed = dailyBreakdown?.protein ?? 0
  const carbsConsumed = dailyBreakdown?.carbs ?? 0
  const fatConsumed = dailyBreakdown?.fat ?? 0

  // FB-tdee-baseline: profile.daily_*_target is the source of truth. A nutrition plan,
  // if active, may carry an optional override under content.daily_targets.
  // No hardcoded defaults — when the profile is incomplete, targets stay 0 and
  // the macro-progress component drops the "left" suffix gracefully.
  const planTargets = mealPlan?.content?.daily_targets
  const caloriesTarget = planTargets?.calories ?? profile?.daily_calorie_target ?? 0
  const proteinTarget = planTargets?.protein ?? profile?.daily_protein_g ?? 0
  const carbsTarget = planTargets?.carbs ?? profile?.daily_carbs_g ?? 0
  const fatTarget = planTargets?.fat ?? profile?.daily_fat_g ?? 0
  const profileIncomplete = (profile?.daily_targets_missing_fields?.length ?? 0) > 0

  const waterLogs = todayLogs.filter((l) => l.type === 'water')
  const water = waterLogs.reduce((sum, l) => sum + ((l.payload as any)?.glasses ?? 0), 0)

  const moodLogs = todayLogs.filter((l) => l.type === 'mood')
  const mood = moodLogs.length > 0
    ? Math.round(moodLogs.reduce((sum, l) => sum + ((l.payload as any)?.rating ?? 0), 0) / moodLogs.length)
    : 0

  // Prefer a sleep log from today; otherwise show the most recent night's sleep
  // (sleep is logged for "last night", which is yesterday's local_date).
  const sleepLogs = todayLogs.filter((l) => l.type === 'sleep')
  const sleep = sleepLogs.length > 0
    ? (sleepLogs[sleepLogs.length - 1].payload as any)?.hours ?? 0
    : recentSleepLogs.length > 0
      ? (recentSleepLogs[0].payload as any)?.hours ?? 0
      : summary?.summary?.avg_sleep_hours ?? 0

  const energyLogs = todayLogs.filter((l) => l.type === 'energy')
  const energy = energyLogs.length > 0
    ? Math.round(energyLogs.reduce((sum, l) => sum + ((l.payload as any)?.rating ?? 0), 0) / energyLogs.length)
    : summary?.summary?.avg_energy_rating ?? 0

  // Today's weight log — FB-12: prefer the user-local bucket so a morning
  // weigh-in shows under today regardless of UTC offset.
  const todayWeightLog = weightLogs.find(
    (l) => (l.local_date ?? new Date(l.created_at).toISOString().split('T')[0]) === today
  )
  const displayWeight = todayWeightLog
    ? (todayWeightLog.payload as any)?.weight_kg
    : profile?.current_weight_kg

  const firstName = user?.email?.split('@')[0] ?? 'there'
  const initials = firstName.slice(0, 2).toUpperCase()

  function handleSuggestionAction() {
    setSuggestions((prev) => prev.slice(1))
  }

  const router = useRouter()

  const nudges = useMemo(() => {
    if (loading) return []
    return computeNudges({ todayLogs, summary, mealPlan, workoutPlan, profile })
  }, [loading, todayLogs, summary, mealPlan, workoutPlan, profile])

  async function handleNudgeAction(nudge: Nudge) {
    switch (nudge.action) {
      case 'open_companion':
        useUIStore.getState().openSheet('geo-companion')
        break
      case 'start_workout':
        try {
          const data = nudge.actionData as { planId: string; dayIndex: number } | undefined
          if (data) {
            const session = await startWorkoutSession({ plan_id: data.planId, plan_day_index: data.dayIndex })
            router.push(`/activity/workout/${session.id}`)
          } else {
            router.push('/activity')
          }
        } catch {
          router.push('/activity')
        }
        break
      case 'open_food_search':
        router.push('/diary')
        break
      case 'open_full_chat':
        router.push('/chat')
        break
    }
  }

  const handleSheetDone = () => {
    setActiveSheet(null)
    fetchData()
  }

  return (
    <PageWrapper>
      <div
        className="fixed top-0 left-0 right-0 h-48 pointer-events-none -z-10"
        style={{ background: 'linear-gradient(180deg, #FDF0EB 0%, #FFFFFF 100%)' }}
      />

      {/* Greeting row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            Good {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">{formatDate(new Date())}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {profileIncomplete && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
              <p className="text-sm font-medium text-text-primary">Complete your profile to see daily targets</p>
              <p className="text-xs text-text-secondary mt-1">We need: {profile?.daily_targets_missing_fields?.join(', ')}</p>
              <button
                onClick={() => router.push('/settings/profile')}
                className="text-xs text-accent mt-2 underline"
              >
                Update profile →
              </button>
            </div>
          )}
          {/* FB-R6-10 — When the BE returns a check-in (≥7 days of activity
              across ≥2 of food/weight/workout), it leads the dashboard.
              When null, the existing nudge + next-up + empty-state cards
              run unchanged. */}
          {checkIn && <CheckInCard checkIn={checkIn} />}
          {nudges.map((nudge) => (
            <NudgeCard key={nudge.type} nudge={nudge} onAction={handleNudgeAction} />
          ))}
          {/* FE-RCA F8 — macros above training, per George (2026-06-09). */}
          <ProgressCard
            calories={{ consumed: caloriesConsumed, target: caloriesTarget }}
            protein={{ consumed: proteinConsumed, target: proteinTarget }}
            carbs={{ consumed: carbsConsumed, target: carbsTarget }}
            fat={{ consumed: fatConsumed, target: fatTarget }}
            foodLogs={todayLogs.filter((l) => l.type === 'food')}
          />
          <NextUpCard
            mealPlan={mealPlan}
            today={today}
            loggedMealTypes={todayLogs.filter((l) => l.type === 'food').map((l) => (l.payload as any)?.meal_type?.toLowerCase?.() ?? '')}
            onCreatePlan={() => {
              const id = crypto.randomUUID()
              router.push(`/chat/${id}?prefill=${encodeURIComponent('Can you create a 7-day nutrition plan for me based on my goals and preferences?')}`)
            }}
          />
          <WorkoutCard workoutPlan={workoutPlan} today={today} />
          <QuickStats
            water={water}
            mood={mood}
            sleep={sleep}
            energy={energy}
            weightKg={displayWeight}
            onWater={() => setActiveSheet('water')}
            onMood={() => setActiveSheet('mood')}
            onSleep={() => setActiveSheet('sleep')}
            onEnergy={() => setActiveSheet('energy')}
            onWeight={() => setActiveSheet('weight')}
          />
          <button
            onClick={() => router.push('/plans')}
            className="w-full bg-surface border border-border rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">My Plans</p>
                <p className="text-xs text-text-secondary">View and manage your meal & workout plans</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
          {suggestions.length > 0 && (
            <SuggestionCard suggestion={suggestions[0]} onAction={handleSuggestionAction} />
          )}
          {profile?.current_weight_kg && (
            <WeightChart
              startWeight={profile.current_weight_kg}
              targetWeight={profile.target_weight_kg ?? profile.current_weight_kg}
              weightLogs={weightLogs}
              profileCreatedAt={profile.created_at}
            />
          )}
        </div>
      )}

      {/* Quick log bottom sheet */}
      <QuickLogSheet
        type={activeSheet}
        onDone={handleSheetDone}
        onClose={() => setActiveSheet(null)}
        currentWeight={profile?.current_weight_kg}
      />
    </PageWrapper>
  )
}
