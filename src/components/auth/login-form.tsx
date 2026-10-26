'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { FormNotice } from '@/components/auth/form-notice'
import { TextField } from '@/components/ui/fiqr/text-field'
import { login } from '@/lib/api/auth.api'
import { depthTo, leaveAurora } from '@/components/onboarding/depth-nav'
import { haptic } from '@/lib/platform/app'

const loginSchema = z.object({
  email: z.string().email('Enter an email like name@example.com'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [failure, setFailure] = useState<{ message: string; attempt: number } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    setFailure(null)
    try {
      await login(data.email, data.password)
      void haptic('success')
      leaveAurora(() => router.push('/dashboard'))
    } catch (error) {
      void haptic('warning')
      setFailure((f) => ({ message: error instanceof Error ? error.message : "That didn't work. Check your connection and try again.", attempt: (f?.attempt ?? 0) + 1 }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingStep
      stepKey="login"
      question="Welcome back"
      why="Sign in to pick up where you left off."
      onBack={() => depthTo(() => router.push('/welcome'), -1)}
      cta="Sign in"
      busyLabel="Signing in…"
      canContinue
      busy={isLoading}
      onContinue={handleSubmit(onSubmit)}
      notice={failure ? <FormNotice key={failure.attempt}>{failure.message}</FormNotice> : null}
      secondary={{ label: 'New here? Create an account', onClick: () => depthTo(() => router.push('/signup')) }}
    >
      <div className="flex flex-col gap-5">
        <TextField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email?.message} i={2} {...register('email')} />
        <div>
          <TextField id="password" label="Password" type="password" placeholder="Your password" autoComplete="current-password" error={errors.password?.message} i={3} {...register('password')} />
          <div className="rise flex justify-end" style={{ '--i': 4 } as React.CSSProperties}>
            <button type="button" onClick={() => depthTo(() => router.push('/forgot-password'))} className="-mr-2 mt-1 flex h-11 items-center px-2 text-body-sm font-semibold text-ink">
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </OnboardingStep>
  )
}
