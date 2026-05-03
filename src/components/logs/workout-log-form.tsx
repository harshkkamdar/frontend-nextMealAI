'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
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
import { createLog } from '@/lib/api/logs.api'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { startWorkoutSession, completeWorkoutSession } from '@/lib/api/workout-sessions.api'

interface DraftExercise {
  key: string
  name: string
  sets: number | undefined
  reps: number | undefined
  weightKg: number | undefined
}

let keySeed = 0
const nextKey = () => `ex-${++keySeed}-${Date.now()}`

const emptyExercise = (): DraftExercise => ({
  key: nextKey(),
  name: '',
  sets: undefined,
  reps: undefined,
  weightKg: undefined,
})

export function WorkoutLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise()])
  const [durationMin, setDurationMin] = useState<number | undefined>(undefined)
  const [difficultyRating, setDifficultyRating] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()])

  const removeExercise = (key: string) =>
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.key !== key)))

  const patchExercise = (key: string, patch: Partial<DraftExercise>) =>
    setExercises((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))

  const handleSave = async () => {
    const validExercises = exercises.filter((e) => e.name.trim())
    if (validExercises.length === 0) {
      toast.error('Add at least one exercise')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'workout',
        payload: {
          title: title.trim() || undefined,
          exercises: validExercises.map((e) => ({
            name: e.name.trim(),
            sets: typeof e.sets === 'number' ? e.sets : undefined,
            reps: typeof e.reps === 'number' ? e.reps : undefined,
            weight_kg: typeof e.weightKg === 'number' ? e.weightKg : undefined,
          })),
          duration_min: typeof durationMin === 'number' ? durationMin : undefined,
          difficulty_rating: difficultyRating || undefined,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
      // Also surface this freestyle workout in Activity history. The
      // history feed reads from workout_sessions, not from logs, so
      // without this round-trip the entry is invisible to the user.
      try {
        const session = await startWorkoutSession({
          day_name: title.trim() || 'Freestyle Workout',
          exercises: validExercises.map((e) => ({
            name: e.name.trim(),
            planned_sets: typeof e.sets === 'number' ? e.sets : undefined,
            planned_reps: typeof e.reps === 'number' ? e.reps : undefined,
          })),
        })
        await completeWorkoutSession(session.id)
      } catch (sessErr) {
        console.warn('Freestyle workout_sessions write failed (log itself succeeded)', sessErr)
      }
      toast.success('Workout logged')
      router.back()
    } catch {
      toast.error('Failed to log workout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-1">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-[17px] font-semibold text-text-primary">Log Workout</h2>
        <div className="w-5" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Optional title */}
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Workout Title (optional)</Label>
          <Input
            type="text"
            placeholder="e.g. Chest day"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Exercise rows */}
        <div className="space-y-3">
          <Label className="text-xs text-text-secondary">Exercises</Label>
          {exercises.map((ex, i) => (
            <ExerciseLogRow
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

        {/* Total Duration */}
        <NumberField
          label="Total Duration"
          suffix="min"
          value={durationMin}
          onChange={(v) => setDurationMin(v)}
          min={0}
          placeholder="0"
        />

        {/* Difficulty rating */}
        <div className="space-y-2">
          <Label className="text-xs text-text-secondary">Difficulty</Label>
          <div className="flex gap-2 justify-between">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDifficultyRating(n)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  n <= difficultyRating
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover text-text-secondary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Notes</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
            placeholder="How did it go?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-accent hover:bg-accent-hover text-white mt-6"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}

function ExerciseLogRow({
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
                  <div className="text-[11px] text-text-tertiary">
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
        {canRemove ? (
          <RemoveRowButton label={`Remove exercise ${index + 1}`} onClick={onRemove} />
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Sets"
          value={exercise.sets}
          onChange={(v) => onPatch({ sets: v })}
          min={1}
          max={20}
          placeholder="0"
        />
        <NumberField
          label="Reps"
          value={exercise.reps}
          onChange={(v) => onPatch({ reps: v })}
          min={1}
          max={200}
          placeholder="0"
        />
        <NumberField
          label="Weight"
          suffix="kg"
          value={exercise.weightKg}
          onChange={(v) => onPatch({ weightKg: v })}
          min={0}
          placeholder="0"
        />
      </div>
    </div>
  )
}
