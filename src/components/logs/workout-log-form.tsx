'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  NumberField,
  SearchablePicker,
  AddRowButton,
  RemoveRowButton,
} from '@/components/plans/plan-builder-shared'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'
import { ManualLogShell } from './manual-log-shell'

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
      title="Log workout"
      prompt="Build today's session and I'll time your rests."
      saving={starting}
      onSave={() => void handleStart()}
      actionLabel="Start session"
      savingLabel="Starting…"
    >
      <div className="space-y-6">
        <label className="block">
          <span className="mb-2 block text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Workout title</span>
          <input
            type="text"
            placeholder="e.g. Push day"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-14 w-full rounded-[15px] border border-ink-16 bg-card px-4 text-[15.5px] font-semibold text-ink outline-none placeholder:text-ink-65 focus:border-ink"
          />
        </label>

        <div className="space-y-3">
          <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Exercises</p>
          <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
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
          <AddRowButton label="Add exercise" onClick={addExercise} />
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
    <div className="space-y-3 p-[14px]">
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
        {canRemove ? <RemoveRowButton label={`Remove exercise ${index + 1}`} onClick={onRemove} /> : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Sets" value={exercise.sets} onChange={(v) => onPatch({ sets: v })} min={1} max={20} placeholder="3" />
        <NumberField label="Reps" value={exercise.reps} onChange={(v) => onPatch({ reps: v })} min={1} max={200} placeholder="10" />
        <NumberField label="Rest" suffix="s" value={exercise.rest} onChange={(v) => onPatch({ rest: v })} min={0} max={600} step={5} placeholder="90" />
      </div>
    </div>
  )
}
