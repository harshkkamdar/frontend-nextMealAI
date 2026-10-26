'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { FieldLabel, ManualLogShell } from './manual-log-shell'
import { FIELD, LIST } from './log-ui'

interface DraftExercise {
  key: string
  name: string
  muscle: string | null
  sets: number | undefined
  reps: number | undefined
  rest: number | undefined
}

let keySeed = 0
const nextKey = () => `ex-${++keySeed}-${Date.now()}`

const emptyExercise = (): DraftExercise => ({
  key: nextKey(),
  name: '',
  muscle: null,
  sets: 3,
  reps: 10,
  rest: 90,
})

/**
 * Freestyle workout — build a quick exercise list, then START a live guided
 * session (the same one-exercise-at-a-time flow as a plan workout). You can
 * also start with nothing and add exercises as you go in the session.
 */
export function WorkoutLogForm() {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [title, setTitle] = useState('')
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise()])

  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()])
  const removeExercise = (key: string) =>
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.key !== key)))
  const patchExercise = (key: string, patch: Partial<DraftExercise>) =>
    setExercises((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))

  const handleStart = async () => {
    if (starting) return
    const named = exercises.filter((e) => e.name.trim())
    setStarting(true)
    try {
      const session = await startWorkoutSession({
        day_name: title.trim() || 'Freestyle Workout',
        exercises: named.map((e) => ({
          name: e.name.trim(),
          muscle_group: e.muscle || undefined,
          planned_sets: typeof e.sets === 'number' ? e.sets : 3,
          planned_reps: typeof e.reps === 'number' ? e.reps : 10,
          rest_seconds: typeof e.rest === 'number' ? e.rest : 90,
        })),
      })
      // replace() so Back from the session doesn't return to this builder.
      router.replace(`/train/session?id=${session.id}`)
    } catch {
      toast.error('Failed to start workout')
      setStarting(false)
    }
  }

  return (
    <ManualLogShell
      title="Workout"
      prompt="What are you training?"
      sub="I'll time your rests."
      saving={starting}
      onSave={() => void handleStart()}
      actionLabel="Start session"
      savingLabel="Starting…"
    >
      <div className="space-y-6">
        <div>
          <FieldLabel htmlFor="workout-title">Name</FieldLabel>
          <input
            id="workout-title"
            type="text"
            placeholder="Push day"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={`${FIELD} h-14 font-semibold`}
          />
        </div>

        <div>
          <FieldLabel>Exercises · optional, add more as you go</FieldLabel>
          <div className={LIST}>
            {exercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.key}
                exercise={exercise}
                index={index}
                canRemove={exercises.length > 1}
                onPatch={(patch) => patchExercise(exercise.key, patch)}
                onRemove={() => removeExercise(exercise.key)}
              />
            ))}
          </div>
          <button type="button" onClick={addExercise} className="mt-3 flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-ink transition-transform active:scale-[.97]">
            <Plus className="size-5" />Add exercise
          </button>
        </div>
      </div>
    </ManualLogShell>
  )
}

function ExerciseRow({
  exercise,
  index,
  canRemove,
  onPatch,
  onRemove,
}: {
  exercise: DraftExercise
  index: number
  canRemove: boolean
  onPatch: (patch: Partial<DraftExercise>) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-3 border-b border-ink-06 px-4 py-4 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <SearchablePicker<ExerciseSearchResult>
            label={`Exercise ${index + 1}`}
            placeholder="Search exercises"
            search={searchExercises}
            renderItem={(item) => (
              <div>
                <div className="text-ink">{item.name}</div>
                {item.primary_muscles && item.primary_muscles.length > 0 ? (
                  <div className="text-[11px] text-ink-65">{item.primary_muscles.join(', ')}</div>
                ) : null}
              </div>
            )}
            getItemKey={(item) => item.id}
            onSelect={(item) => onPatch({ name: item.name, muscle: item.primary_muscles?.[0] ?? null })}
            value={exercise.name || undefined}
            onClear={() => onPatch({ name: '', muscle: null })}
          />
        </div>
        {canRemove ? (
          <button type="button" onClick={onRemove} aria-label={`Remove exercise ${index + 1}`} className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]">
            <X className="size-5" />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Sets" value={exercise.sets} onChange={(v) => onPatch({ sets: v })} min={1} max={20} placeholder="3" />
        <NumberField label="Reps" value={exercise.reps} onChange={(v) => onPatch({ reps: v })} min={1} max={200} placeholder="10" />
        <NumberField label="Rest" suffix="s" value={exercise.rest} onChange={(v) => onPatch({ rest: v })} min={0} max={600} step={5} placeholder="90" />
      </div>
    </div>
  )
}
