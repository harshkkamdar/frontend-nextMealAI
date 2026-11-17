'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { FormNotice } from '@/components/auth/form-notice'
import { PasswordChecklist, passwordOk } from '@/components/auth/password-rules'
import { TextField } from '@/components/ui/fiqr/text-field'
import { signup } from '@/lib/api/auth.api'
import { depthTo } from '@/components/onboarding/depth-nav'
import { haptic } from '@/lib/platform/app'

const signupSchema = z
  .object({
    email: z.string().email('Enter an email like name@example.com'),
    password: z.string().refine(passwordOk, 'Meet every rule below'),
    confirmPassword: z.string().min(1, 'Type the password again'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords don't match",
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

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
      depthTo(() => router.push('/onboarding/personal'))
    } catch (error) {
      void haptic('warning')
      setFailure((f) => ({ message: error instanceof Error ? error.message : "That didn't work. Check your connection and try again.", attempt: (f?.attempt ?? 0) + 1 }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingStep
      stepKey="signup"
      question="Create your account"
      why="Geo saves your plan and your logs to it."
      onBack={() => depthTo(() => router.push('/welcome'), -1)}
      cta="Create account"
      busyLabel="Creating account…"
      canContinue
      busy={isLoading}
      onContinue={handleSubmit(onSubmit)}
      notice={failure ? <FormNotice key={failure.attempt}>{failure.message}</FormNotice> : null}
      secondary={{ label: 'I have an account', onClick: () => depthTo(() => router.push('/login')) }}
    >
      <div className="flex flex-col gap-5">
        <TextField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email?.message} i={2} {...register('email')} />
        <div>
          <TextField id="password" label="Password" type="password" placeholder="Choose a password" autoComplete="new-password" error={errors.password?.message} i={3} {...register('password')} />
          <div className="rise" style={{ '--i': 3 } as CSSProperties}><PasswordChecklist password={watch('password')} /></div>
        </div>
        <TextField id="confirmPassword" label="Confirm password" type="password" placeholder="Type it again" autoComplete="new-password" error={errors.confirmPassword?.message} i={4} {...register('confirmPassword')} />
      </div>
    </OnboardingStep>
  )
}
