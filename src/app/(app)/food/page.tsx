'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CalendarStrip } from '@/components/shared/calendar-strip'
import { MealGroup } from '@/components/diary/meal-group'
import { FoodSearchSheet } from '@/components/diary/food-search-sheet'
import { MonthViewSheet } from '@/components/diary/month-view-sheet'
import { NameFavouriteDialog } from '@/components/shared/name-favourite-dialog'
import { CopyMealDialog } from '@/components/diary/copy-meal-dialog'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { OfflineBand } from '@/components/shared/offline-band'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'
import { PrimaryButton as FoodActionButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { toast } from 'sonner'
import { getLogs } from '@/lib/api/logs.api'
import { copyMeal } from '@/lib/api/meals.api'
import { createFavourite } from '@/lib/api/favourites.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import type { Log, FoodPayload } from '@/types/logs.types'
import type { MealPlan } from '@/types/plans.types'
import { ErrorState } from '@/components/ui/fiqr/error-state'

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
  const [nameFavFor, setNameFavFor] = useState<string | null>(null)
  const [copyFrom, setCopyFrom] = useState<string | null>(null)
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
  const fetchData = useCallback(async () => {
    const [logsRes, plansRes, profileRes] = await Promise.all([
      getLogs({ type: 'food', days: neededDays }),
      getPlans({ type: 'meal', active_only: true }),
      getProfile(),
    ])
    const meal = plansRes.find((p) => p.type === 'meal') as MealPlan | undefined
    return { logs: logsRes, mealPlan: meal ?? null, profile: profileRes }
  }, [neededDays])

  const { data, loading, error, refetch } = useCachedQuery(
    `food:${selectedDate}`,
    fetchData,
    [neededDays],
  )

  const logs = useMemo(() => data?.logs ?? [], [data?.logs])
  const mealPlan = data?.mealPlan ?? null
  const profile = data?.profile ?? null

  // FB-R6.7 Build B — chat→UI sync. When Geo logs/edits/deletes a meal OR
  // updates the active nutrition plan via chat, the diary reflects it
  // (logs list + macro bar targets) without a manual refresh.
  useSyncRefetch(['logs:*', 'plans:updated'], refetch)

  // Filter logs for selected date — FB-12: prefer the user-local bucket date
  // so 7:21 AM logs land under "today" regardless of UTC offset. Falls back
  // to UTC slicing for legacy rows where local_date is still NULL.
  const dayLogs = useMemo(() => {
    return logs.filter((log) => {
      // G-FOOD-04: bucket NULL-local_date (legacy) rows by the user's tz, not a
      // UTC slice — a UTC slice disagrees with the backend at the midnight
      // boundary, so a row the backend files under "today" could paint under
      // "yesterday" here (a source of "logged, didn't show, showed up later").
      const logDate = log.local_date ?? todayLocalISO(tz, new Date(log.created_at))
      return logDate === selectedDate && log.type === 'food'
    })
  }, [logs, selectedDate, tz])

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
  // 0. No hardcoded numbers —
  // a 2000-cal default was wrong for anyone whose real target differs.
  const planTargets = mealPlan?.content?.daily_targets
  const targets = {
    calories: planTargets?.calories ?? profile?.daily_calorie_target ?? 0,
    protein: planTargets?.protein ?? profile?.daily_protein_g ?? 0,
    carbs: planTargets?.carbs ?? profile?.daily_carbs_g ?? 0,
    fat: planTargets?.fat ?? profile?.daily_fat_g ?? 0,
  }

  // Calendar indicators — FB-12: bucket the dot under the user's local date.
  const indicators = useMemo(() => {
    const map = new Map<string, { food?: boolean; workout?: boolean }>()
    for (const log of logs) {
      const d = log.local_date ?? todayLocalISO(tz, new Date(log.created_at))
      const existing = map.get(d) || {}
      existing.food = true
      map.set(d, existing)
    }
    return map
  }, [logs, tz])

  // R6-12 — "Add food" now opens the dedicated full-page logger (favourites +
  // recents first, multi-add), bucketed to the viewed meal + date. Returning
  // (router.back) remounts the diary, which refetches. Editing an existing log
  // still uses the inline sheet below.
  const handleAddFood = (mealType: string) => {
    router.push(`/logs/new/food?meal=${encodeURIComponent(mealType)}&date=${encodeURIComponent(selectedDate)}`)
  }

  // Copy the selected day's <mealType> onto today.
  // Open the meal picker so the user chooses which slot to copy INTO (a lunch
  // they ate for breakfast can go to Breakfast). Defaults to the source meal.
  const handleCopyToToday = (mealType: string) => setCopyFrom(mealType)

  const doCopyToToday = async (targetMeal: string) => {
    const source = copyFrom
    if (!source) return
    setCopyFrom(null)
    try {
      const r = await copyMeal({
        source_date: selectedDate,
        source_meal_type: source.toLowerCase(),
        target_meal_type: targetMeal.toLowerCase(),
      })
      toast[r.copied > 0 ? 'success' : 'error'](
        r.copied > 0
          ? `Copied ${source} to today's ${targetMeal} — ${r.copied} item${r.copied === 1 ? '' : 's'}`
          : `Nothing to copy from ${source}`,
      )
      if (r.copied > 0) refetch()
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
    refetch()
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

  const handleLogUpdated = (_logId: string, _payload: FoodPayload) => {
    refetch()
    setEditingLog(null)
  }

  const handleLogDeleted = (_logId: string) => {
    refetch()
    setEditingLog(null)
  }

  const selectedDay = new Date(`${selectedDate}T12:00:00`)
  const monthLabel = selectedDay.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }).toUpperCase()
  const dayLabel = `${selectedDay.toLocaleDateString('en-AU', { weekday: 'long' })} ${selectedDay.getDate()}`

  return (
    <PageWrapper className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-65">{monthLabel}</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">{dayLabel}</h1>
        </div>
        <button
          type="button"
          onClick={() => setMonthOpen(true)}
          aria-label="Open month view"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink-16 bg-ink-08 text-ink-65"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
      </header>

      <OfflineBand />

      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        indicators={indicators}
        tz={tz}
      />

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !data && error ? (
        <ErrorState onRetry={() => void refetch()}>I couldn&apos;t load this day. Check your connection and try again.</ErrorState>
      ) : (
        <div className="space-y-6">
          <section>
            <SectionLabel className="mb-3">This day</SectionLabel>
            <div className="flex flex-col gap-[13px]">
              <MacroBar name="Calories" current={dayTotals.calories} target={targets.calories} />
              <MacroBar name="Protein" current={dayTotals.protein} target={targets.protein} unit="g" />
              <MacroBar name="Carbs" current={dayTotals.carbs} target={targets.carbs} unit="g" />
              <MacroBar name="Fat" current={dayTotals.fat} target={targets.fat} unit="g" />
            </div>

            {mealPlan && (
              <button
                onClick={() => router.push(`/plans/view?id=${mealPlan.id}`)}
                className="mt-4 text-[13.5px] font-semibold text-ink-65"
              >
                View nutrition plan &rarr;
              </button>
            )}
          </section>

          <div className="space-y-6">
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

          <div className="sticky z-20 -mx-gutter bg-cream px-gutter pb-7 pt-3" style={{ bottom: 'calc(68px + var(--safe-bottom))' }}>
            <FoodActionButton
              icon="+"
              trailing="Scan · Search"
              onClick={() => router.push(`/logs/new/food?date=${selectedDate}`)}
            >
              Log food
            </FoodActionButton>
          </div>
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

      <CopyMealDialog
        open={copyFrom !== null}
        sourceMeal={copyFrom}
        onClose={() => setCopyFrom(null)}
        onPick={doCopyToToday}
      />
    </PageWrapper>
  )
}
