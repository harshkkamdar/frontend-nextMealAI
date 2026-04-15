'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Plus, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

// FB-08 — Meal plan manual builder. Symmetric with the workout builder.
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
    name: '',
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
        toast.success('Meal plan created')
        router.push(`/plans/${plan.id}`)
      } else if (initialPlan) {
        await updatePlan(initialPlan.id, { content })
        toast.success('Meal plan updated')
        router.push(`/plans/${initialPlan.id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/plans')}
          className="text-text-secondary hover:text-text-primary"
          aria-label="Back to plans"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-accent" />
          {mode === 'create' ? 'New Meal Plan' : 'Edit Meal Plan'}
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
        <PlanNameField value={name} onChange={setName} placeholder="e.g. Cut phase" />
        <PlanDateRangeField
          startDate={startDate}
          endDate={endDate}
          onChange={(next) => {
            setStartDate(next.startDate)
            setEndDate(next.endDate)
          }}
        />
        <div className="space-y-1.5">
          <Label htmlFor="plan-notes">Notes</Label>
          <textarea
            id="plan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-primary">Daily targets</h2>
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
      </div>

      <div className="space-y-4">
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
        <button
          type="button"
          onClick={addDay}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add day
        </button>
      </div>

      {touched && errors.length > 0 ? (
        <ul className="text-xs text-red-500 space-y-1" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={setActive} onChange={(e) => setSetActive(e.target.checked)} />
        Set as active plan
      </label>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/plans')}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !isValid}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create plan' : 'Save changes'}
        </Button>
      </div>
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
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label={`Day ${index + 1} date`}
          value={day.date}
          onChange={(e) => onPatch({ date: e.target.value })}
          className="flex-1"
        />
        {canRemove ? <RemoveRowButton label={`Remove day ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      <div className="space-y-3">
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
    <div className="border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`meal-type-${meal._key}`}>Meal type</Label>
            <select
              id={`meal-type-${meal._key}`}
              value={meal.type}
              onChange={(e) => onPatch({ type: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <SearchablePicker<FoodSearchResult>
            label={`Meal ${index + 1}`}
            placeholder="Search foods"
            search={(q) => searchFoods(q)}
            renderItem={(item) => (
              <div>
                <div className="text-text-primary">{item.name}</div>
                {item.brand ? (
                  <div className="text-[11px] text-text-tertiary">{item.brand}</div>
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
