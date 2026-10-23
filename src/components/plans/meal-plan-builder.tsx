'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import {
  PlanNameField,
  PlanDateRangeField,
  NumberField,
  SearchablePicker,
  AddRowButton,
  RemoveRowButton,
} from '@/components/plans/plan-builder-shared'
import { createPlan, updatePlan, activatePlan } from '@/lib/api/plans.api'
import { searchFoods } from '@/lib/api/foods.api'
import type { FoodSearchResult } from '@/types/foods.types'
import type { MealPlan, MealPlanDay, MealPlanMeal } from '@/types/plans.types'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { cn } from '@/lib/utils'

// FB-08 — Nutrition plan manual builder. Symmetric with the workout builder.
// Users set daily macro targets, then build out day-by-day meals. Meal
// names are searchable via the foods endpoint; macros auto-fill on select
// but stay editable.

export interface MealPlanBuilderProps {
  mode: 'create' | 'edit'
  initialPlan?: MealPlan
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

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
  const [touched, setTouched] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/plans')}
          className="inline-flex h-9 w-9 items-center justify-center text-ink-65"
          aria-label="Back to plans"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[22px] font-semibold text-ink">{mode === 'create' ? 'New nutrition plan' : 'Edit nutrition plan'}</h1>
      </div>

      <section className="space-y-2.5"><SectionLabel>Plan</SectionLabel><div className="space-y-4 rounded-[16px] border border-ink-12 bg-card p-[14px]">
        <PlanNameField value={name} onChange={setName} placeholder="e.g. Cut phase" /><PlanDateRangeField
          startDate={startDate}
          endDate={endDate}
          onChange={(next) => {
            setStartDate(next.startDate)
            setEndDate(next.endDate)
          }}
        />
        <div className="space-y-1.5">
          <label htmlFor="plan-notes" className="block text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Notes</label>
          <textarea
            id="plan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes"
            className="min-h-24 w-full rounded-[15px] border border-ink-16 bg-card p-3 text-[15.5px] text-ink outline-none placeholder:text-ink-35 focus:border-ink"
          />
        </div>
      </div></section>

      <section className="space-y-2.5"><SectionLabel>Daily targets</SectionLabel><div className="space-y-3 rounded-[16px] border border-ink-12 bg-card p-[14px]">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Calories"
            suffix="kcal"
            value={targets.calories}
            onChange={(v) => setTargets((t) => ({ ...t, calories: v }))}
            min={0}
          />
          <NumberField
            label="Protein"
            suffix="g"
            value={targets.protein}
            onChange={(v) => setTargets((t) => ({ ...t, protein: v }))}
            min={0}
          />
          <NumberField
            label="Carbs"
            suffix="g"
            value={targets.carbs}
            onChange={(v) => setTargets((t) => ({ ...t, carbs: v }))}
            min={0}
          />
          <NumberField
            label="Fat"
            suffix="g"
            value={targets.fat}
            onChange={(v) => setTargets((t) => ({ ...t, fat: v }))}
            min={0}
          />
        </div>
      </div></section>

      <section className="space-y-4"><SectionLabel>Days</SectionLabel>
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
        <SecondaryButton type="button" onNavy={false} onClick={addDay}>Add day</SecondaryButton>
      </section>

      {touched && errors.length > 0 ? (
        <ul className="space-y-1 rounded-[12px] bg-ink-08 p-3 text-[13.5px] text-ink" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] text-[15.5px] font-semibold text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
        <input type="checkbox" checked={setActive} onChange={(e) => setSetActive(e.target.checked)} className="sr-only" />
        <span aria-hidden="true" className={cn('flex size-[22px] shrink-0 items-center justify-center rounded-[6px]', setActive ? 'bg-ink' : 'border border-ink-16 bg-card')}>{setActive ? <svg viewBox="0 0 16 16" className="size-4 text-cream" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}</span>
        Set as active plan
      </label>

      <div className="space-y-3"><PrimaryButton type="submit" disabled={submitting || !isValid} className="justify-center">{submitting ? 'Saving…' : 'Save plan'}</PrimaryButton><button type="button" onClick={() => router.push('/plans')} disabled={submitting} className="min-h-11 w-full text-[13.5px] font-semibold text-ink-65">Cancel</button></div>
    </form>
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
    <div className="space-y-3 rounded-[16px] border border-ink-12 bg-card p-[14px]">
      <div className="flex items-center gap-2">
        <input
          type="date"
          aria-label={`Day ${index + 1} date`}
          value={day.date}
          onChange={(e) => onPatch({ date: e.target.value })}
          className="h-14 min-w-0 flex-1 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] text-ink outline-none focus:border-ink"
        />
        {canRemove ? <RemoveRowButton label={`Remove day ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      <div className="divide-y divide-ink-09">
        {day.meals.map((meal, mealIndex) => (
          <MealRow
            key={meal._key}
            meal={meal}
            index={mealIndex}
            onPatch={(patch) => onPatchMeal(meal._key, patch)}
            onRemove={() => onRemoveMeal(meal._key)}
          />
        ))}
        <div className="pt-3"><AddRowButton label="Add meal" onClick={onAddMeal} /></div>
      </div>
    </div>
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
    <div className="space-y-3 py-3 first:pt-0">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5"><div className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Meal type</div><div className="flex flex-wrap gap-2">{MEAL_TYPES.map((type) => <button key={type} type="button" onClick={() => onPatch({ type })} className={`h-9 rounded-full px-3 text-[13.5px] font-semibold ${meal.type === type ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}>{type}</button>)}</div></div>
          <SearchablePicker<FoodSearchResult>
            label={`Meal ${index + 1}`}
            placeholder="Search foods"
            search={(q) => searchFoods(q)}
            renderItem={(item) => (
              <div>
                <div className="text-ink">{item.name}</div>
                {item.brand ? (
                  <div className="text-[11px] text-ink-65">{item.brand}</div>
                ) : null}
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
        <NumberField
          label="Cal"
          value={meal.calories}
          onChange={(v) => onPatch({ calories: v })}
          min={0}
        />
        <NumberField
          label="P"
          suffix="g"
          value={meal.protein}
          onChange={(v) => onPatch({ protein: v })}
          min={0}
        />
        <NumberField
          label="C"
          suffix="g"
          value={meal.carbs}
          onChange={(v) => onPatch({ carbs: v })}
          min={0}
        />
        <NumberField
          label="F"
          suffix="g"
          value={meal.fat}
          onChange={(v) => onPatch({ fat: v })}
          min={0}
        />
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
