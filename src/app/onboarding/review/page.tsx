'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { PlanCard } from '@/components/onboarding/plan-card'
import { leaveAurora } from '@/components/onboarding/depth-nav'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { getPlans } from '@/lib/api/plans.api'
import { useCountUp } from '@/lib/use-count-up'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'
import { useOnboardingStore } from '@/stores/onboarding.store'

function Macro({ grams, label, color, i }: { grams: number; label: string; color: string; i: number }) {
  const shown = useCountUp(grams)
  return (
    <div className="rise rounded-[16px] bg-ink-04 px-3 py-2.5" style={{ '--i': i, '--rise-delay': '180ms' } as CSSProperties}>
      <span aria-hidden="true" className="block h-1 w-5 origin-left rounded-full motion-safe:animate-[fiqr-grow_700ms_cubic-bezier(.22,1,.36,1)_400ms_backwards]" style={{ background: color }} />
      <p className="font-wide mt-2 text-hero tabular-nums text-ink">
        {shown}<span className="ml-0.5 text-label text-ink-65" style={{ fontStretch: '100%' }}>g</span>
      </p>
      <p className="text-label font-medium text-ink-65">{label}</p>
    </div>
  )
}

/** Plan reveal: the targets Geo set and the training week on the card the build checklist was on, then into the app. */
export default function ReviewPage() {
  const router = useRouter()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchPlans = useCallback(() => getPlans({ active_only: true, bustCache: true }).then(
    (plans) => {
      setMealPlan((plans.find((p) => p.type === 'meal') as MealPlan | undefined) ?? null)
      setWorkoutPlan((plans.find((p) => p.type === 'workout') as WorkoutPlan | undefined) ?? null)
      setState('ready')
    },
    () => setState('error'),
  ), [])

  useEffect(() => { void fetchPlans() }, [fetchPlans])

  const targets = mealPlan?.content?.daily_targets
  const days = workoutPlan?.content?.days ?? []
  const trainingDays = days.filter((d) => !d.is_rest_day)
  const calories = useCountUp(targets?.calories)
  const hasPlans = Boolean(targets || trainingDays.length)

  function finish(to: '/dashboard' | '/chat') {
    useOnboardingStore.getState().setStatus('complete')
    leaveAurora(() => router.push(to))
  }

  const question = state === 'error' ? "Your plan didn't load" : state === 'ready' && !hasPlans ? 'Geo could not finish your plan' : 'Your plan is ready'
  const why = state === 'error'
    ? 'Your answers are saved. Try again, or start and ask Geo for your plan from Today.'
    : state === 'ready' && !hasPlans
      ? 'Your answers are saved. Start now and ask Geo for a plan from Today; it takes one message.'
      : 'This is where you start. Geo adjusts it at every weekly check-in.'

  return (
    <OnboardingStep
      stepKey="reveal"
     
      scene="reveal"
      question={question}
      why={why}
      cta={hasPlans ? 'Start' : 'Go to Today'}
      canContinue={state !== 'loading'}
      onContinue={() => finish('/dashboard')}
      secondary={hasPlans ? { label: 'Change something with Geo', onClick: () => finish('/chat') } : undefined}
    >
      {state === 'error' ? <ErrorState onRetry={() => { setState('loading'); void fetchPlans() }}>The plan request failed. Check your connection.</ErrorState> : null}

      {state === 'loading' ? <PlanCard carried label="Loading your plan"><span aria-busy="true" className="block h-[272px] rounded-[18px] bg-ink-04" /></PlanCard> : null}

      {state === 'ready' && hasPlans ? (
        <PlanCard carried label="Your plan" className="p-5">
          {targets ? (
            <>
              <p className="font-wide text-[56px] font-[800] leading-none tracking-[-0.035em] tabular-nums text-ink">{calories.toLocaleString('en-AU')}</p>
              <p className="mt-1.5 text-caption font-semibold text-ink-65">calories a day</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Macro i={2} grams={targets.protein} label="protein" color="var(--color-ink)" />
                <Macro i={3} grams={targets.carbs} label="carbs" color="var(--color-macro-teal)" />
                <Macro i={4} grams={targets.fat} label="fat" color="var(--color-macro-ochre)" />
              </div>
            </>
          ) : null}
          {trainingDays.length ? (
            <div className="rise" style={{ '--i': 6, '--rise-delay': '180ms' } as CSSProperties}>
              <p className="mt-5 text-body-sm font-bold text-ink">{trainingDays.length} training days a week</p>
              <ul aria-label="Training days" className="mt-2.5 flex flex-wrap gap-1.5">
                {trainingDays.map((day, i) => (
                  <li key={i} className="rounded-[12px] bg-ink-04 px-3 py-2 text-label text-ink">{day.name || `Day ${i + 1}`}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </PlanCard>
      ) : null}
    </OnboardingStep>
  )
}
