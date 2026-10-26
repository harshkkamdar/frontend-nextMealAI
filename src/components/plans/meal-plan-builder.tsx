'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ActiveSwitch, AddButton, NameStep, NumberCell, RemoveButton, TargetStepper } from '@/components/plans/builder-fields'
import { SearchSheet } from '@/components/plans/search-sheet'
import { CARD } from '@/components/plans/spatial-parts'
import { DateInput } from '@/components/ui/fiqr/date-input'
import { createPlan, updatePlan, activatePlan } from '@/lib/api/plans.api'
import { searchFoods } from '@/lib/api/foods.api'
import type { FoodSearchResult } from '@/types/foods.types'
import type { MealPlan, MealPlanDay, MealPlanMeal } from '@/types/plans.types'
import { PlanBuilderStep } from '@/components/plans/plan-builder-step'
import { stepErrors } from '@/components/plans/plan-builder-parts'
import { goBack } from '@/lib/navigation'
import { Chip } from '@/components/ui/fiqr/chip'
import { haptic } from '@/lib/platform/app'

// FB-08 — Nutrition plan manual builder. Symmetric with the workout builder.
// Users set daily macro targets, then build out day-by-day meals. Meal
// names are searchable via the foods endpoint; macros auto-fill on select
// but stay editable.

export interface MealPlanBuilderProps {
  mode: 'create' | 'edit'
  initialPlan?: MealPlan
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const STEPS = ['name', 'targets', 'days'] as const

interface DraftMeal extends MealPlanMeal {
  _key: string
}

interface DraftDay {
  _key: string
  date: string
  meals: DraftMeal[]
}

let keySeed = 0
const nextKey = () => `mk-${++keySeed}-${Date.now()}`

function todayPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function newMeal(type: string, food: Partial<MealPlanMeal> = {}): DraftMeal {
  return { _key: nextKey(), type, name: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined, ...food }
}

/** A new day starts empty: meals come from the food search sheet (Add meal). */
function emptyDay(index: number): DraftDay {
  return { _key: nextKey(), date: todayPlus(index), meals: [] }
}

function fromInitial(plan: MealPlan | undefined): {
  name: string
  notes: string
  startDate: string
  endDate: string
  targets: { calories?: number; protein?: number; carbs?: number; fat?: number }
  days: DraftDay[]
} {
  if (!plan) {
    return {
      name: '',
      notes: '',
      startDate: '',
      endDate: '',
      // NOTE: the builder's validate() requires a positive calorie target, so
      // these are starting placeholders the user adjusts (not a display of their
      // own data). The impactful hardcoded-target bug — the DIARY showing 2000
      // instead of the user's real target — is fixed separately (diary now
      // resolves plan→profile→0). A profile-aware default here is deferred.
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
      days: [emptyDay(0)],
    }
  }
  const days: DraftDay[] = (plan.content.days ?? []).map((d, i) => ({
    _key: nextKey(),
    date: d.date ?? todayPlus(i),
    meals: (d.meals ?? []).map((m) => ({ ...m, _key: nextKey() })),
  }))
  return {
    // R7 #11 — prefill the plan name from stored content. It was hardcoded ''
    // in edit mode, so validate() ("Plan name is required") always failed and
    // "Save changes" was permanently disabled — the user could never save a
    // manual target change. (The workout builder already reads content.name.)
    name: plan.content.name ?? '',
    notes: plan.content.notes ?? '',
    startDate: plan.start_date ?? '',
    endDate: plan.end_date ?? '',
    targets: plan.content.daily_targets ?? { calories: 2000, protein: 150, carbs: 200, fat: 60 },
    days: days.length > 0 ? days : [emptyDay(0)],
  }
}

export function MealPlanBuilder({ mode, initialPlan }: MealPlanBuilderProps) {
  const router = useRouter()
  const initial = useMemo(() => fromInitial(initialPlan), [initialPlan])
  const [name, setName] = useState(initial.name)
  const [notes, setNotes] = useState(initial.notes)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [targets, setTargets] = useState(initial.targets)
  const [days, setDays] = useState<DraftDay[]>(initial.days)
  const [setActive, setSetActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [step, setStep] = useState(0)
  // The day the food search sheet adds to, and the meal type it adds as.
  const [sheetDay, setSheetDay] = useState<string | null>(null)
  const [mealType, setMealType] = useState('Breakfast')

  const errors = useMemo(() => validate({ name, targets, days }), [name, targets, days])
  const isValid = errors.length === 0

  function addDay() {
    setDays((prev) => [...prev, emptyDay(prev.length)])
  }
  function removeDay(key: string) {
    setDays((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d._key !== key)))
  }
  function patchDay(key: string, patch: Partial<DraftDay>) {
    setDays((prev) => prev.map((d) => (d._key === key ? { ...d, ...patch } : d)))
  }
  function addMeal(dayKey: string, meal: DraftMeal) {
    setDays((prev) =>
      prev.map((d) => (d._key === dayKey ? { ...d, meals: [...d.meals, meal] } : d)),
    )
  }
  function openSheet(dayKey: string, count: number) {
    setMealType(MEAL_TYPES[Math.min(count, MEAL_TYPES.length - 1)])
    setSheetDay(dayKey)
  }
  function removeMeal(dayKey: string, mealKey: string) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey ? { ...d, meals: d.meals.filter((m) => m._key !== mealKey) } : d,
      ),
    )
  }
  function patchMeal(dayKey: string, mealKey: string, patch: Partial<DraftMeal>) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey
          ? {
              ...d,
              meals: d.meals.map((m) => (m._key === mealKey ? { ...m, ...patch } : m)),
            }
          : d,
      ),
    )
  }

  async function handleSubmit() {
    if (!isValid) {
      toast.error(errors[0])
      return
    }
    setSubmitting(true)
    setSaveFailed(false)
    try {
      const content: MealPlan['content'] = {
        // R7 #11 — persist the plan name so a rename in the editor sticks
        // (previously omitted; the backend kept the old content.name).
        name: name.trim() || undefined,
        daily_targets: {
          calories: targets.calories!,
          protein: targets.protein!,
          carbs: targets.carbs!,
          fat: targets.fat!,
        },
        days: days.map((d) => ({
          date: d.date,
          meals: d.meals.map(({ _key, ...m }) => ({ ...m, name: m.name.trim() })),
        })) as MealPlanDay[],
        notes: notes.trim() || undefined,
      }

      if (mode === 'create') {
        const plan = await createPlan({
          type: 'meal',
          content,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        })
        if (setActive) {
          try {
            await activatePlan(plan.id)
          } catch {
            // non-fatal
          }
        }
        toast.success('Nutrition plan created')
        router.push(`/plans/view?id=${plan.id}`)
      } else if (initialPlan) {
        await updatePlan(initialPlan.id, { content })
        toast.success('Nutrition plan updated')
        router.push(`/plans/view?id=${initialPlan.id}`)
      }
    } catch {
      // Said in the dock above Try again (mock C1 "Didn't save"); the answers stay as they were.
      setSaveFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const current = STEPS[step]
  const blocking = stepErrors(current, errors)
  const last = step === STEPS.length - 1
  const copy = {
    name: { question: mode === 'create' ? 'What should we call this plan?' : 'Rename it, or keep going', why: mode === 'create' ? 'A name you\'ll recognise later. Dates and notes are optional.' : 'Saving keeps the old version in History.' },
    targets: { question: 'What are your daily targets?', why: 'Home and your food diary measure each day against these.' },
    days: { question: 'What does a day of eating look like?', why: 'Search a food to fill in its numbers. You can change any of them.' },
  }[current]
  const sheetIndex = days.findIndex((d) => d._key === sheetDay)
  const macroKcal = (targets.protein ?? 0) * 4 + (targets.carbs ?? 0) * 4 + (targets.fat ?? 0) * 9
  const gap = macroKcal - (targets.calories ?? 0)

  return (
    <>
    <PlanBuilderStep
      title={mode === 'create' ? 'New nutrition plan' : 'Edit nutrition plan'}
      step={step}
      steps={STEPS.length}
      stepKey={current}
      question={copy.question}
      why={copy.why}
      onBack={() => (step > 0 ? setStep(step - 1) : goBack(router, '/plans'))}
      cta={saveFailed && last ? 'Try again' : last ? (mode === 'create' ? 'Save plan' : 'Save changes') : 'Continue'}
      canContinue={last ? isValid : blocking.length === 0}
      busy={submitting}
      notice={saveFailed && last ? "That didn't save. Check your connection and try again." : current !== 'name' ? blocking[0] : undefined}
      onContinue={() => (last ? void handleSubmit() : setStep(step + 1))}
    >
      {current === 'name' ? (
        <NameStep
          name={name}
          onName={setName}
          placeholder="e.g. Cut phase"
          startDate={startDate}
          endDate={endDate}
          onDates={(next) => { setStartDate(next.startDate); setEndDate(next.endDate) }}
          notes={notes}
          onNotes={setNotes}
          notesPlaceholder="Anything Geo should keep in mind"
        />
      ) : current === 'targets' ? (
        <div className="flex flex-col gap-2.5">
          <TargetStepper label="Calories" macro="calories" unit="kcal" step={50} value={targets.calories} onChange={(v) => setTargets((t) => ({ ...t, calories: v }))} />
          <TargetStepper label="Protein" macro="protein" unit="g" step={5} value={targets.protein} onChange={(v) => setTargets((t) => ({ ...t, protein: v }))} />
          <TargetStepper label="Carbs" macro="carbs" unit="g" step={5} value={targets.carbs} onChange={(v) => setTargets((t) => ({ ...t, carbs: v }))} />
          <TargetStepper label="Fat" macro="fat" unit="g" step={5} value={targets.fat} onChange={(v) => setTargets((t) => ({ ...t, fat: v }))} />
          <p className="mx-1.5 mt-0.5 text-caption text-ink-65">
            Protein, carbs and fat add up to {Math.round(macroKcal).toLocaleString('en-AU')} kcal{Math.abs(gap) > 50 ? `, ${Math.round(Math.abs(gap)).toLocaleString('en-AU')} ${gap < 0 ? 'under' : 'over'} the calorie target` : ''}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {days.map((day, dayIndex) => (
            <MealDayCard
              key={day._key}
              day={day}
              index={dayIndex}
              total={days.length}
              canRemove={days.length > 1}
              onPatch={(patch) => patchDay(day._key, patch)}
              onRemove={() => removeDay(day._key)}
              onAddMeal={() => openSheet(day._key, day.meals.length)}
              onRemoveMeal={(mealKey) => removeMeal(day._key, mealKey)}
              onPatchMeal={(mealKey, patch) => patchMeal(day._key, mealKey, patch)}
            />
          ))}
          <AddButton onClick={addDay}>Add day</AddButton>
          {mode === 'create' ? <div className="mt-1"><ActiveSwitch checked={setActive} onChange={setSetActive} /></div> : null}
        </div>
      )}
    </PlanBuilderStep>
    <SearchSheet<FoodSearchResult>
      open={sheetDay !== null}
      onClose={() => setSheetDay(null)}
      title={`Add to day ${sheetIndex + 1}`}
      label="Search foods"
      placeholder="Search foods"
      search={searchFoods}
      getKey={(item) => item.id ?? item.name}
      chips={(
        <div role="group" aria-label="Meal" data-no-swipe-back className="scrollbar-hide -mx-3.5 mb-2.5 flex gap-2 overflow-x-auto px-3.5">
          {MEAL_TYPES.map((type) => (
            <Chip key={type} selected={mealType === type} onClick={() => { void haptic('selection'); setMealType(type) }} className="shrink-0 transition-transform active:scale-[.96]">{type}</Chip>
          ))}
        </div>
      )}
      renderItem={(item) => (
        <>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-bold text-ink [overflow-wrap:anywhere]">{item.name}</span>
            <span className="block truncate text-caption text-ink-65">{[item.brand, `${Math.round(item.serving_size_g)} g`, item.macros_per_serving.protein != null ? `${Math.round(item.macros_per_serving.protein)} g protein` : null].filter(Boolean).join(', ')}</span>
          </span>
          <span className="shrink-0 text-body font-bold text-ink tabular-nums">{Math.round(item.macros_per_serving.calories ?? 0)}<span className="text-caption font-semibold text-ink-65"> kcal</span></span>
        </>
      )}
      onPick={(item) => { if (sheetDay) addMeal(sheetDay, newMeal(mealType, { name: item.name, calories: item.macros_per_serving.calories, protein: item.macros_per_serving.protein, carbs: item.macros_per_serving.carbs, fat: item.macros_per_serving.fat })) }}
      onPickTyped={(text) => { if (sheetDay) addMeal(sheetDay, newMeal(mealType, { name: text })) }}
    />
    </>
  )
}

function MealDayCard({
  day,
  index,
  total,
  canRemove,
  onPatch,
  onRemove,
  onAddMeal,
  onRemoveMeal,
  onPatchMeal,
}: {
  day: DraftDay
  index: number
  total: number
  canRemove: boolean
  onPatch: (patch: Partial<DraftDay>) => void
  onRemove: () => void
  onAddMeal: () => void
  onRemoveMeal: (mealKey: string) => void
  onPatchMeal: (mealKey: string, patch: Partial<DraftMeal>) => void
}) {
  return (
    <section aria-label={`Day ${index + 1}`} className={`${CARD} overflow-hidden`}>
      <div className="flex min-h-14 items-center gap-1 border-b border-ink-06 pl-1 pr-3">
        <div className="min-w-0 flex-1">
          <DateInput ariaLabel={`Day ${index + 1} date`} value={day.date} onChange={(date) => onPatch({ date })} placeholder="Pick a date" className="h-14 text-body font-bold" />
        </div>
        <span className="shrink-0 text-caption text-ink-65">Day {index + 1} of {total}</span>
        {canRemove ? <RemoveButton label={`Remove day ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      {day.meals.map((meal, mealIndex) => (
        <MealRow key={meal._key} meal={meal} index={mealIndex} onPatch={(patch) => onPatchMeal(meal._key, patch)} onRemove={() => onRemoveMeal(meal._key)} />
      ))}
      <div className="p-3"><AddButton onClick={onAddMeal}>Add meal</AddButton></div>
    </section>
  )
}

/** A planned food: type, name, its four numbers as typeable cells (the search fills them; any can change). */
function MealRow({ meal, index, onPatch, onRemove }: { meal: DraftMeal; index: number; onPatch: (patch: Partial<DraftMeal>) => void; onRemove: () => void }) {
  const name = meal.name || `Meal ${index + 1}`
  return (
    <div className="border-b border-ink-06 px-4 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-ink-65">{meal.type}</p>
          <p className="text-body font-bold text-ink [overflow-wrap:anywhere]">{name}</p>
        </div>
        <RemoveButton label={`Remove ${name}`} onClick={onRemove} />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 min-[380px]:grid-cols-4">
        <NumberCell label="kcal" ariaLabel={`${name} calories`} value={meal.calories} onChange={(v) => onPatch({ calories: v })} />
        <NumberCell label="P" ariaLabel={`${name} protein, grams`} value={meal.protein} onChange={(v) => onPatch({ protein: v })} />
        <NumberCell label="C" ariaLabel={`${name} carbs, grams`} value={meal.carbs} onChange={(v) => onPatch({ carbs: v })} />
        <NumberCell label="F" ariaLabel={`${name} fat, grams`} value={meal.fat} onChange={(v) => onPatch({ fat: v })} />
      </div>
    </div>
  )
}

export function validate({
  name,
  targets,
  days,
}: {
  name: string
  targets: { calories?: number; protein?: number; carbs?: number; fat?: number }
  days: DraftDay[]
}): string[] {
  const errors: string[] = []
  if (!name.trim()) errors.push('Plan name is required')
  if (targets.calories === undefined || targets.calories <= 0) errors.push('Calorie target is required')
  if (targets.protein === undefined || targets.protein < 0) errors.push('Protein target is required')
  if (targets.carbs === undefined || targets.carbs < 0) errors.push('Carb target is required')
  if (targets.fat === undefined || targets.fat < 0) errors.push('Fat target is required')
  if (days.length === 0) errors.push('At least one day is required')
  for (const [i, day] of days.entries()) {
    if (day.meals.length === 0) {
      errors.push(`Day ${i + 1} needs at least one meal`)
      continue
    }
    for (const [j, meal] of day.meals.entries()) {
      if (!meal.name.trim()) errors.push(`Day ${i + 1} meal ${j + 1} needs a name`)
    }
  }
  return errors
}
