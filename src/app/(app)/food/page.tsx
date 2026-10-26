'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { LargeTitleHeader } from '@/components/layout/screen-header'
import { DayHero, DaySkeleton, FadeText } from '@/components/diary/day-hero'
import { MealGroup } from '@/components/diary/meal-group'
import { FoodSearchSheet } from '@/components/diary/food-search-sheet'
import { MonthViewSheet } from '@/components/diary/month-view-sheet'
import { NameFavouriteDialog } from '@/components/shared/name-favourite-dialog'
import { CopyMealDialog } from '@/components/diary/copy-meal-dialog'
import { OfflineBand } from '@/components/shared/offline-band'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { WeekStrip, addDays } from '@/components/ui/fiqr/week-strip'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useSyncRefetch } from '@/hooks/use-sync-refetch'
import { toast } from 'sonner'
import { getLogs } from '@/lib/api/logs.api'
import { copyMeal } from '@/lib/api/meals.api'
import { createFavourite } from '@/lib/api/favourites.api'
import { getPlans } from '@/lib/api/plans.api'
import { getProfile } from '@/lib/api/profile.api'
import { reducedFade } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { todayLocalISO } from '@/lib/timezone'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import type { Log, FoodPayload } from '@/types/logs.types'
import type { MealPlan } from '@/types/plans.types'
import { ErrorState } from '@/components/ui/fiqr/error-state'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

// Entrance choreography runs on the first paint of a session only; revisits paint at rest (motion-feel 3e).
let firstPaintDone = false

/** "Today, Mon 26 Oct", "Yesterday, Sun 25 Oct", "Thu 22 Oct" (year added outside the current one). */
function daySubtitle(iso: string, today: string): string {
  const date = new Date(`${iso}T12:00:00`)
  const sameYear = iso.slice(0, 4) === today.slice(0, 4)
  const label = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).replace(',', '')
  const relative = iso === today ? 'Today' : iso === addDays(today, -1) ? 'Yesterday' : iso === addDays(today, 1) ? 'Tomorrow' : null
  return relative ? `${relative}, ${label}` : label
}

/** True once `flag` has held for `ms`, so a fast load never flashes a skeleton (motion-feel 3h). */
function useHeld(flag: boolean, ms: number): boolean {
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!flag) return
    const timer = setTimeout(() => setHeld(true), ms)
    return () => { clearTimeout(timer); setHeld(false) }
  }, [flag, ms])
  return flag && held
}

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
          ? `Copied ${r.copied} item${r.copied === 1 ? '' : 's'} to today's ${targetMeal.toLowerCase()}`
          : `${source} is empty, so there's nothing to copy`,
      )
      if (r.copied > 0) refetch()
    } catch {
      toast.error("Couldn't copy that meal. Try again.")
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
      toast.success(`Saved "${name}". It's under Meals when you add food.`)
      setNameFavFor(null)
    } catch (e) {
      toast.error((e as Error)?.message?.includes('exists') ? 'You already have a meal with that name' : "Couldn't save that meal. Try again.")
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

  const reduce = useReducedMotion()
  const showSkeleton = useHeld(!data && loading, 150)
  // The date shown when data first arrived: that block paints in place, later days crossfade in.
  const [animateIn] = useState(() => !firstPaintDone)
  const firstDateRef = useRef<string | null>(null)
  if (data && firstDateRef.current === null) firstDateRef.current = selectedDate
  useEffect(() => { if (data) firstPaintDone = true }, [data])
  const loggedDays = useMemo(() => new Set(indicators.keys()), [indicators])

  const selectDate = (date: string) => {
    if (date === selectedDate) return
    void haptic('selection')
    setSelectedDate(date)
  }

  const isFirstBlock = selectedDate === firstDateRef.current

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <LargeTitleHeader
        title="Food"
        subtitle={<FadeText text={daySubtitle(selectedDate, today)} />}
        actions={<RoundButton aria-label="Open month view" onClick={() => setMonthOpen(true)}><CalendarDays strokeWidth={1.75} /></RoundButton>}
      >
        <WeekStrip className="mt-4" selected={selectedDate} today={today} onSelect={selectDate} marked={loggedDays} markLabel="food logged" />
      </LargeTitleHeader>

      <div className="-mx-4 mt-3">
        <OfflineBand />
      </div>

      {!data && loading ? (
        showSkeleton ? <DaySkeleton /> : null
      ) : !data ? (
        <div className="mt-6"><ErrorState onRetry={() => void refetch()}>I couldn&apos;t load this day. Check your connection and try again.</ErrorState></div>
      ) : (
        <div className="mt-5">
          <motion.div
            initial={animateIn ? (reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }) : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? reducedFade : { type: 'spring', stiffness: 300, damping: 35 }}
          >
            <DayHero
              calories={{ current: dayTotals.calories, target: targets.calories }}
              macros={{ protein: [dayTotals.protein, targets.protein], carbs: [dayTotals.carbs, targets.carbs], fat: [dayTotals.fat, targets.fat] }}
              animateIn={animateIn}
              footer={mealPlan ? (
                <button
                  type="button"
                  onClick={() => router.push(`/plans/view?id=${mealPlan.id}`)}
                  className="-mx-5 -mb-5 mt-4 flex min-h-12 w-[calc(100%+40px)] items-center gap-2 border-t border-ink-06 px-5 text-left text-[14px] font-semibold text-ink-65 active:bg-ink-04"
                >
                  <span className="min-w-0 flex-1">See your nutrition plan</span>
                  <ChevronRightIcon className="size-4 text-ink-35" />
                </button>
              ) : null}
            />
          </motion.div>

          {/* Day change: the old day fades out over 120 ms while the new one fades in over 180 ms, stacked in one cell. */}
          <LayoutGroup>
            <div className="mt-6 grid">
              <AnimatePresence initial={false}>
                <motion.div
                  key={selectedDate}
                  style={{ gridArea: '1 / 1' }}
                  className="flex flex-col gap-5"
                  initial={isFirstBlock ? false : { opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: reduce ? 0.15 : 0.18, ease: 'easeOut' } }}
                  exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
                >
                  {MEAL_TYPES.map((mealType, index) => (
                    <MealGroup
                      key={mealType}
                      mealType={mealType}
                      items={groupedMeals[mealType] || []}
                      onAddFood={() => handleAddFood(mealType)}
                      onEditLog={handleEditLog}
                      isToday={selectedDate === today}
                      onCopyToToday={() => handleCopyToToday(mealType)}
                      onSaveFavourite={() => handleSaveFavourite(mealType)}
                      enterDelay={animateIn && isFirstBlock ? 0.24 + index * 0.03 : undefined}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </LayoutGroup>
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
        onSelectDate={selectDate}
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
    </div>
  )
}
