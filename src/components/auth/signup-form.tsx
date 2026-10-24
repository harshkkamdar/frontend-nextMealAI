'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { FormNotice } from '@/components/auth/form-notice'
import { TextField } from '@/components/ui/fiqr/text-field'
import { signup } from '@/lib/api/auth.api'
import { leaveThen } from '@/lib/page-transition'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

const signupSchema = z
  .object({
    email: z.string().email('Enter an email like name@example.com'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Type the password again'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords don't match",
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

/** Ticks once the password is long enough, so the rule is met before Create account, not after. */
function LengthHint({ met }: { met: boolean }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-[14.5px] font-medium text-ink-65">
      <span aria-hidden="true" className={cn('grid size-[18px] place-items-center rounded-full border-[1.5px] transition-colors duration-200', met ? 'border-ink bg-ink text-cream' : 'border-ink-35')}>
        {met ? <svg viewBox="0 0 16 16" className="pop size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
      </span>
      At least 8 characters<span className="sr-only">{met ? ', done' : ''}</span>
    </p>
  )
}

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [failure, setFailure] = useState<{ message: string; attempt: number } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignupValues) {
    setIsLoading(true)
    setFailure(null)
    try {
      await signup(data.email, data.password)
      void haptic('success')
      leaveThen(() => router.push('/onboarding/personal'))
    } catch (error) {
      void haptic('warning')
      setFailure((f) => ({ message: error instanceof Error ? error.message : "That didn't work. Check your connection and try again.", attempt: (f?.attempt ?? 0) + 1 }))
    } finally {
      setIsLoading(false)
    }
  }

  const passwordLongEnough = watch('password').length >= 8

  return (
    <OnboardingStep
      stepKey="signup"
      question="Create your account"
      why="Geo saves your plan and your logs to it."
      onBack={() => leaveThen(() => router.push('/welcome'))}
      cta="Create account"
      busyLabel="Creating account…"
      canContinue
      busy={isLoading}
      onContinue={handleSubmit(onSubmit)}
      notice={failure ? <FormNotice key={failure.attempt}>{failure.message}</FormNotice> : null}
      secondary={{ label: 'I have an account', onClick: () => leaveThen(() => router.push('/login')) }}
    >
      <div className="flex flex-col gap-5">
        <TextField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email?.message} i={2} {...register('email')} />
        <div>
          <TextField id="password" label="Password" type="password" placeholder="Choose a password" autoComplete="new-password" error={errors.password?.message} i={3} {...register('password')} />
          {errors.password ? null : <div className="rise" style={{ '--i': 3 } as CSSProperties}><LengthHint met={passwordLongEnough} /></div>}
        </div>
        <TextField id="confirmPassword" label="Confirm password" type="password" placeholder="Type it again" autoComplete="new-password" error={errors.confirmPassword?.message} i={4} {...register('confirmPassword')} />
      </div>
    </OnboardingStep>
  )
}
