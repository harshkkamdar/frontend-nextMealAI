'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ActiveSwitch, AddButton, NameStep, NumberCell, RemoveButton } from '@/components/plans/builder-fields'
import { SearchSheet } from '@/components/plans/search-sheet'
import { CARD } from '@/components/plans/spatial-parts'
import { createPlan, updatePlan, activatePlan } from '@/lib/api/plans.api'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import type { WorkoutPlan, WorkoutPlanDay, WorkoutExercise } from '@/types/plans.types'
import { PlanBuilderStep } from '@/components/plans/plan-builder-step'
import { stepErrors } from '@/components/plans/plan-builder-parts'
import { goBack } from '@/lib/navigation'
import { haptic } from '@/lib/platform/app'

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

function emptyExercise(name = ''): DraftExercise {
  return {
    _key: nextKey(),
    name,
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
  const [saveFailed, setSaveFailed] = useState(false)
  const [step, setStep] = useState(0)
  // The day the exercise search sheet adds to.
  const [sheetDay, setSheetDay] = useState<string | null>(null)

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

  function addExercise(dayKey: string, name: string) {
    setDays((prev) =>
      prev.map((d) =>
        d._key === dayKey ? { ...d, exercises: [...d.exercises, emptyExercise(name)] } : d,
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
    setSaveFailed(false)
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
    } catch {
      // Said in the dock above Try again; the answers stay as they were.
      setSaveFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const current = STEPS[step]
  const blocking = stepErrors(current, errors)
  const last = step === STEPS.length - 1
  const copy = {
    name: { question: mode === 'create' ? 'What should we call this program?' : 'Rename it, or keep going', why: mode === 'create' ? 'A name you\'ll recognise later. Dates and notes are optional.' : 'Saving keeps the old version in History.' },
    days: { question: 'Plan your training days', why: 'Add exercises to each day, or mark it as a rest day.' },
  }[current]
  const sheetIndex = days.findIndex((d) => d._key === sheetDay)

  return (
    <>
    <PlanBuilderStep
      title={mode === 'create' ? 'New training plan' : 'Edit training plan'}
      step={step}
      steps={STEPS.length}
      stepKey={current}
      question={copy.question}
      why={copy.why}
      onBack={() => (step > 0 ? setStep(step - 1) : goBack(router, '/plans'))}
      cta={saveFailed && last ? 'Try again' : last ? (mode === 'create' ? 'Save program' : 'Save changes') : 'Continue'}
      canContinue={last ? isValid : blocking.length === 0}
      busy={submitting}
      notice={saveFailed && last ? "That didn't save. Check your connection and try again." : current === 'days' ? blocking[0] : undefined}
      onContinue={() => (last ? void handleSubmit() : setStep(step + 1))}
    >
      {current === 'name' ? (
        <NameStep
          name={name}
          onName={setName}
          placeholder="e.g. Push Pull Legs"
          startDate={startDate}
          endDate={endDate}
          onDates={(next) => { setStartDate(next.startDate); setEndDate(next.endDate) }}
          notes={notes}
          onNotes={setNotes}
          notesPlaceholder="Anything Geo should know about this program"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {days.map((day, dayIndex) => (
            <DayCard
              key={day._key}
              day={day}
              index={dayIndex}
              canRemove={days.length > 1}
              onPatch={(patch) => patchDay(day._key, patch)}
              onRemove={() => removeDay(day._key)}
              onAddExercise={() => setSheetDay(day._key)}
              onPatchExercise={(exKey, patch) => patchExercise(day._key, exKey, patch)}
              onRemoveExercise={(exKey) => removeExercise(day._key, exKey)}
            />
          ))}
          <AddButton onClick={addDay}>Add day</AddButton>
          {mode === 'create' ? <div className="mt-1"><ActiveSwitch checked={setActive} onChange={setSetActive} /></div> : null}
        </div>
      )}
    </PlanBuilderStep>
    <SearchSheet<ExerciseSearchResult>
      open={sheetDay !== null}
      onClose={() => setSheetDay(null)}
      title={sheetIndex >= 0 ? `Add to day ${sheetIndex + 1}` : 'Add exercise'}
      label="Search exercises"
      placeholder="Search exercises"
      search={searchExercises}
      getKey={(item) => item.id}
      renderItem={(item) => (
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-ink [overflow-wrap:anywhere]">{item.name}</span>
          {item.primary_muscles?.length ? <span className="block truncate text-caption text-ink-65">{item.primary_muscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}</span> : null}
        </span>
      )}
      onPick={(item) => { if (sheetDay) addExercise(sheetDay, item.name) }}
      onPickTyped={(text) => { if (sheetDay) addExercise(sheetDay, text) }}
      footnote="Starts at 3 sets of 10. Change them on the day."
    />
    </>
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
    <section aria-label={`Day ${index + 1}`} className={`${CARD} overflow-hidden`}>
      <div className="flex min-h-[60px] items-center gap-2 px-3 py-2">
        <input
          aria-label={`Day ${index + 1} name`}
          value={day.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="h-11 min-w-0 flex-1 rounded-[14px] bg-ink-04 px-3.5 text-body font-semibold text-ink outline-none focus:shadow-[inset_0_0_0_2px_var(--color-ink)]"
        />
        <button
          type="button"
          aria-pressed={day.is_rest_day}
          onClick={() => { void haptic('selection'); onPatch({ is_rest_day: !day.is_rest_day }) }}
          className={`min-h-11 shrink-0 rounded-full px-4 text-body-sm font-semibold transition-transform active:scale-[.96] ${day.is_rest_day ? 'bg-ink text-cream' : 'bg-ink-04 text-ink'}`}
        >
          Rest day
        </button>
        {canRemove ? <RemoveButton label={`Remove day ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      {day.is_rest_day ? (
        <p className="px-4 pb-3.5 text-caption text-ink-65">A recovery day. No exercises needed.</p>
      ) : (
        <>
          {day.exercises.map((ex, exIndex) => (
            <ExerciseRow key={ex._key} exercise={ex} index={exIndex} onPatch={(patch) => onPatchExercise(ex._key, patch)} onRemove={() => onRemoveExercise(ex._key)} />
          ))}
          <div className="px-3 pb-3 pt-1"><AddButton onClick={onAddExercise}>Add exercise</AddButton></div>
        </>
      )}
    </section>
  )
}

/** W1: the exercise, then Sets, Reps and kg as three labelled cells. */
function ExerciseRow({ exercise, index, onPatch, onRemove }: { exercise: DraftExercise; index: number; onPatch: (patch: Partial<DraftExercise>) => void; onRemove: () => void }) {
  const name = exercise.name || `Exercise ${index + 1}`
  return (
    <div className="border-t border-ink-06 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-body font-bold text-ink [overflow-wrap:anywhere]">{name}</p>
        <RemoveButton label={`Remove ${name}`} onClick={onRemove} />
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <NumberCell label="Sets" ariaLabel={`${name} sets`} min={1} value={exercise.sets} onChange={(v) => onPatch({ sets: v })} />
        <NumberCell label="Reps" ariaLabel={`${name} reps`} min={1} value={exercise.reps} onChange={(v) => onPatch({ reps: v })} />
        <NumberCell label="kg" ariaLabel={`${name} weight, kg`} value={exercise.weight} onChange={(v) => onPatch({ weight: v })} />
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
