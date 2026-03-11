'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StepIndicator } from './step-indicator'
import { GeoCommentary } from './geo-commentary'
import { submitFitnessOnboarding } from '@/lib/api/profile.api'
import { ApiException } from '@/types/api.types'

const schema = z.object({
  equipment: z.array(z.string()).min(1, 'Select at least one option'),
  injuries: z.array(z.string()),
  activity_level: z.enum(
    ['sedentary', 'lightly_active', 'moderately_active', 'very_active'],
    { error: 'Please select your activity level' }
  ),
  workout_frequency: z.number().min(1).max(7),
  primary_goal: z.enum(
    ['fat_loss', 'muscle_gain', 'maintenance', 'body_recomposition'],
    { error: 'Please select your primary goal' }
  ),
})

type FormData = z.infer<typeof schema>

const equipmentOptions = [
  'None',
  'Dumbbells',
  'Barbell',
  'Resistance Bands',
  'Pull-up Bar',
  'Kettlebells',
  'Gym Access',
]
const injuryOptions = ['None', 'Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Hip', 'Neck']
const activityOptions = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', desc: '1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: '6–7 days/week' },
] as const
const goalOptions = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'body_recomposition', label: 'Body Recomp' },
] as const

function MultiChip({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])
            }
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
              selected
                ? 'bg-brand border-brand text-white'
                : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function FitnessForm() {
  const router = useRouter()
  const [frequency, setFrequency] = useState(3)

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      equipment: [],
      injuries: [],
      workout_frequency: 3,
    },
  })

  const equipment = watch('equipment')
  const injuries = watch('injuries')

  async function onSubmit(data: FormData) {
    try {
      await submitFitnessOnboarding({
        equipment: data.equipment,
        injuries: data.injuries,
        activity_level: data.activity_level,
        workout_frequency: data.workout_frequency,
        primary_goal: data.primary_goal,
      })
      router.push('/onboarding/nutrition')
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message || 'Failed to save. Please try again.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="flex flex-col">
      <StepIndicator currentStep={2} />
      <GeoCommentary message="Tell me about your fitness setup." />

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-6 pb-8">
        {/* Equipment */}
        <div className="space-y-2">
          <Label>Equipment available</Label>
          <MultiChip
            options={equipmentOptions}
            value={equipment ?? []}
            onChange={(v) => setValue('equipment', v, { shouldValidate: true })}
          />
          {errors.equipment && (
            <p className="text-xs text-destructive">{errors.equipment.message}</p>
          )}
        </div>

        {/* Injuries */}
        <div className="space-y-2">
          <Label>
            Injuries or limitations{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <MultiChip
            options={injuryOptions}
            value={injuries ?? []}
            onChange={(v) => setValue('injuries', v)}
          />
        </div>

        {/* Activity Level */}
        <div className="space-y-2">
          <Label>Activity level</Label>
          <Controller
            name="activity_level"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      field.value === opt.value
                        ? 'bg-brand/10 border-brand text-foreground'
                        : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.activity_level && (
            <p className="text-xs text-destructive">{errors.activity_level.message}</p>
          )}
        </div>

        {/* Workout Frequency */}
        <div className="space-y-2">
          <Label>
            Workout frequency:{' '}
            <span className="text-brand font-semibold">{frequency} days/week</span>
          </Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const v = Math.max(1, frequency - 1)
                setFrequency(v)
                setValue('workout_frequency', v)
              }}
              className="w-10 h-10 rounded-full bg-bg-secondary border border-border text-foreground text-lg flex items-center justify-center hover:border-brand"
            >
              −
            </button>
            <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${(frequency / 7) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const v = Math.min(7, frequency + 1)
                setFrequency(v)
                setValue('workout_frequency', v)
              }}
              className="w-10 h-10 rounded-full bg-bg-secondary border border-border text-foreground text-lg flex items-center justify-center hover:border-brand"
            >
              +
            </button>
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <Label>Primary goal</Label>
          <Controller
            name="primary_goal"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`p-3 rounded-xl border text-center text-sm font-medium transition-colors ${
                      field.value === opt.value
                        ? 'bg-brand border-brand text-white'
                        : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.primary_goal && (
            <p className="text-xs text-destructive">{errors.primary_goal.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand/90 text-white"
        >
          {isSubmitting ? 'Saving...' : 'Continue →'}
        </Button>
      </form>
    </div>
  )
}
