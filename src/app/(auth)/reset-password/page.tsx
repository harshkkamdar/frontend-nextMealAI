'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { updatePassword } from '@/lib/api/auth.api'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-65 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

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
    try {
      await updatePassword(data.password, linkState.accessToken)
      toast.success('Password updated. Please sign in with your new password.')
      router.push('/login')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (linkState.status === 'pending') {
    return (
      <div className="text-center text-[15.5px] text-ink-65">Loading...</div>
    )
  }

  if (linkState.status === 'invalid') {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
            Invalid or expired reset link
          </h1>
          <p className="mt-1 text-[15.5px] text-ink-65">
            Please request a new password reset link.
          </p>
        </div>
        <p className="text-center">
          <Link
            href="/forgot-password"
            className="flex h-14 w-full items-center justify-center rounded-[15px] border border-ink-16 bg-cream text-[18px] font-bold text-ink"
          >
            Request a new link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
          Choose a new password
        </h1>
        <p className="mt-1 text-[15.5px] text-ink-65">
          Choose a strong password you haven&apos;t used before
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <SectionLabel><label htmlFor="password">New password</label></SectionLabel>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className={inputClassName}
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="text-[13px] font-semibold text-ink">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="confirmPassword">Confirm new password</label></SectionLabel>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className={inputClassName}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-[13px] font-semibold text-ink">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="justify-center"
        >
          {isLoading ? 'Updating...' : 'Update password'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="text-[15.5px] font-semibold text-ink-65"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-[15.5px] text-ink-65">Loading...</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
