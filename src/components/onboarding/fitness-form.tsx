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
import type { ActivityLevel, ExperienceLevel, PrimaryGoal } from '@/types/profile.types'

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
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Active', value: 'active' },
  { label: 'Very Active', value: 'very_active' },
]

const EXPERIENCE_LEVELS: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
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
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(3)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null)
  const [waistCm, setWaistCm] = useState<string>('')
  const [chestCm, setChestCm] = useState<string>('')
  const [hipCm, setHipCm] = useState<string>('')
  const [bodyFatPct, setBodyFatPct] = useState<string>('')

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
        ...(experienceLevel ? { experience_level: experienceLevel } : {}),
        activity_level: activityLevel,
        workout_frequency: workoutFrequency,
        primary_goal: primaryGoal,
        ...(waistCm ? { waist_cm: Number(waistCm) } : {}),
        ...(chestCm ? { chest_cm: Number(chestCm) } : {}),
        ...(hipCm ? { hip_cm: Number(hipCm) } : {}),
        ...(bodyFatPct ? { body_fat_pct: Number(bodyFatPct) } : {}),
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
          <Label>Experience level</Label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setExperienceLevel(level.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  experienceLevel === level.value
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

        {/* Optional body measurements */}
        <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
          <div>
            <Label className="text-base font-semibold">Body Measurements</Label>
            <p className="text-sm text-text-secondary mt-0.5">
              Optional — helps Geo make more accurate plans
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="waist-cm">Waist (cm)</Label>
              <Input
                id="waist-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 80"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chest-cm">Chest (cm)</Label>
              <Input
                id="chest-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 100"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hip-cm">Hip (cm)</Label>
              <Input
                id="hip-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 95"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body-fat-pct">Body fat (%)</Label>
              <Input
                id="body-fat-pct"
                type="number"
                min={0}
                max={60}
                step="0.1"
                placeholder="e.g. 18"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
              />
            </div>
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
