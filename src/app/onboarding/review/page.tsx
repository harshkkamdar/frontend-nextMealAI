'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dumbbell } from 'lucide-react'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { MetricTile } from '@/components/ui/fiqr/metric-tile'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { getPlans } from '@/lib/api/plans.api'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'
import { useOnboardingStore } from '@/stores/onboarding.store'

export default function ReviewPage() {
  const router = useRouter()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const plans = await getPlans({ active_only: true, bustCache: true })
      const meal = plans.find((p) => p.type === 'meal') as MealPlan | undefined
      const workout = plans.find((p) => p.type === 'workout') as WorkoutPlan | undefined
      setMealPlan(meal ?? null)
      setWorkoutPlan(workout ?? null)
    } catch {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const hasPlans = mealPlan || workoutPlan

  function handleAccept() {
    useOnboardingStore.getState().setStatus('complete')
    router.push('/dashboard')
  }

  function handleModify() {
    useOnboardingStore.getState().setStatus('complete')
    router.push('/chat')
  }

  // --- Nutrition summary ---
  const targets = mealPlan?.content?.daily_targets
  const mealDays = mealPlan?.content?.days

  // --- Workout summary ---
  const workoutDays = workoutPlan?.content?.days

  return (
    <div>
      <GeoCommentary
        message={
          hasPlans
            ? "Here's your personalised plan! Take a look and let me know if you'd like any changes."
            : "I'm still putting your plan together. You can head to the dashboard and ask me to create one."
        }
        state={hasPlans ? 'happy' : 'thinking'}
      />

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : hasPlans ? (
        <div className="space-y-4">
          {mealPlan && (
            <div className="rounded-[16px] border border-ink-12 bg-card p-[14px]">
              <SectionLabel>Nutrition Plan</SectionLabel>

              {targets ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricTile label="Calories" value={targets.calories.toLocaleString()} />
                  <MetricTile label="Protein" value={targets.protein} unit="g" />
                  <MetricTile label="Carbs" value={targets.carbs} unit="g" />
                  <MetricTile label="Fat" value={targets.fat} unit="g" />
                </div>
              ) : (
                <p className="mt-3 text-[15.5px] text-ink-60">
                  No calorie or macro targets set yet.
                </p>
              )}

              {mealDays && mealDays.length > 0 && mealDays[0].meals && (
                <p className="mt-3 text-[13.5px] text-ink-60">
                  {mealDays[0].meals.length} meals per day across {mealDays.length} day
                  {mealDays.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {workoutPlan && (
            <div className="rounded-[16px] border border-ink-12 bg-card p-[14px]">
              <SectionLabel>Workout Plan</SectionLabel>

              {workoutDays && workoutDays.length > 0 ? (
                <>
                  <p className="mb-3 mt-3 text-[15.5px] font-semibold text-ink">
                    {workoutDays.filter((d) => !d.is_rest_day).length}-day programme
                    <span className="font-normal text-ink-60">
                      {' '}
                      / {workoutDays.length} day cycle
                    </span>
                  </p>

                  <div className="space-y-2">
                    {workoutDays.map((day, i) => (
                      <div
                        key={i}
                        className="rounded-[15px] border border-ink-12 bg-card px-3 py-3 text-[15.5px] text-ink"
                      >
                        <span className="font-semibold">{day.is_rest_day ? 'Rest Day' : day.name || `Day ${i + 1}`}</span>
                        <span className="text-ink-60"> · {day.exercises?.length ?? 0} exercises</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[15.5px] text-ink-60">
                  No workout schedule generated yet.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <PrimaryButton
              onClick={handleAccept}
              className="justify-center"
            >
              Looks good, let&apos;s go
            </PrimaryButton>

            <button
              onClick={handleModify}
              className="w-full py-2 text-[15.5px] font-semibold text-ink-60"
            >
              I&apos;d like to make changes
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[16px] border border-ink-12 bg-card p-6 text-center">
          <Dumbbell className="mx-auto mb-3 size-10 text-ink-35" />
          <p className="mb-1 text-[15.5px] font-semibold text-ink">
            No plans created yet
          </p>
          <p className="mb-4 text-[13.5px] text-ink-60">
            Geo is still working on your plan, or it may not have generated.
            You can head to the dashboard and ask Geo to create one.
          </p>
          <PrimaryButton
            onClick={handleAccept}
            className="justify-center"
          >
            Continue to dashboard
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
