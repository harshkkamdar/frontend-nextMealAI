'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { FormNotice } from '@/components/auth/form-notice'
import { TextField } from '@/components/ui/fiqr/text-field'
import { updatePassword } from '@/lib/api/auth.api'
import { depthTo } from '@/components/onboarding/depth-nav'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Type the password again'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

type LinkState =
  | { status: 'pending' }
  | { status: 'invalid' }
  | { status: 'valid'; accessToken: string }

// Inner client form. Reads useSearchParams, so it must live inside a
// <Suspense> boundary — Next.js 16 prerender bails on CSR-only hooks at the
// page root and refuses to build.
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [linkState, setLinkState] = useState<LinkState>({ status: 'pending' })
  const [isLoading, setIsLoading] = useState(false)
  const [failure, setFailure] = useState<{ message: string; attempt: number } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Supabase typically appends the recovery tokens to the URL hash, but
    // some flows put them in the query string — try the hash first, then
    // fall back to query params.
    const hash =
      typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
    const hashParams = new URLSearchParams(hash)

    const accessToken =
      hashParams.get('access_token') ?? searchParams.get('access_token')
    const type = hashParams.get('type') ?? searchParams.get('type')

    if (accessToken && (type === 'recovery' || type === 'magiclink')) {
      setLinkState({ status: 'valid', accessToken })
    } else {
      setLinkState({ status: 'invalid' })
    }
  }, [searchParams])

  async function onSubmit(data: ResetPasswordValues) {
    if (linkState.status !== 'valid') return
    setIsLoading(true)
    setFailure(null)
    try {
      await updatePassword(data.password, linkState.accessToken)
      toast.success('Password updated. Sign in with your new password.')
      depthTo(() => router.push('/login'))
    } catch (error) {
      setFailure((f) => ({ message: error instanceof Error ? error.message : "That didn't work. Check your connection and try again.", attempt: (f?.attempt ?? 0) + 1 }))
    } finally {
      setIsLoading(false)
    }
  }

  if (linkState.status === 'pending') return null

  if (linkState.status === 'invalid') {
    return (
      <OnboardingStep
        stepKey="reset-invalid"
        question="This reset link has expired"
        why="Reset links work once and expire. Ask for a new one and use the latest email."
        onBack={() => depthTo(() => router.push('/login'), -1)}
        cta="Send a new link"
        canContinue
        onContinue={() => depthTo(() => router.push('/forgot-password'))}
      >
        {null}
      </OnboardingStep>
    )
  }

  return (
    <OnboardingStep
      stepKey="reset"
      question="Choose a new password"
      why="Use at least 8 characters, one you haven't used here before."
      onBack={() => depthTo(() => router.push('/login'), -1)}
      cta="Update password"
      busyLabel="Updating…"
      canContinue
      busy={isLoading}
      onContinue={handleSubmit(onSubmit)}
      notice={failure ? <FormNotice key={failure.attempt}>{failure.message}</FormNotice> : null}
    >
      <div className="flex flex-col gap-5">
        <TextField id="password" label="New password" type="password" placeholder="Choose a password" autoComplete="new-password" error={errors.password?.message} i={2} {...register('password')} />
        <TextField id="confirmPassword" label="Confirm new password" type="password" placeholder="Type it again" autoComplete="new-password" error={errors.confirmPassword?.message} i={3} {...register('confirmPassword')} />
      </div>
    </OnboardingStep>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
