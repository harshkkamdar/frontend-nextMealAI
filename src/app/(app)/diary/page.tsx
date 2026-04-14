'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { MacroProgress } from '@/components/shared/macro-progress'
import { MealGroup } from '@/components/diary/meal-group'
import { FoodSearchSheet } from '@/components/diary/food-search-sheet'
import { MonthViewSheet } from '@/components/diary/month-view-sheet'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { getLogs, getLogsSummary } from '@/lib/api/logs.api'
import { getPlans } from '@/lib/api/plans.api'
import { todayISO } from '@/lib/utils'
import { formatWeekMonthLabel } from '@/lib/month-label'
import type { Log, FoodPayload } from '@/types/logs.types'
import type { MealPlan } from '@/types/plans.types'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export default function DiaryPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [logs, setLogs] = useState<Log[]>([])
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('Breakfast')
  const [monthOpen, setMonthOpen] = useState(false)

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

  // Filter logs for selected date
  const dayLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0]
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

  // Calendar indicators
  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const log of logs) {
      const d = new Date(log.created_at).toISOString().split('T')[0]
      const existing = map.get(d) || {}
      existing.food = true
      map.set(d, existing)
    }
    return map
  }, [logs])

  const handleAddFood = (mealType: string) => {
    setSelectedMealType(mealType)
    setSearchOpen(true)
  }

  const handleDeleteLog = (logId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId))
  }

  const handleFoodLogged = () => {
    // Refresh data after logging
    fetchData()
    setSearchOpen(false)
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
          />

          {mealPlan && (
            <button
              onClick={() => router.push(`/plans/${mealPlan.id}`)}
              className="text-xs text-accent hover:underline"
            >
              View meal plan &rarr;
            </button>
          )}

          {MEAL_TYPES.map((mealType) => (
            <MealGroup
              key={mealType}
              mealType={mealType}
              items={groupedMeals[mealType] || []}
              onAddFood={() => handleAddFood(mealType)}
              onDeleteLog={handleDeleteLog}
            />
          ))}
        </div>
      )}

      <FoodSearchSheet
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        mealType={selectedMealType}
        onFoodLogged={handleFoodLogged}
      />

      <MonthViewSheet
        isOpen={monthOpen}
        initialDate={selectedDate}
        onClose={() => setMonthOpen(false)}
        onSelectDate={setSelectedDate}
      />
    </PageWrapper>
  )
}
