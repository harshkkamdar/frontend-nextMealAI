'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
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

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-35 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

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
          <SectionLabel><label htmlFor="name">Name</label></SectionLabel>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            className={inputClassName}
            {...register('name')}
          />
          {errors.name && (
            <p role="alert" className="text-[13px] font-semibold text-ink">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="dob">Date of birth</label></SectionLabel>
          <Input
            id="dob"
            type="date"
            className={inputClassName}
            {...register('dob')}
          />
          {errors.dob && (
            <p role="alert" className="text-[13px] font-semibold text-ink">{errors.dob.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel>Sex</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {SEX_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSex(option.value)}
                className={cn(
                  'h-9 rounded-full px-3 text-[13.5px] font-semibold',
                  sex === option.value
                    ? 'bg-ink text-cream'
                    : 'bg-ink-08 text-ink'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="height-cm">Height</label></SectionLabel>
          <p className="text-[13.5px] text-ink-65">We&apos;ll use this to compute your daily calorie target.</p>
          <div className="relative">
            <Input
              id="height-cm"
              type="number"
              inputMode="decimal"
              min={100}
              max={250}
              step={0.1}
              placeholder="e.g. 175"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={`${inputClassName} pr-12`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13.5px] text-ink-65">cm</span>
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
