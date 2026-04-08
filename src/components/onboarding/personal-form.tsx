'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { submitPersonalOnboarding } from '@/lib/api/profile.api'
import { cn } from '@/lib/utils'
import type { Sex } from '@/types/profile.types'

const personalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
})

type PersonalValues = z.infer<typeof personalSchema>

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

export function PersonalForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [sex, setSex] = useState<Sex | null>(null)
  const [heightCm, setHeightCm] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      name: '',
      dob: '',
    },
  })

  async function onSubmit(data: PersonalValues) {
    if (!sex) {
      toast.error('Please select your sex')
      return
    }

    if (!heightCm || Number(heightCm) < 100 || Number(heightCm) > 250) {
      toast.error('Please enter a valid height (100–250 cm)')
      return
    }

    setIsLoading(true)
    try {
      await submitPersonalOnboarding({ name: data.name, dob: data.dob, sex, height_cm: Number(heightCm) })
      toast.success('Step 1 complete')
      router.push('/onboarding/fitness')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save personal info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <GeoCommentary
        message="Let's get to know you! This helps me personalize your plans."
        state="happy"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            {...register('dob')}
          />
          {errors.dob && (
            <p className="text-xs text-red-500">{errors.dob.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sex</Label>
          <div className="flex flex-wrap gap-2">
            {SEX_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSex(option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  sex === option.value
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="height-cm">Height (cm)</Label>
          <Input
            id="height-cm"
            type="number"
            inputMode="numeric"
            min={100}
            max={250}
            step="any"
            placeholder="e.g. 175"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
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
