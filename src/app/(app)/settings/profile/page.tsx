'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { MultiChip } from '@/components/onboarding/multi-chip'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { queryKeys } from '@/lib/query-keys'
import type { ActivityLevel, PrimaryGoal, DietaryStyle } from '@/types/profile.types'

const schema = z.object({
  weight_kg: z.number().min(30).max(300).optional(),
  target_weight_kg: z.number().min(30).max(300).optional(),
  height_cm: z.number().min(100).max(250).optional(),
  equipment: z.array(z.string()),
  injuries: z.array(z.string()),
  primary_goal: z.enum(['fat_loss', 'muscle_gain', 'maintenance', 'body_recomposition']).optional(),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']).optional(),
  dietary_style: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher']).optional(),
})

type FormData = z.infer<typeof schema>

const goalOptions = ['fat_loss', 'muscle_gain', 'maintenance', 'body_recomposition']
const activityOptions = ['sedentary', 'lightly_active', 'moderately_active', 'very_active']
const equipmentOptions = ['None', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 'Kettlebells', 'Gym Access']
const injuryOptions = ['None', 'Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Hip', 'Neck']
const dietaryOptions = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher']

export default function ProfilePage() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getProfile,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(), data)
      toast.success('Profile updated')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          weight_kg: profile.weight_kg,
          target_weight_kg: profile.target_weight_kg,
          height_cm: profile.height_cm,
          equipment: profile.equipment ?? [],
          injuries: profile.injuries ?? [],
          primary_goal: profile.primary_goal,
          activity_level: profile.activity_level,
          dietary_style: profile.dietary_style,
        }
      : undefined,
  })

  const equipment = watch('equipment') ?? []
  const injuries = watch('injuries') ?? []

  function onSubmit(data: FormData) {
    save(data)
  }

  if (isLoading || !profile) {
    return (
      <PageWrapper>
        <CardSkeleton />
        <div className="mt-4"><CardSkeleton /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-bg-secondary transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Current weight (kg)</Label>
            <Input id="weight" type="number" placeholder="70" {...register('weight_kg', { valueAsNumber: true })} />
            {errors.weight_kg && <p className="text-xs text-destructive">{errors.weight_kg.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Target weight (kg)</Label>
            <Input id="target" type="number" placeholder="65" {...register('target_weight_kg', { valueAsNumber: true })} />
          </div>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input id="height" type="number" placeholder="170" {...register('height_cm', { valueAsNumber: true })} />
          {errors.height_cm && <p className="text-xs text-destructive">{errors.height_cm.message}</p>}
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <Label>Equipment</Label>
          <MultiChip
            options={equipmentOptions}
            value={equipment}
            onChange={(v) => setValue('equipment', v)}
          />
        </div>

        {/* Injuries */}
        <div className="space-y-2">
          <Label>Injuries / limitations</Label>
          <MultiChip
            options={injuryOptions}
            value={injuries}
            onChange={(v) => setValue('injuries', v)}
          />
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <Label>Primary goal</Label>
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map((opt) => {
              const currentValue = watch('primary_goal')
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue('primary_goal', opt as PrimaryGoal)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    currentValue === opt
                      ? 'bg-brand border-brand text-white'
                      : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                  }`}
                >
                  {opt.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-2">
          <Label>Activity level</Label>
          <div className="grid grid-cols-2 gap-2">
            {activityOptions.map((opt) => {
              const currentValue = watch('activity_level')
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue('activity_level', opt as ActivityLevel)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    currentValue === opt
                      ? 'bg-brand border-brand text-white'
                      : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                  }`}
                >
                  {opt.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dietary Style */}
        <div className="space-y-2">
          <Label>Dietary style</Label>
          <div className="grid grid-cols-2 gap-2">
            {dietaryOptions.map((opt) => {
              const currentValue = watch('dietary_style')
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue('dietary_style', opt as DietaryStyle)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    currentValue === opt
                      ? 'bg-brand border-brand text-white'
                      : 'bg-bg-secondary border-border text-foreground hover:border-brand/50'
                  }`}
                >
                  {opt.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand/90 text-white"
        >
          {isPending ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </PageWrapper>
  )
}
