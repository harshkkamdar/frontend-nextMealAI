'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  PlanNameField,
  PlanDateRangeField,
  DateInput,
  NumberField,
  SearchablePicker,
  AddRowButton,
  RemoveRowButton,
} from '@/components/plans/plan-builder-shared'
import { createPlan, updatePlan, activatePlan } from '@/lib/api/plans.api'
import { searchFoods } from '@/lib/api/foods.api'
import type { FoodSearchResult } from '@/types/foods.types'
import type { MealPlan, MealPlanDay, MealPlanMeal } from '@/types/plans.types'
import { PlanBuilderStep } from '@/components/plans/plan-builder-step'
import { ActiveToggle, BuilderNotes, DayCardShell, stepErrors } from '@/components/plans/plan-builder-parts'
import { goBack } from '@/components/plans/plan-format'
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

function emptyMeal(type = 'Breakfast'): DraftMeal {
  return {
    _key: nextKey(),
    type,
    name: '',
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fat: undefined,
  }
}

function emptyDay(index: number): DraftDay {
  return { _key: nextKey(), date: todayPlus(index), meals: [emptyMeal('Breakfast')] }
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
  const [step, setStep] = useState(0)

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
  function addMeal(dayKey: string) {
    setDays((prev) =>
      prev.map((d) => (d._key === dayKey ? { ...d, meals: [...d.meals, emptyMeal()] } : d)),
    )
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const current = STEPS[step]
  const blocking = stepErrors(current, errors)
  const last = step === STEPS.length - 1
  const copy = {
    name: { question: mode === 'create' ? 'What should we call this plan?' : 'Rename it, or keep going', why: 'A name you will recognise later. Dates and notes are optional.' },
    targets: { question: 'What are your daily targets?', why: 'Home and the food diary measure each day against these.' },
    days: { question: 'What does a day of eating look like?', why: 'Search a food to fill in its numbers. You can change any of them.' },
  }[current]

  return (
    <PlanBuilderStep
      title={mode === 'create' ? 'New nutrition plan' : 'Edit nutrition plan'}
      step={step}
      steps={STEPS.length}
      stepKey={current}
      question={copy.question}
      why={copy.why}
      onBack={() => (step > 0 ? setStep(step - 1) : goBack(router, '/plans'))}
      cta={last ? 'Save plan' : 'Continue'}
      canContinue={last ? isValid : blocking.length === 0}
      busy={submitting}
      notice={current !== 'name' ? blocking[0] : undefined}
      onContinue={() => (last ? void handleSubmit() : setStep(step + 1))}
    >
      {current === 'name' ? (
        <div className="space-y-6">
          <PlanNameField value={name} onChange={setName} placeholder="e.g. Cut phase" />
          <PlanDateRangeField startDate={startDate} endDate={endDate} onChange={(next) => { setStartDate(next.startDate); setEndDate(next.endDate) }} />
          <BuilderNotes value={notes} onChange={setNotes} placeholder="Anything Geo should keep in mind" />
        </div>
      ) : current === 'targets' ? (
        <div className="grid grid-cols-2 gap-[10px]">
          {([['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'], ['fat', 'Fat', 'g']] as const).map(([key, label, suffix]) => (
            <div key={key} className="rounded-[22px] bg-card p-4 shadow-[var(--shadow-card)]">
              <NumberField label={label} suffix={suffix} value={targets[key]} onChange={(v) => setTargets((t) => ({ ...t, [key]: v }))} min={0} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day, dayIndex) => (
            <MealDayCard
              key={day._key}
              day={day}
              index={dayIndex}
              canRemove={days.length > 1}
              onPatch={(patch) => patchDay(day._key, patch)}
              onRemove={() => removeDay(day._key)}
              onAddMeal={() => addMeal(day._key)}
              onRemoveMeal={(mealKey) => removeMeal(day._key, mealKey)}
              onPatchMeal={(mealKey, patch) => patchMeal(day._key, mealKey, patch)}
            />
          ))}
          <AddRowButton label="Add day" onClick={addDay} />
          {mode === 'create' ? <ActiveToggle checked={setActive} onChange={setSetActive} /> : null}
        </div>
      )}
    </PlanBuilderStep>
  )
}

function MealDayCard({
  day,
  index,
  canRemove,
  onPatch,
  onRemove,
  onAddMeal,
  onRemoveMeal,
  onPatchMeal,
}: {
  day: DraftDay
  index: number
  canRemove: boolean
  onPatch: (patch: Partial<DraftDay>) => void
  onRemove: () => void
  onAddMeal: () => void
  onRemoveMeal: (mealKey: string) => void
  onPatchMeal: (mealKey: string, patch: Partial<DraftMeal>) => void
}) {
  return (
    <DayCardShell
      index={index}
      header={(
        <DateInput
          ariaLabel={`Day ${index + 1} date`}
          value={day.date}
          onChange={(date) => onPatch({ date })}
          placeholder="Pick a date"
          className="h-12 min-w-0 flex-1 bg-ink-04 text-[16px] font-semibold"
        />
      )}
      onRemove={canRemove ? onRemove : undefined}
    >
      {day.meals.map((meal, mealIndex) => (
        <MealRow
          key={meal._key}
          meal={meal}
          index={mealIndex}
          onPatch={(patch) => onPatchMeal(meal._key, patch)}
          onRemove={() => onRemoveMeal(meal._key)}
        />
      ))}
      <AddRowButton label="Add meal" onClick={onAddMeal} />
    </DayCardShell>
  )
}

function MealRow({
  meal,
  index,
  onPatch,
  onRemove,
}: {
  meal: DraftMeal
  index: number
  onPatch: (patch: Partial<DraftMeal>) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-3 border-b border-ink-06 pb-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <div role="group" aria-label={`Meal ${index + 1} type`} className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <Chip key={type} selected={meal.type === type} onClick={() => { void haptic('selection'); onPatch({ type }) }} className="transition-transform active:scale-[.96]">{type}</Chip>
            ))}
          </div>
          <SearchablePicker<FoodSearchResult>
            label={`Meal ${index + 1}`}
            placeholder="Search foods"
            search={(q) => searchFoods(q)}
            renderItem={(item) => (
              <div>
                <div className="text-ink">{item.name}</div>
                {item.brand ? <div className="text-[13px] text-ink-65">{item.brand}</div> : null}
              </div>
            )}
            getItemKey={(item) => item.id ?? item.name}
            onSelect={(item) => {
              onPatch({
                name: item.name,
                calories: item.macros_per_serving.calories,
                protein: item.macros_per_serving.protein,
                carbs: item.macros_per_serving.carbs,
                fat: item.macros_per_serving.fat,
              })
            }}
            value={meal.name || undefined}
            onClear={() => onPatch({ name: '' })}
          />
        </div>
        <RemoveRowButton label={`Remove meal ${index + 1}`} onClick={onRemove} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <NumberField label="Cal" value={meal.calories} onChange={(v) => onPatch({ calories: v })} min={0} />
        <NumberField label="P" suffix="g" value={meal.protein} onChange={(v) => onPatch({ protein: v })} min={0} />
        <NumberField label="C" suffix="g" value={meal.carbs} onChange={(v) => onPatch({ carbs: v })} min={0} />
        <NumberField label="F" suffix="g" value={meal.fat} onChange={(v) => onPatch({ fat: v })} min={0} />
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
