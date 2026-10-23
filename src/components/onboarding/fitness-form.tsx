'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { MultiChip } from '@/components/onboarding/multi-chip'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
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

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-35 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
const pillClassName = 'h-9 rounded-full px-3 text-[13.5px] font-semibold'

export function FitnessForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [equipment, setEquipment] = useState<string[]>([])
  const [injuries, setInjuries] = useState<string[]>([])
  const [injuryInput, setInjuryInput] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  // FB-R6-FE-A: widen to allow empty string so the user can backspace through
  // the value without React's controlled input reasserting `0` (which is what
  // Number('') returns and what blocked George at onboarding).
  const [workoutFrequency, setWorkoutFrequency] = useState<number | ''>(3)
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
        // FB-R6-FE-A: if the user left the field empty, fall back to the initial 3.
        workout_frequency: workoutFrequency === '' ? 3 : workoutFrequency,
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
          <SectionLabel>Equipment</SectionLabel>
          <MultiChip
            options={EQUIPMENT_OPTIONS}
            selected={equipment}
            onChange={setEquipment}
          />
        </div>

        <div className="space-y-2">
          <SectionLabel>Injuries</SectionLabel>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Lower back pain"
              value={injuryInput}
              onChange={(e) => setInjuryInput(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addInjury()
                }
              }}
            />
            <button
              type="button"
              onClick={addInjury}
              className="h-14 shrink-0 rounded-[15px] bg-ink-08 px-4 text-[15.5px] font-semibold text-ink"
            >
              Add
            </button>
          </div>
          {injuries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {injuries.map((injury) => (
                <button
                  key={injury}
                  type="button"
                  onClick={() => removeInjury(injury)}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[13.5px] font-semibold text-cream"
                >
                  {injury}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel>Activity level</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setActivityLevel(level.value)}
                className={cn(
                  pillClassName,
                  activityLevel === level.value
                    ? 'bg-ink text-cream'
                    : 'bg-ink-08 text-ink'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel>Experience level</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setExperienceLevel(level.value)}
                className={cn(
                  pillClassName,
                  experienceLevel === level.value
                    ? 'bg-ink text-cream'
                    : 'bg-ink-08 text-ink'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="workout-frequency">Workout frequency (days per week)</label></SectionLabel>
          <Input
            id="workout-frequency"
            type="number"
            min={0}
            max={7}
            value={workoutFrequency}
            className={inputClassName}
            onChange={(e) => {
              // FB-R6-FE-A: preserve empty string instead of coercing to 0 so
              // the user can clear the value and re-type freely.
              const raw = e.target.value
              setWorkoutFrequency(raw === '' ? '' : Number(raw))
            }}
          />
        </div>

        <div className="space-y-2">
          <SectionLabel>Primary goal</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setPrimaryGoal(goal.value)}
                className={cn(
                  pillClassName,
                  primaryGoal === goal.value
                    ? 'bg-ink text-cream'
                    : 'bg-ink-08 text-ink'
                )}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional body measurements */}
        <div className="space-y-3 rounded-[16px] border border-ink-12 bg-card p-[14px]">
          <div>
            <SectionLabel>Body Measurements</SectionLabel>
            <p className="mt-1 text-[13.5px] text-ink-65">
              Optional — helps Geo make more accurate plans
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <SectionLabel><label htmlFor="waist-cm">Waist (cm)</label></SectionLabel>
              <Input
                id="waist-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 80"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <SectionLabel><label htmlFor="chest-cm">Chest (cm)</label></SectionLabel>
              <Input
                id="chest-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 100"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <SectionLabel><label htmlFor="hip-cm">Hip (cm)</label></SectionLabel>
              <Input
                id="hip-cm"
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 95"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1">
              <SectionLabel><label htmlFor="body-fat-pct">Body fat (%)</label></SectionLabel>
              <Input
                id="body-fat-pct"
                type="number"
                min={0}
                max={60}
                step="0.1"
                placeholder="e.g. 18"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="justify-center"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </PrimaryButton>
      </form>
    </div>
  )
}
