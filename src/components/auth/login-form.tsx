'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { login } from '@/lib/api/auth.api'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-35 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
    try {
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
          Welcome back
        </h1>
        <p className="mt-1 text-[15.5px] text-ink-60">
          Sign in to your account
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
            <p className="text-xs text-accent">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel><label htmlFor="password">Password</label></SectionLabel>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className={inputClassName}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-accent">{errors.password.message}</p>
          )}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[15.5px] font-semibold text-ink-60"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="justify-center"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center">
        <Link href="/signup" className="text-[15.5px] font-semibold text-ink-60">
          New here? Create an account
        </Link>
      </p>
    </div>
  )
}
