'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepIndicator } from './step-indicator'
import { GeoCommentary } from './geo-commentary'
import { MultiChip } from './multi-chip'
import { submitNutritionOnboarding } from '@/lib/api/profile.api'
import { ApiException } from '@/types/api.types'

const schema = z.object({
  allergies: z
    .array(z.string())
    .min(1, 'Please select at least one option (use "None" if no allergies)'),
  dietary_style: z
    .enum([
      'omnivore',
      'vegetarian',
      'vegan',
      'pescatarian',
      'keto',
      'paleo',
      'halal',
      'kosher',
    ])
    .optional(),
  dislikes: z.array(z.string()),
  cuisines: z.array(z.string()),
  meals_per_day: z.number().min(1).max(6),
  weight_kg: z
    .number({ error: 'Please enter your weight' })
    .min(30)
    .max(300)
    .optional(),
  target_weight_kg: z.number().min(30).max(300).optional(),
})

type FormData = z.infer<typeof schema>

const allergyOptions = [
  'Peanuts',
  'Tree Nuts',
  'Dairy',
  'Eggs',
  'Soy',
  'Gluten',
  'Shellfish',
  'None',
]
const dietaryOptions = [
  'omnivore',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'halal',
  'kosher',
] as const
const cuisineOptions = ['Indian', 'Italian', 'Mexican', 'Mediterranean', 'Asian', 'American']

export function NutritionForm() {
  const router = useRouter()
  const [mealsPerDay, setMealsPerDay] = useState(3)
  const [dislikeInput, setDislikeInput] = useState('')
  const [dislikes, setDislikes] = useState<string[]>([])

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      allergies: [],
      dislikes: [],
      cuisines: [],
      meals_per_day: 3,
    },
  })

  const allergies = watch('allergies')
  const cuisines = watch('cuisines')

  function addDislike(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && dislikeInput.trim()) {
      e.preventDefault()
      const newDislikes = [...dislikes, dislikeInput.trim()]
      setDislikes(newDislikes)
      setValue('dislikes', newDislikes)
      setDislikeInput('')
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await submitNutritionOnboarding({
        allergies: data.allergies,
        dietary_style: data.dietary_style,
        dislikes: data.dislikes,
        cuisines: data.cuisines,
        meals_per_day: data.meals_per_day,
        weight_kg: data.weight_kg,
        target_weight_kg: data.target_weight_kg,
      })
      router.push('/onboarding/generating')
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
      <StepIndicator currentStep={3} />
      <GeoCommentary message="Now let's talk nutrition. These preferences shape every meal I suggest." />

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-6 pb-8">
        {/* Allergies */}
        <div className="space-y-2">
          <Label>
            Allergies <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            These are hard restrictions — I will never suggest foods containing these.
          </p>
          <MultiChip
            options={allergyOptions}
            value={allergies ?? []}
            onChange={(v) => setValue('allergies', v, { shouldValidate: true })}
          />
          {errors.allergies && (
            <p className="text-xs text-destructive">{errors.allergies.message}</p>
          )}
        </div>

        {/* Dietary Style */}
        <div className="space-y-2">
          <Label>
            Dietary style{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Controller
            name="dietary_style"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => field.onChange(field.value === opt ? undefined : opt)}
                    className={`p-2.5 rounded-xl border text-sm font-medium transition-colors capitalize ${
                      field.value === opt
                        ? 'bg-brand border-brand text-white'
                        : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                    }`}
                  >
                    {opt.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Dislikes */}
        <div className="space-y-2">
          <Label>
            Disliked foods{' '}
            <span className="text-muted-foreground text-xs">
              (optional, press Enter to add)
            </span>
          </Label>
          <Input
            value={dislikeInput}
            onChange={(e) => setDislikeInput(e.target.value)}
            onKeyDown={addDislike}
            placeholder="e.g. cilantro, mushrooms"
          />
          {dislikes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dislikes.map((d) => (
                <span
                  key={d}
                  className="px-2 py-1 rounded-full bg-bg-secondary border border-border text-xs flex items-center gap-1"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = dislikes.filter((x) => x !== d)
                      setDislikes(updated)
                      setValue('dislikes', updated)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cuisines */}
        <div className="space-y-2">
          <Label>
            Cuisine preferences{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <MultiChip
            options={cuisineOptions}
            value={cuisines ?? []}
            onChange={(v) => setValue('cuisines', v)}
          />
        </div>

        {/* Meals per day */}
        <div className="space-y-2">
          <Label>
            Meals per day:{' '}
            <span className="text-brand font-semibold">{mealsPerDay}</span>
          </Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const v = Math.max(1, mealsPerDay - 1)
                setMealsPerDay(v)
                setValue('meals_per_day', v)
              }}
              className="w-10 h-10 rounded-full bg-bg-secondary border border-border text-foreground text-lg flex items-center justify-center hover:border-brand"
            >
              −
            </button>
            <div className="flex gap-1.5 flex-1 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < mealsPerDay
                      ? 'bg-brand'
                      : 'bg-bg-secondary border border-border'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const v = Math.min(6, mealsPerDay + 1)
                setMealsPerDay(v)
                setValue('meals_per_day', v)
              }}
              className="w-10 h-10 rounded-full bg-bg-secondary border border-border text-foreground text-lg flex items-center justify-center hover:border-brand"
            >
              +
            </button>
          </div>
        </div>

        {/* Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Current weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              {...register('weight_kg', { valueAsNumber: true })}
              className={errors.weight_kg ? 'border-destructive' : ''}
            />
            {errors.weight_kg && (
              <p className="text-xs text-destructive">{errors.weight_kg.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_weight">
              Target weight (kg){' '}
              <span className="text-muted-foreground text-xs">opt.</span>
            </Label>
            <Input
              id="target_weight"
              type="number"
              placeholder="65"
              {...register('target_weight_kg', { valueAsNumber: true })}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand/90 text-white"
        >
          {isSubmitting ? 'Saving...' : 'Generate my plan →'}
        </Button>
      </form>
    </div>
  )
}
