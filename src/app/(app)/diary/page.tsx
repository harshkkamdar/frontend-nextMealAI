'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { MacroProgress } from '@/components/shared/macro-progress'
import { MealGroup } from '@/components/diary/meal-group'
import { FoodSearchSheet } from '@/components/diary/food-search-sheet'
import { MonthViewSheet } from '@/components/diary/month-view-sheet'
import { NameFavouriteDialog } from '@/components/shared/name-favourite-dialog'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { toast } from 'sonner'
import { getLogs, getLogsSummary } from '@/lib/api/logs.api'
import { copyMeal } from '@/lib/api/meals.api'
import { createFavourite } from '@/lib/api/favourites.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { formatWeekMonthLabel } from '@/lib/month-label'
import type { Log, FoodPayload } from '@/types/logs.types'
import type { MealPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export default function DiaryPage() {
  const tz = useUserTimezone()
  const [selectedDate, setSelectedDate] = useState(() => todayLocalISO(tz))

  // FB-R5-02: snap selectedDate forward when tz upgrades from device→profile,
  // BUT only if the user is still sitting on what was "today" at mount.
  // Reading selectedDate from closure (stale) is intentional — that's the
  // pre-effect value we compare against todayAtMount. Don't add it to deps.
  const todayAtMountRef = useRef<string | null>(null)
  if (todayAtMountRef.current === null) {
    todayAtMountRef.current = todayLocalISO(tz)
  }
  useEffect(() => {
    const newToday = todayLocalISO(tz)
    if (selectedDate === todayAtMountRef.current && newToday !== todayAtMountRef.current) {
      setSelectedDate(newToday)
      todayAtMountRef.current = newToday
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stale read of selectedDate; see comment above
  }, [tz])
  const [logs, setLogs] = useState<Log[]>([])
  const [nameFavFor, setNameFavFor] = useState<string | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('Breakfast')
  const [monthOpen, setMonthOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<Log | null>(null)

  const router = useRouter()
  useSetGeoScreen('food_diary', { selectedDate })

  // How many days back to load so the SELECTED date's logs are included.
  // getLogs only does lookback-from-now, so the old fixed 7-day window made
  // any date older than a week render empty even when the user logged then
  // (you could scroll/jump the calendar back but the data was never fetched).
  // Floor at 30 so ordinary week-to-week navigation never refetches (no
  // skeleton flash); the window only grows when the user jumps further back.
  const today = todayLocalISO(tz)
  const neededDays = useMemo(() => {
    const diff = Math.round((Date.parse(today) - Date.parse(selectedDate)) / 86_400_000)
    return Math.max(30, (Number.isFinite(diff) ? diff : 0) + 7)
  }, [today, selectedDate])
  const firstLoadRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (firstLoadRef.current) setLoading(true)
    try {
      const [logsRes, plansRes, profileRes] = await Promise.all([
        getLogs({ type: 'food', days: neededDays }).catch(() => [] as Log[]),
        getPlans({ type: 'meal', active_only: true }).catch(() => []),
        getProfile().catch(() => null)
      ])
      setLogs(logsRes)
      const meal = plansRes.find((p) => p.type === 'meal') as MealPlan | undefined
      setMealPlan(meal ?? null)
      setProfile(profileRes)
    } finally {
      setLoading(false)
      firstLoadRef.current = false
    }
  }, [neededDays])

  useEffect(() => { fetchData() }, [fetchData])

  // FB-R6.7 Build B — chat→UI sync. When Geo logs/edits/deletes a meal OR
  // updates the active nutrition plan via chat, the diary reflects it
  // (logs list + macro bar targets) without a manual refresh.
  useSyncRefetch(['logs:*', 'plans:updated'], fetchData)

  // Filter logs for selected date — FB-12: prefer the user-local bucket date
  // so 7:21 AM logs land under "today" regardless of UTC offset. Falls back
  // to UTC slicing for legacy rows where local_date is still NULL.
  const dayLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = log.local_date ?? new Date(log.created_at).toISOString().split('T')[0]
      return logDate === selectedDate && log.type === 'food'
    })
  }, [logs, selectedDate])

  // Group by meal type
  const groupedMeals = useMemo(() => {
    const groups: Record<string, Log[]> = {}
    for (const meal of MEAL_TYPES) {
      groups[meal] = []
    }
    for (const log of dayLogs) {
      const payload = log.payload as FoodPayload
      const mt = payload.meal_type
        ? payload.meal_type.charAt(0).toUpperCase() + payload.meal_type.slice(1).toLowerCase()
        : 'Snack'
      if (groups[mt]) {
        groups[mt].push(log)
      } else {
        groups['Snack'].push(log)
      }
    }
    return groups
  }, [dayLogs])

  // Calculate day totals
  const dayTotals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const log of dayLogs) {
      const payload = log.payload as FoodPayload
      calories += payload.est_macros?.calories ?? 0
      protein += payload.est_macros?.protein ?? 0
      carbs += payload.est_macros?.carbs ?? 0
      fat += payload.est_macros?.fat ?? 0
    }
    return { calories, protein, carbs, fat }
  }, [dayLogs])

  // Targets: active nutrition plan first, then the user's profile targets, then
  // 0 (MacroProgress drops the "left" suffix gracefully). No hardcoded numbers —
  // a 2000-cal default was wrong for anyone whose real target differs.
  const planTargets = mealPlan?.content?.daily_targets
  const targets = {
    calories: planTargets?.calories ?? profile?.daily_calorie_target ?? 0,
    protein: planTargets?.protein ?? profile?.daily_protein_g ?? 0,
    carbs: planTargets?.carbs ?? profile?.daily_carbs_g ?? 0,
    fat: planTargets?.fat ?? profile?.daily_fat_g ?? 0,
  }

  // FB-07: month label for the current ±3 day window
  const weekLabel = useMemo(() => {
    const center = new Date(selectedDate + 'T12:00:00')
    const weekDates: string[] = []
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(center)
      d.setDate(d.getDate() + offset)
      weekDates.push(d.toISOString().split('T')[0])
    }
    return formatWeekMonthLabel(weekDates)
  }, [selectedDate])

  // Calendar indicators — FB-12: bucket the dot under the user's local date.
  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const log of logs) {
      const d = log.local_date ?? new Date(log.created_at).toISOString().split('T')[0]
      const existing = map.get(d) || {}
      existing.food = true
      map.set(d, existing)
    }
    return map
  }, [logs])

  const handleAddFood = (mealType: string) => {
    setEditingLog(null)
    setSelectedMealType(mealType)
    setSearchOpen(true)
  }

  // Copy the selected day's <mealType> onto today.
  const handleCopyToToday = async (mealType: string) => {
    try {
      const r = await copyMeal({ source_date: selectedDate, source_meal_type: mealType.toLowerCase() })
      toast.success(`Copied ${mealType} to today — ${r.copied} item${r.copied === 1 ? '' : 's'}`)
      fetchData()
    } catch {
      toast.error('Failed to copy meal')
    }
  }

  // Save the selected day's <mealType> as a reusable favourite. Opens a custom
  // in-app dialog (no native window.prompt) to name it.
  const handleSaveFavourite = (mealType: string) => setNameFavFor(mealType)

  const submitFavourite = async (name: string) => {
    const mealType = nameFavFor
    if (!mealType) return
    try {
      await createFavourite({ name, source_date: selectedDate, source_meal_type: mealType.toLowerCase(), default_meal_type: mealType.toLowerCase() })
      toast.success(`Saved "${name}" as a meal — find it under the Meals tab when adding food`)
      setNameFavFor(null)
    } catch (e) {
      toast.error((e as Error)?.message?.includes('exists') ? 'A meal with that name already exists' : 'Failed to save meal')
    }
  }

  const handleFoodLogged = () => {
    // Refresh data after logging
    fetchData()
    setSearchOpen(false)
  }

  const handleEditLog = (log: Log) => {
    setEditingLog(log)
    const mealType = (log.payload as FoodPayload).meal_type
    setSelectedMealType(
      mealType
        ? mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase()
        : 'Snack'
    )
    setSearchOpen(true)
  }

  const handleLogUpdated = (logId: string, payload: FoodPayload) => {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, payload } : l)))
    setEditingLog(null)
  }

  const handleLogDeleted = (logId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId))
    setEditingLog(null)
  }

  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-4">
        Food Diary
      </h1>

      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        indicators={indicators}
        label={weekLabel}
        onLabelClick={() => setMonthOpen(true)}
        tz={tz}
      />

      {loading ? (
        <div className="space-y-4 mt-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <MacroProgress
            calories={{ consumed: dayTotals.calories, target: targets.calories }}
            protein={{ consumed: dayTotals.protein, target: targets.protein }}
            carbs={{ consumed: dayTotals.carbs, target: targets.carbs }}
            fat={{ consumed: dayTotals.fat, target: targets.fat }}
            foodLogs={dayLogs}
          />

          {mealPlan && (
            <button
              onClick={() => router.push(`/plans/${mealPlan.id}`)}
              className="text-xs text-accent hover:underline"
            >
              View nutrition plan &rarr;
            </button>
          )}

          {MEAL_TYPES.map((mealType) => (
            <MealGroup
              key={mealType}
              mealType={mealType}
              items={groupedMeals[mealType] || []}
              onAddFood={() => handleAddFood(mealType)}
              onEditLog={handleEditLog}
              isToday={selectedDate === today}
              onCopyToToday={() => handleCopyToToday(mealType)}
              onSaveFavourite={() => handleSaveFavourite(mealType)}
            />
          ))}
        </div>
      )}

      <FoodSearchSheet
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setEditingLog(null) }}
        mealType={selectedMealType}
        logDate={selectedDate}
        existingMealLogs={dayLogs.filter((l) => (l.payload as FoodPayload)?.meal_type?.toLowerCase?.() === selectedMealType.toLowerCase())}
        mode={editingLog ? 'edit' : 'log'}
        existingLog={editingLog ?? undefined}
        onFoodLogged={handleFoodLogged}
        onLogUpdated={handleLogUpdated}
        onLogDeleted={handleLogDeleted}
      />

      <MonthViewSheet
        isOpen={monthOpen}
        initialDate={selectedDate}
        onClose={() => setMonthOpen(false)}
        onSelectDate={setSelectedDate}
        tz={tz}
      />

      <NameFavouriteDialog
        open={nameFavFor !== null}
        onClose={() => setNameFavFor(null)}
        onSubmit={submitFavourite}
        mealType={nameFavFor ?? undefined}
      />
    </PageWrapper>
  )
}
