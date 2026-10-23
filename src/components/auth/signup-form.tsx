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
import { signup } from '@/lib/api/auth.api'

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

const inputClassName = 'h-14 rounded-[15px] border border-ink-16 bg-card px-4 text-[17px] placeholder:text-ink-65 focus:border-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
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
    try {
      await signup(data.email, data.password)
      router.push('/onboarding/personal')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">
          Create your account
        </h1>
        <p className="mt-1 text-[15.5px] text-ink-65">
          Start your fitness journey
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

        <div className="space-y-2">
          <SectionLabel><label htmlFor="password">Password</label></SectionLabel>
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
          <SectionLabel><label htmlFor="confirmPassword">Confirm password</label></SectionLabel>
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-[15.5px] font-semibold text-ink-65">
          Have an account? Log in
        </Link>
      </p>
    </div>
  )
}
