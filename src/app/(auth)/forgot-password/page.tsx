'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { TextField } from '@/components/ui/fiqr/text-field'
import { forgotPassword } from '@/lib/api/auth.api'
import { depthTo } from '@/components/onboarding/depth-nav'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter an email like name@example.com'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true)
    try {
      await forgotPassword(data.email)
    } catch {
      // Same confirmation on error, so the screen never reveals whether an account exists.
      // The backend returns 200 in normal cases; a failure here is usually a rate limit or the network.
    } finally {
      setIsLoading(false)
      setSentTo(data.email)
    }
  }

  // One screen instance for both states, so the change animates (content rises, CTA label crossfades) instead of cutting.
  return (
    <OnboardingStep
      stepKey={sentTo ? 'forgot-sent' : 'forgot'}
      question={sentTo ? 'Check your email' : 'Reset your password'}
      why={sentTo ? `If an account uses ${sentTo}, a reset link is on its way. It can take a minute to arrive.` : "Enter your email and we'll send you a reset link."}
      onBack={sentTo ? () => setSentTo(null) : () => depthTo(() => router.push('/login'), -1)}
      cta={sentTo ? 'Back to sign in' : 'Send reset link'}
      busyLabel="Sending…"
      canContinue
      busy={isLoading}
      onContinue={sentTo ? () => depthTo(() => router.push('/login'), -1) : handleSubmit(onSubmit)}
      secondary={sentTo ? { label: 'Send it again', onClick: () => void onSubmit({ email: getValues('email') }) } : undefined}
    >
      {sentTo ? (
        <div className="rise grid size-20 place-items-center rounded-full bg-card outline outline-1 -outline-offset-1 outline-ink-08" style={{ '--i': 2 } as React.CSSProperties}>
          <svg viewBox="0 0 32 32" className="size-9 text-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="7" width="24" height="18" rx="3" /><path d="M5 9l11 8 11-8" /></svg>
        </div>
      ) : (
        <TextField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
      )}
    </OnboardingStep>
  )
}
