'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  PlanNameField,
  PlanDateRangeField,
  NumberField,
  SearchablePicker,
  AddRowButton,
  RemoveRowButton,
} from '@/components/plans/plan-builder-shared'
import { createPlan, updatePlan, activatePlan } from '@/lib/api/plans.api'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import type { WorkoutPlan, WorkoutPlanDay, WorkoutExercise } from '@/types/plans.types'
import { PlanBuilderStep } from '@/components/plans/plan-builder-step'
import { ActiveToggle, BuilderNotes, DayCardShell, stepErrors } from '@/components/plans/plan-builder-parts'
import { goBack } from '@/lib/navigation'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

// FB-08 — Workout plan manual builder. Used by both the create route
// (/plans/new/workout) and the edit route (/plans/edit?id=...). Keeps a
// single local `days` state tree that mirrors the Plan `content.days`
// shape, so save just forwards it to createPlan / updatePlan.

export interface WorkoutPlanBuilderProps {
  mode: 'create' | 'edit'
  initialPlan?: WorkoutPlan
}

interface DraftExercise extends WorkoutExercise {
  _key: string
}

interface DraftDay {
  _key: string
  date: string
  name: string
  is_rest_day: boolean
  exercises: DraftExercise[]
}

const STEPS = ['name', 'days'] as const

let keySeed = 0
const nextKey = () => `k-${++keySeed}-${Date.now()}`

function emptyDay(index: number): DraftDay {
  return {
    _key: nextKey(),
    date: '',
    name: `Day ${index + 1}`,
    is_rest_day: false,
    exercises: [],
  }
}

function emptyExercise(): DraftExercise {
  return {
    _key: nextKey(),
    name: '',
    sets: 3,
    reps: 10,
    weight: undefined,
    duration_seconds: undefined,
    notes: '',
  }
}

function fromInitial(plan: WorkoutPlan | undefined): {
  name: string
  notes: string
  startDate: string
  endDate: string
  days: DraftDay[]
} {
  if (!plan) {
    return { name: '', notes: '', startDate: '', endDate: '', days: [emptyDay(0)] }
  }
  const days: DraftDay[] = (plan.content.days ?? []).map((d, i) => ({
    _key: nextKey(),
    date: d.date ?? '',
    name: d.name ?? `Day ${i + 1}`,
    is_rest_day: !!d.is_rest_day,
    exercises: (d.exercises ?? []).map((ex) => ({ ...ex, _key: nextKey() })),
  }))
  return {
    name: plan.content.name ?? '',
    notes: plan.content.notes ?? '',
    startDate: plan.start_date ?? '',
    endDate: plan.end_date ?? '',
    days: days.length > 0 ? days : [emptyDay(0)],
  }
}

export function WorkoutPlanBuilder({ mode, initialPlan }: WorkoutPlanBuilderProps) {
  const router = useRouter()
  const initial = useMemo(() => fromInitial(initialPlan), [initialPlan])
  const [name, setName] = useState(initial.name)
  const [notes, setNotes] = useState(initial.notes)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [days, setDays] = useState<DraftDay[]>(initial.days)
  const [setActive, setSetActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)

  const errors = useMemo(() => validate({ name, days }), [name, days])
  const isValid = errors.length === 0

  function patchDay(key: string, patch: Partial<DraftDay>) {
    setDays((prev) => prev.map((d) => (d._key === key ? { ...d, ...patch } : d)))
  }

  function addDay() {
    setDays((prev) => [...prev, emptyDay(prev.length)])
  }

  function removeDay(key: string) {
    setDays((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d._key !== key)))
  }

  function addExercise(dayKey: string) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d,
      ),
    )
  }

  function patchExercise(dayKey: string, exKey: string, patch: Partial<DraftExercise>) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey
          ? {
              ...d,
              exercises: d.exercises.map((e) => (e._key === exKey ? { ...e, ...patch } : e)),
            }
          : d,
      ),
    )
  }

  function removeExercise(dayKey: string, exKey: string) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey ? { ...d, exercises: d.exercises.filter((e) => e._key !== exKey) } : d,
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
      const content: WorkoutPlan['content'] = {
        name: name.trim(),
        days: days.map((d) => ({
          date: d.date || undefined,
          name: d.name.trim() || 'Day',
          is_rest_day: d.is_rest_day,
          exercises: d.is_rest_day
            ? []
            : d.exercises.map(({ _key, ...ex }) => ({
                ...ex,
                name: ex.name.trim(),
              })),
        })) as WorkoutPlanDay[],
        notes: notes.trim() || undefined,
      }

      if (mode === 'create') {
        const plan = await createPlan({
          type: 'workout',
          content: content as WorkoutPlan['content'],
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        })
        if (setActive) {
          try {
            await activatePlan(plan.id)
          } catch {
            // non-fatal: plan was created, just not activated
          }
        }
        toast.success('Workout plan created')
        router.push(`/plans/view?id=${plan.id}`)
      } else if (initialPlan) {
        await updatePlan(initialPlan.id, { content: content as WorkoutPlan['content'] })
        toast.success('Workout plan updated')
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
    name: { question: mode === 'create' ? 'What should we call this program?' : 'Rename it, or keep going', why: 'A name you will recognise later. Dates and notes are optional.' },
    days: { question: 'Plan your training days', why: 'Add exercises to each day, or mark it as a rest day.' },
  }[current]

  return (
    <PlanBuilderStep
      title={mode === 'create' ? 'New training program' : 'Edit training program'}
      step={step}
      steps={STEPS.length}
      stepKey={current}
      question={copy.question}
      why={copy.why}
      onBack={() => (step > 0 ? setStep(step - 1) : goBack(router, '/plans'))}
      cta={last ? 'Save plan' : 'Continue'}
      canContinue={last ? isValid : blocking.length === 0}
      busy={submitting}
      notice={current === 'days' ? blocking[0] : undefined}
      onContinue={() => (last ? void handleSubmit() : setStep(step + 1))}
    >
      {current === 'name' ? (
        <div className="space-y-6">
          <PlanNameField value={name} onChange={setName} placeholder="e.g. Push Pull Legs" />
          <PlanDateRangeField startDate={startDate} endDate={endDate} onChange={(next) => { setStartDate(next.startDate); setEndDate(next.endDate) }} />
          <BuilderNotes value={notes} onChange={setNotes} placeholder="Anything Geo should know about this program" />
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day, dayIndex) => (
            <DayCard
              key={day._key}
              day={day}
              index={dayIndex}
              canRemove={days.length > 1}
              onPatch={(patch) => patchDay(day._key, patch)}
              onRemove={() => removeDay(day._key)}
              onAddExercise={() => addExercise(day._key)}
              onPatchExercise={(exKey, patch) => patchExercise(day._key, exKey, patch)}
              onRemoveExercise={(exKey) => removeExercise(day._key, exKey)}
            />
          ))}
          <AddRowButton label="Add day" onClick={addDay} />
          {mode === 'create' ? <ActiveToggle checked={setActive} onChange={setSetActive} /> : null}
        </div>
      )}
    </PlanBuilderStep>
  )
}

function DayCard({
  day,
  index,
  canRemove,
  onPatch,
  onRemove,
  onAddExercise,
  onPatchExercise,
  onRemoveExercise,
}: {
  day: DraftDay
  index: number
  canRemove: boolean
  onPatch: (patch: Partial<DraftDay>) => void
  onRemove: () => void
  onAddExercise: () => void
  onPatchExercise: (exKey: string, patch: Partial<DraftExercise>) => void
  onRemoveExercise: (exKey: string) => void
}) {
  return (
    <DayCardShell
      index={index}
      header={(
        <input
          aria-label={`Day ${index + 1} name`}
          value={day.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="h-12 min-w-0 flex-1 rounded-[14px] bg-ink-04 px-3 text-[16px] font-semibold text-ink outline outline-0 -outline-offset-1 outline-ink focus:outline-2"
        />
      )}
      onRemove={canRemove ? onRemove : undefined}
    >
      <button
        type="button"
        aria-pressed={day.is_rest_day}
        onClick={() => { void haptic('selection'); onPatch({ is_rest_day: !day.is_rest_day }) }}
        className={cn('min-h-11 rounded-full px-4 text-[14px] font-semibold transition-transform active:scale-[.96]', day.is_rest_day ? 'bg-ink text-cream' : 'bg-ink-06 text-ink')}
      >
        Rest day
      </button>
      {!day.is_rest_day ? (
        <>
          {day.exercises.map((ex, exIndex) => (
            <ExerciseRow
              key={ex._key}
              exercise={ex}
              index={exIndex}
              onPatch={(patch) => onPatchExercise(ex._key, patch)}
              onRemove={() => onRemoveExercise(ex._key)}
            />
          ))}
          <AddRowButton label="Add exercise" onClick={onAddExercise} />
        </>
      ) : null}
    </DayCardShell>
  )
}

function ExerciseRow({
  exercise,
  index,
  onPatch,
  onRemove,
}: {
  exercise: DraftExercise
  index: number
  onPatch: (patch: Partial<DraftExercise>) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-3 border-b border-ink-06 pb-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <SearchablePicker<ExerciseSearchResult>
            label={`Exercise ${index + 1}`}
            placeholder="Search exercises"
            search={searchExercises}
            renderItem={(item) => (
              <div>
                <div className="text-ink">{item.name}</div>
                {item.primary_muscles && item.primary_muscles.length > 0 ? (
                  <div className="text-[13px] text-ink-65">
                    {item.primary_muscles.join(', ')}
                  </div>
                ) : null}
              </div>
            )}
            getItemKey={(item) => item.id}
            onSelect={(item) => onPatch({ name: item.name })}
            value={exercise.name || undefined}
            onClear={() => onPatch({ name: '' })}
          />
        </div>
        <RemoveRowButton label={`Remove exercise ${index + 1}`} onClick={onRemove} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Sets"
          value={exercise.sets}
          onChange={(v) => onPatch({ sets: v })}
          min={1}
          max={20}
        />
        <NumberField
          label="Reps"
          value={exercise.reps}
          onChange={(v) => onPatch({ reps: v })}
          min={1}
          max={200}
        />
        <NumberField
          label="Weight"
          suffix="kg"
          value={exercise.weight}
          onChange={(v) => onPatch({ weight: v })}
          min={0}
        />
      </div>
    </div>
  )
}

// Extracted for testability.
export function validate({ name, days }: { name: string; days: DraftDay[] }): string[] {
  const errors: string[] = []
  if (!name.trim()) errors.push('Plan name is required')
  if (days.length === 0) errors.push('At least one day is required')
  for (const [i, day] of days.entries()) {
    if (day.is_rest_day) continue
    if (day.exercises.length === 0) {
      errors.push(`Day ${i + 1} needs at least one exercise`)
      continue
    }
    for (const [j, ex] of day.exercises.entries()) {
      if (!ex.name.trim()) errors.push(`Day ${i + 1} exercise ${j + 1} needs a name`)
      if (!ex.sets || ex.sets < 1) errors.push(`Day ${i + 1} exercise ${j + 1} needs sets ≥ 1`)
    }
  }
  return errors
}
