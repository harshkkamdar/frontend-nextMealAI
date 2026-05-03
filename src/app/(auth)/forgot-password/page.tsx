'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/lib/api/auth.api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

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
      <div className="mb-8 text-center">
        <h1 className="text-[22px] font-semibold text-text-primary">
          Forgot your password?
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white hover:opacity-90"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
