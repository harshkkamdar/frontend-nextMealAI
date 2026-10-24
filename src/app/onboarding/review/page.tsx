'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { getPlans } from '@/lib/api/plans.api'
import { useCountUp } from '@/lib/use-count-up'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { plural } from '@/lib/utils'

function Macro({ grams, label, color, i }: { grams: number; label: string; color: string; i: number }) {
  const shown = useCountUp(grams)
  return (
    <div className="rise rounded-[var(--radius-row)] bg-cream px-3 py-3" style={{ '--i': i, '--rise-delay': '180ms' } as CSSProperties}>
      <span aria-hidden="true" className="block h-1.5 w-6 origin-left rounded-full motion-safe:animate-[fiqr-grow_700ms_cubic-bezier(.22,1,.36,1)_400ms_backwards]" style={{ background: color }} />
      <p className="font-wide mt-2.5 text-[24px] font-bold leading-none tabular-nums text-ink">
        {shown}<span className="ml-0.5 text-[14px] font-semibold text-ink-65" style={{ fontStretch: '100%' }}>g</span>
      </p>
      <p className="mt-1 text-[13.5px] font-medium text-ink-65">{label}</p>
    </div>
  )
}

/** Plan reveal: the targets Geo set, the training week, then into the app. */
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
    router.push(to)
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
      progress={1}
      question={question}
      why={why}
      cta={hasPlans ? 'Start' : 'Go to Today'}
      canContinue={state !== 'loading'}
      onContinue={() => finish('/dashboard')}
      secondary={hasPlans ? { label: 'Change something with Geo', onClick: () => finish('/chat') } : undefined}
    >
      {state === 'error' ? <ErrorState onRetry={() => { setState('loading'); void fetchPlans() }}>The plan request failed. Check your connection.</ErrorState> : null}

      {state === 'loading' ? (
        <div aria-busy="true" aria-label="Loading your plan" className="flex flex-col gap-3">
          <div className="h-[208px] rounded-[var(--radius-card)] bg-ink-06" />
          <div className="h-[140px] rounded-[var(--radius-card)] bg-ink-06" />
        </div>
      ) : null}

      {state === 'ready' && targets ? (
        <section aria-label="Daily targets" style={{ '--i': 2 } as CSSProperties} className="rise rounded-[var(--radius-card)] bg-card p-5 outline outline-1 -outline-offset-1 outline-ink-08">
          <p className="font-wide text-[56px] font-[750] leading-none tracking-[-1.5px] tabular-nums text-ink">{calories.toLocaleString('en-AU')}</p>
          <p className="mt-1.5 text-[15px] font-medium text-ink-65">calories a day</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Macro i={2} grams={targets.protein} label="protein" color="var(--color-ink)" />
            <Macro i={3} grams={targets.carbs} label="carbs" color="var(--color-macro-teal)" />
            <Macro i={4} grams={targets.fat} label="fat" color="var(--color-macro-ochre)" />
          </div>
        </section>
      ) : null}

      {state === 'ready' && trainingDays.length ? (
        <section aria-label="Training week" style={{ '--i': 6 } as CSSProperties} className="rise mt-3 rounded-[var(--radius-card)] bg-card p-5 outline outline-1 -outline-offset-1 outline-ink-08">
          <p className="text-[17px] font-bold text-ink">{trainingDays.length} training days a week</p>
          <ul className="mt-3 flex flex-col">
            {trainingDays.map((day, i) => (
              <li key={i} style={{ '--i': i + 7 } as CSSProperties} className="rise flex min-h-12 items-center justify-between border-t border-ink-06 text-[15.5px] first:border-t-0">
                <span className="font-semibold text-ink">{day.name || `Day ${i + 1}`}</span>
                <span className="text-ink-65">{plural(day.exercises?.length ?? 0, 'exercise')}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </OnboardingStep>
  )
}
