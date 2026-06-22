'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  NumberField,
  SearchablePicker,
  AddRowButton,
  RemoveRowButton,
} from '@/components/plans/plan-builder-shared'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { startWorkoutSession } from '@/lib/api/workout-sessions.api'

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
      router.replace(`/activity/workout/${session.id}`)
    } catch {
      toast.error('Failed to start workout')
      setStarting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.back()} className="p-1" aria-label="Close">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-[17px] font-semibold text-text-primary">Freestyle Workout</h2>
        <div className="w-5" />
      </div>
      <p className="text-xs text-text-secondary text-center mb-6">
        Add exercises, then start — log each set as you go.
      </p>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Workout title (optional)</Label>
          <Input
            type="text"
            placeholder="e.g. Push day"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-text-secondary">Exercises</Label>
          {exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.key}
              exercise={ex}
              index={i}
              canRemove={exercises.length > 1}
              onPatch={(patch) => patchExercise(ex.key, patch)}
              onRemove={() => removeExercise(ex.key)}
            />
          ))}
          <AddRowButton label="Add exercise" onClick={addExercise} />
        </div>
      </div>

      <Button
        onClick={handleStart}
        disabled={starting}
        className="w-full bg-accent hover:bg-accent-hover text-white mt-6"
      >
        <Play className="w-4 h-4 mr-1 fill-white" />
        {starting ? 'Starting…' : 'Start workout'}
      </Button>
      <p className="text-[11px] text-text-tertiary text-center mt-2">
        You can add or remove exercises during the workout too.
      </p>
    </div>
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
    <div className="border border-border rounded-xl p-3 space-y-3 bg-surface">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <SearchablePicker<ExerciseSearchResult>
            label={`Exercise ${index + 1}`}
            placeholder="Search exercises"
            search={searchExercises}
            renderItem={(item) => (
              <div>
                <div className="text-text-primary">{item.name}</div>
                {item.primary_muscles && item.primary_muscles.length > 0 ? (
                  <div className="text-[11px] text-text-tertiary">{item.primary_muscles.join(', ')}</div>
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
