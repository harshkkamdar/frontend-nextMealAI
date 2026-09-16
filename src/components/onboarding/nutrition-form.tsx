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
import { submitNutritionOnboarding } from '@/lib/api/profile.api'
import { cn } from '@/lib/utils'
import type { DietaryStyle } from '@/types/profile.types'

const ALLERGY_OPTIONS = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'None']

const DIETARY_STYLES: { label: string; value: DietaryStyle }[] = [
  { label: 'Omnivore', value: 'omnivore' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Pescatarian', value: 'pescatarian' },
  { label: 'Keto', value: 'keto' },
  { label: 'Paleo', value: 'paleo' },
  { label: 'Halal', value: 'halal' },
  { label: 'Kosher', value: 'kosher' },
]

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-35 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
const pillClassName = 'h-9 rounded-full px-3 text-[13.5px] font-semibold'

export function NutritionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [allergies, setAllergies] = useState<string[]>([])
  const [dietaryStyle, setDietaryStyle] = useState<DietaryStyle | null>(null)

  const [dislikes, setDislikes] = useState<string[]>([])
  const [dislikeInput, setDislikeInput] = useState('')

  const [cuisines, setCuisines] = useState<string[]>([])
  const [cuisineInput, setCuisineInput] = useState('')

  const [mealsPerDay, setMealsPerDay] = useState<number>(3)
  const [weightKg, setWeightKg] = useState<string>('')
  const [targetWeightKg, setTargetWeightKg] = useState<string>('')

  function addDislike() {
    const trimmed = dislikeInput.trim()
    if (trimmed && !dislikes.includes(trimmed)) {
      setDislikes([...dislikes, trimmed])
      setDislikeInput('')
    }
  }

  function removeDislike(item: string) {
    setDislikes(dislikes.filter((d) => d !== item))
  }

  function addCuisine() {
    const trimmed = cuisineInput.trim()
    if (trimmed && !cuisines.includes(trimmed)) {
      setCuisines([...cuisines, trimmed])
      setCuisineInput('')
    }
  }

  function removeCuisine(item: string) {
    setCuisines(cuisines.filter((c) => c !== item))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setIsLoading(true)
    try {
      await submitNutritionOnboarding({
        allergies,
        dietary_style: dietaryStyle ?? undefined,
        dislikes: dislikes.length > 0 ? dislikes : undefined,
        cuisines: cuisines.length > 0 ? cuisines : undefined,
        meals_per_day: mealsPerDay,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        target_weight_kg: targetWeightKg ? Number(targetWeightKg) : undefined,
      })
      toast.success('Step 3 complete')
      router.push('/onboarding/consent')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save nutrition info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <GeoCommentary
        message="Almost done! Let's nail down your nutrition preferences."
        state="suggest"
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <SectionLabel>Allergies</SectionLabel>
          <MultiChip
            options={ALLERGY_OPTIONS}
            selected={allergies}
            onChange={setAllergies}
          />
        </div>

        <div className="space-y-2">
          <SectionLabel>Dietary style</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {DIETARY_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setDietaryStyle(style.value)}
                className={cn(
                  pillClassName,
                  dietaryStyle === style.value
                    ? 'bg-ink text-cream'
                    : 'bg-ink-08 text-ink'
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel>Disliked foods</SectionLabel>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Broccoli"
              value={dislikeInput}
              onChange={(e) => setDislikeInput(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDislike()
                }
              }}
            />
            <button
              type="button"
              onClick={addDislike}
              className="h-14 shrink-0 rounded-[15px] bg-ink-08 px-4 text-[15.5px] font-semibold text-ink"
            >
              Add
            </button>
          </div>
          {dislikes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dislikes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => removeDislike(item)}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[13.5px] font-semibold text-cream"
                >
                  {item}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel>Preferred cuisines</SectionLabel>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Italian"
              value={cuisineInput}
              onChange={(e) => setCuisineInput(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCuisine()
                }
              }}
            />
            <button
              type="button"
              onClick={addCuisine}
              className="h-14 shrink-0 rounded-[15px] bg-ink-08 px-4 text-[15.5px] font-semibold text-ink"
            >
              Add
            </button>
          </div>
          {cuisines.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {cuisines.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => removeCuisine(item)}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[13.5px] font-semibold text-cream"
                >
                  {item}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="meals-per-day">Meals per day</label></SectionLabel>
          <Input
            id="meals-per-day"
            type="number"
            min={1}
            max={6}
            value={mealsPerDay}
            onChange={(e) => setMealsPerDay(Number(e.target.value))}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="weight-kg">Current weight (kg)</label></SectionLabel>
          <Input
            id="weight-kg"
            type="number"
            inputMode="decimal"
            min={20}
            max={300}
            step="0.1"
            placeholder="e.g. 75"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="target-weight-kg">Target weight (kg)</label></SectionLabel>
          <Input
            id="target-weight-kg"
            type="number"
            inputMode="decimal"
            min={20}
            max={300}
            step="0.1"
            placeholder="e.g. 70"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(e.target.value)}
            className={inputClassName}
          />
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
