'use client'

import { useForm } from 'react-hook-form'
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
import { submitPersonalOnboarding, updateProfile } from '@/lib/api/profile.api'
import { ApiException } from '@/types/api.types'
import { formatDateForApi } from '@/lib/utils'

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters'),
  dob: z.string().refine((val) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    return age >= 13 && age <= 120
  }, 'Age must be between 13 and 120'),
  sex: z.enum(['male', 'female', 'other'], { error: 'Please select your sex' }),
  height_cm: z
    .number({ error: 'Please enter your height' })
    .min(100, 'Height must be at least 100cm')
    .max(250, 'Height must be under 250cm'),
})

type FormData = z.infer<typeof schema>

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const

export function PersonalForm() {
  const router = useRouter()
  const [selectedSex, setSelectedSex] = useState<'male' | 'female' | 'other' | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      // Step 1: Submit personal onboarding (name, dob, sex)
      await submitPersonalOnboarding({
        name: data.name,
        dob: formatDateForApi(new Date(data.dob)),
        sex: data.sex,
      })
      // Step 2: Update profile with height
      await updateProfile({ height_cm: data.height_cm })
      router.push('/onboarding/fitness')
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
      <StepIndicator currentStep={1} />
      <GeoCommentary message="Let's start with the basics so I can personalize your plan." />

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-5 pb-8">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Alex Johnson"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            {...register('dob')}
            className={errors.dob ? 'border-destructive' : ''}
          />
          {errors.dob && <p className="text-xs text-destructive">{errors.dob.message}</p>}
        </div>

        {/* Sex */}
        <div className="space-y-2">
          <Label>Sex</Label>
          <div className="flex gap-2">
            {sexOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSelectedSex(opt.value)
                  setValue('sex', opt.value, { shouldValidate: true })
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedSex === opt.value
                    ? 'bg-brand border-brand text-white'
                    : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.sex && <p className="text-xs text-destructive">{errors.sex.message}</p>}
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            {...register('height_cm', { valueAsNumber: true })}
            className={errors.height_cm ? 'border-destructive' : ''}
          />
          {errors.height_cm && <p className="text-xs text-destructive">{errors.height_cm.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand/90 text-white mt-4"
        >
          {isSubmitting ? 'Saving...' : 'Continue →'}
        </Button>
      </form>
    </div>
  )
}
