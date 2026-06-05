'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { MacroProgress } from '@/components/shared/macro-progress'
import { MealGroup } from '@/components/diary/meal-group'
import { FoodSearchSheet } from '@/components/diary/food-search-sheet'
import { MonthViewSheet } from '@/components/diary/month-view-sheet'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { getLogs, getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { formatWeekMonthLabel } from '@/lib/month-label'
import type { Log, FoodPayload } from '@/types/logs.types'
import type { MealPlan } from '@/types/plans.types'

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
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('Breakfast')
  const [monthOpen, setMonthOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<Log | null>(null)

  const router = useRouter()
  useSetGeoScreen('food_diary', { selectedDate })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, plansRes] = await Promise.all([
        getLogs({ type: 'food', days: 7 }).catch(() => [] as Log[]),
        getPlans({ type: 'meal', active_only: true }).catch(() => [])
      ])
      setLogs(logsRes)
      const meal = plansRes.find((p) => p.type === 'meal') as MealPlan | undefined
      setMealPlan(meal ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

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

  const targets = mealPlan?.content?.daily_targets ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 }

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
            />
          ))}
        </div>
      )}

      <FoodSearchSheet
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setEditingLog(null) }}
        mealType={selectedMealType}
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
    </PageWrapper>
  )
}
