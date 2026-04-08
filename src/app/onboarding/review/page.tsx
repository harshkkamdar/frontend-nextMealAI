'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flame, Dumbbell, Moon, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeoCommentary } from '@/components/onboarding/geo-commentary'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { getPlans } from '@/lib/api/plans.api'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

function setOnboardedCookie() {
  document.cookie = 'nextmealai-onboarded=true; path=/; max-age=31536000'
}

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
    setOnboardedCookie()
    router.push('/dashboard')
  }

  function handleModify() {
    setOnboardedCookie()
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
          {/* ── Nutrition Plan Card ── */}
          {mealPlan && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Nutrition Plan
                </h2>
              </div>

              {targets ? (
                <>
                  {/* Calorie target */}
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {targets.calories.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-text-secondary">kcal / day</span>
                  </p>

                  {/* Macro breakdown */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <MacroStat label="Protein" grams={targets.protein} color="bg-blue-500" />
                    <MacroStat label="Carbs" grams={targets.carbs} color="bg-amber-500" />
                    <MacroStat label="Fat" grams={targets.fat} color="bg-rose-500" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-secondary">
                  No calorie or macro targets set yet.
                </p>
              )}

              {/* Meals per day hint */}
              {mealDays && mealDays.length > 0 && mealDays[0].meals && (
                <p className="text-xs text-text-tertiary mt-3">
                  {mealDays[0].meals.length} meals per day across {mealDays.length} day
                  {mealDays.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* ── Workout Plan Card ── */}
          {workoutPlan && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Workout Plan
                </h2>
              </div>

              {workoutDays && workoutDays.length > 0 ? (
                <>
                  {/* Program overview */}
                  <p className="text-sm font-semibold text-text-primary mb-3">
                    {workoutDays.filter((d) => !d.is_rest_day).length}-day programme
                    <span className="font-normal text-text-secondary">
                      {' '}
                      / {workoutDays.length} day cycle
                    </span>
                  </p>

                  {/* Day list */}
                  <div className="space-y-2">
                    {workoutDays.map((day, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-xl px-3 py-2.5"
                      >
                        {day.is_rest_day ? (
                          <div className="flex items-center gap-2">
                            <Moon className="w-3.5 h-3.5 text-text-tertiary" />
                            <span className="text-sm text-text-secondary">
                              Rest Day
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-text-primary mb-1">
                              {day.name || `Day ${i + 1}`}
                            </p>

                            {day.exercises && day.exercises.length > 0 && (
                              <div className="space-y-0.5">
                                {day.exercises.map((ex, j) => (
                                  <p key={j} className="text-xs text-text-secondary">
                                    {ex.name}
                                    {ex.sets && ex.reps
                                      ? ` — ${ex.sets}\u00D7${ex.reps}`
                                      : ''}
                                    {ex.duration_seconds
                                      ? ` — ${ex.duration_seconds}s`
                                      : ''}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Muscle group chips */}
                            {day.exercises && day.exercises.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {[
                                  ...new Set(
                                    day.exercises
                                      .map((e: any) => e.muscle_group)
                                      .filter(Boolean)
                                  ),
                                ]
                                  .slice(0, 4)
                                  .map((mg: string) => (
                                    <span
                                      key={mg}
                                      className="text-[10px] bg-accent-light text-accent px-2 py-0.5 rounded-full"
                                    >
                                      {mg}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-secondary">
                  No workout schedule generated yet.
                </p>
              )}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleAccept}
              className="w-full bg-accent hover:bg-accent-hover text-white hover:opacity-90"
              size="lg"
            >
              Looks good, let&apos;s go!
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            <button
              onClick={handleModify}
              className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors py-2"
            >
              <MessageCircle className="w-4 h-4" />
              I&apos;d like to make changes
            </button>
          </div>
        </div>
      ) : (
        /* ── Fallback: no plans generated ── */
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <Dumbbell className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">
            No plans created yet
          </p>
          <p className="text-xs text-text-secondary mb-4">
            Geo is still working on your plan, or it may not have generated.
            You can head to the dashboard and ask Geo to create one.
          </p>
          <Button
            onClick={handleAccept}
            className="w-full bg-accent hover:bg-accent-hover text-white hover:opacity-90"
          >
            Continue to dashboard
          </Button>
        </div>
      )}
    </div>
  )
}

/* ── Small helper component for macro stats ── */
function MacroStat({
  label,
  grams,
  color,
}: {
  label: string
  grams: number
  color: string
}) {
  return (
    <div className="text-center">
      <div className={`h-1 rounded-full ${color} mb-2`} />
      <p className="text-lg font-bold text-text-primary">{grams}g</p>
      <p className="text-[11px] text-text-tertiary">{label}</p>
    </div>
  )
}
