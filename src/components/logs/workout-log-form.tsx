'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

export function WorkoutLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState<number | ''>('')
  const [reps, setReps] = useState<number | ''>('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [durationMin, setDurationMin] = useState<number | ''>('')
  const [difficultyRating, setDifficultyRating] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (!exercise.trim()) {
      toast.error('Exercise name is required')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'workout',
        payload: {
          exercise: exercise.trim(),
          sets: sets || undefined,
          reps: reps || undefined,
          weight_kg: weightKg || undefined,
          duration_min: durationMin || undefined,
          difficulty_rating: difficultyRating || undefined,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
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
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Exercise Name</Label>
          <Input
            type="text"
            placeholder="e.g. Bench Press"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Sets</Label>
            <Input
              type="number"
              placeholder="0"
              value={sets}
              onChange={(e) => setSets(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Reps</Label>
            <Input
              type="number"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Weight (kg)</Label>
            <Input
              type="number"
              placeholder="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Duration (min)</Label>
            <Input
              type="number"
              placeholder="0"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

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
        className="w-full bg-gradient-to-r from-accent to-accent-hover text-white mt-6"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
