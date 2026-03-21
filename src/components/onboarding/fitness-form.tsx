'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { MultiChip } from '@/components/onboarding/multi-chip'
import { submitFitnessOnboarding } from '@/lib/api/profile.api'
import { cn } from '@/lib/utils'
import type { ActivityLevel, PrimaryGoal } from '@/types/profile.types'

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Resistance bands',
  'Pull-up bar',
  'Kettlebell',
  'Bench',
  'Cable machine',
  'None',
]

const ACTIVITY_LEVELS: { label: string; value: ActivityLevel }[] = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Lightly Active', value: 'lightly_active' },
  { label: 'Moderately Active', value: 'moderately_active' },
  { label: 'Very Active', value: 'very_active' },
]

const GOALS: { label: string; value: PrimaryGoal }[] = [
  { label: 'Fat Loss', value: 'fat_loss' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Body Recomposition', value: 'body_recomposition' },
]

export function FitnessForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [equipment, setEquipment] = useState<string[]>([])
  const [injuries, setInjuries] = useState<string[]>([])
  const [injuryInput, setInjuryInput] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(3)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null)

  function addInjury() {
    const trimmed = injuryInput.trim()
    if (trimmed && !injuries.includes(trimmed)) {
      setInjuries([...injuries, trimmed])
      setInjuryInput('')
    }
  }

  function removeInjury(injury: string) {
    setInjuries(injuries.filter((i) => i !== injury))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!activityLevel) {
      toast.error('Please select your activity level')
      return
    }
    if (!primaryGoal) {
      toast.error('Please select your primary goal')
      return
    }

    setIsLoading(true)
    try {
      await submitFitnessOnboarding({
        equipment,
        injuries,
        activity_level: activityLevel,
        workout_frequency: workoutFrequency,
        primary_goal: primaryGoal,
      })
      toast.success('Step 2 complete')
      router.push('/onboarding/nutrition')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save fitness info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <GeoCommentary
        message="Now let's talk about your fitness setup!"
        state="coach"
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Equipment</Label>
          <MultiChip
            options={EQUIPMENT_OPTIONS}
            selected={equipment}
            onChange={setEquipment}
          />
        </div>

        <div className="space-y-2">
          <Label>Injuries</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Lower back pain"
              value={injuryInput}
              onChange={(e) => setInjuryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addInjury()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addInjury}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
          {injuries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {injuries.map((injury) => (
                <button
                  key={injury}
                  type="button"
                  onClick={() => removeInjury(injury)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-accent border border-accent text-white transition-colors"
                >
                  {injury}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Activity level</Label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setActivityLevel(level.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  activityLevel === level.value
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workout-frequency">Workout frequency (days per week)</Label>
          <Input
            id="workout-frequency"
            type="number"
            min={0}
            max={7}
            value={workoutFrequency}
            onChange={(e) => setWorkoutFrequency(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>Primary goal</Label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setPrimaryGoal(goal.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  primaryGoal === goal.value
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
                )}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-accent to-accent-hover text-white hover:opacity-90"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
