'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/lib/api/auth.api'
import { probeResetPasswordLinkLoad } from '@/lib/auth-telemetry'

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

    // FE-RCA F5 — probe the link-load outcome. The chain (BE env var +
    // Supabase Redirect URLs allowlist) is invisible from FE code; this
    // beacon is the only way to detect "user clicked the email link but no
    // recovery token landed" — the silent-misconfig case Harsh hit twice.
    const hasHash = hash.length > 0
    const hasQuery = Array.from(searchParams.keys()).length > 0
    const noTokenAtAll = !accessToken
    let outcome: 'valid' | 'invalid' | 'missing'
    if (accessToken && (type === 'recovery' || type === 'magiclink')) {
      outcome = 'valid'
    } else if (noTokenAtAll) {
      outcome = 'missing'
    } else {
      outcome = 'invalid'
    }
    probeResetPasswordLinkLoad({
      outcome,
      noTokenAtAll,
      hasHash,
      hasQuery,
    })

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
      <div className="text-center text-sm text-text-secondary">Loading...</div>
    )
  }

  if (linkState.status === 'invalid') {
    return (
      <div>
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-semibold text-text-primary">
            Invalid or expired reset link
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Please request a new password reset link.
          </p>
        </div>
        <p className="text-center text-sm text-text-secondary">
          <Link
            href="/forgot-password"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Request a new link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-[22px] font-semibold text-text-primary">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Choose a strong password you haven&apos;t used before
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white hover:opacity-90"
        >
          {isLoading ? 'Updating...' : 'Update password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-hover"
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
        <div className="text-center text-sm text-text-secondary">Loading...</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
