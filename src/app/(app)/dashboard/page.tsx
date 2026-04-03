'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { getLogsSummary, getLogs, createLog } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { getSuggestions } from '@/lib/api/suggestions.api'
import { getProfile } from '@/lib/api/profile.api'
import { getGreeting, formatDate, todayISO } from '@/lib/utils'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
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
        className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
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
        className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
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
        className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
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
        className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-semibold text-white disabled:opacity-50">
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
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<LogsSummary | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [todayLogs, setTodayLogs] = useState<Log[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weightLogs, setWeightLogs] = useState<Log[]>([])
  const [activeSheet, setActiveSheet] = useState<QuickLogType>(null)

  const today = todayISO()

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, plansRes, suggestionsRes, logsRes, profileRes, weightRes] = await Promise.all([
        getLogsSummary('day').catch(() => null),
        getPlans({ active_only: true }).catch(() => [] as Plan[]),
        getSuggestions({ status: 'pending' }).catch(() => [] as Suggestion[]),
        getLogs({ days: 1 }).catch(() => [] as Log[]),
        getProfile().catch(() => null),
        getLogs({ type: 'weight', limit: 100 }).catch(() => [] as Log[]),
      ])
      setSummary(summaryRes)
      setPlans(plansRes)
      setSuggestions(suggestionsRes)
      setTodayLogs(logsRes)
      setProfile(profileRes)
      setWeightLogs(weightRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useSetGeoScreen('dashboard', { loading })

  const mealPlan = (plans.find((p) => p.type === 'meal') as MealPlan) ?? null
  const workoutPlan = (plans.find((p) => p.type === 'workout') as WorkoutPlan) ?? null

  const dailyBreakdown = summary?.daily_breakdown?.find((d) => d.date === today)
    ?? summary?.daily_breakdown?.[0]
  const caloriesConsumed = dailyBreakdown?.calories ?? summary?.summary?.avg_daily_calories ?? 0
  const proteinConsumed = dailyBreakdown?.protein ?? summary?.summary?.avg_daily_protein ?? 0
  const carbsConsumed = dailyBreakdown?.carbs ?? 0
  const fatConsumed = dailyBreakdown?.fat ?? 0

  const targets = mealPlan?.content?.daily_targets
  const caloriesTarget = targets?.calories ?? 2000
  const proteinTarget = targets?.protein ?? 150
  const carbsTarget = targets?.carbs ?? 250
  const fatTarget = targets?.fat ?? 65

  const waterLogs = todayLogs.filter((l) => l.type === 'water')
  const water = waterLogs.reduce((sum, l) => sum + ((l.payload as any)?.glasses ?? 0), 0)

  const moodLogs = todayLogs.filter((l) => l.type === 'mood')
  const mood = moodLogs.length > 0
    ? Math.round(moodLogs.reduce((sum, l) => sum + ((l.payload as any)?.rating ?? 0), 0) / moodLogs.length)
    : 0

  const sleepLogs = todayLogs.filter((l) => l.type === 'sleep')
  const sleep = sleepLogs.length > 0
    ? (sleepLogs[sleepLogs.length - 1].payload as any)?.hours ?? 0
    : summary?.summary?.avg_sleep_hours ?? 0

  const energyLogs = todayLogs.filter((l) => l.type === 'energy')
  const energy = energyLogs.length > 0
    ? Math.round(energyLogs.reduce((sum, l) => sum + ((l.payload as any)?.rating ?? 0), 0) / energyLogs.length)
    : summary?.summary?.avg_energy_rating ?? 0

  // Today's weight log
  const todayWeightLog = weightLogs.find(
    (l) => new Date(l.created_at).toISOString().split('T')[0] === today
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
          {nudges.map((nudge) => (
            <NudgeCard key={nudge.type} nudge={nudge} onAction={handleNudgeAction} />
          ))}
          <NextUpCard
            mealPlan={mealPlan}
            today={today}
            loggedMealTypes={todayLogs.filter((l) => l.type === 'food').map((l) => (l.payload as any)?.meal_type?.toLowerCase?.() ?? '')}
            onCreatePlan={() => {
              const id = crypto.randomUUID()
              router.push(`/chat/${id}?prefill=${encodeURIComponent('Can you create a 7-day meal plan for me based on my goals and preferences?')}`)
            }}
          />
          <WorkoutCard workoutPlan={workoutPlan} today={today} />
          <ProgressCard
            calories={{ consumed: caloriesConsumed, target: caloriesTarget }}
            protein={{ consumed: proteinConsumed, target: proteinTarget }}
            carbs={{ consumed: carbsConsumed, target: carbsTarget }}
            fat={{ consumed: fatConsumed, target: fatTarget }}
          />
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
