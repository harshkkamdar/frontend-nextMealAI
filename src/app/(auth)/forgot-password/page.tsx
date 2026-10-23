'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { forgotPassword } from '@/lib/api/auth.api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-65 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
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
      // Generic success message — never reveal whether the email exists.
      toast.success("If that email exists, we've sent you a reset link.")
      reset()
    } catch {
      // Even on error, surface the same generic message so we don't leak
      // account existence. The backend already returns 200 in normal cases;
      // a non-2xx response here would typically be a rate-limit or network
      // hiccup.
      toast.success("If that email exists, we've sent you a reset link.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
          Reset your password
        </h1>
        <p className="mt-1 text-[15.5px] text-ink-65">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <SectionLabel><label htmlFor="email">Email</label></SectionLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClassName}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="text-[13px] font-semibold text-ink">{errors.email.message}</p>
          )}
        </div>

        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="justify-center"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-[15.5px] font-semibold text-ink-65">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
