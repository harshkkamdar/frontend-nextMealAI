'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { login } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { ApiException } from '@/types/api.types'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const result = await login(data)
      setSession(result.user, result.session.access_token, result.session.refresh_token)
      // Write token to cookie for middleware
      document.cookie = `nextmealai-token=${result.session.access_token}; path=/; samesite=lax`
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.statusCode === 401) {
          setServerError('Invalid email or password')
        } else {
          setServerError(err.message || 'Login failed. Please try again.')
        }
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3">
        <GeoAvatar size="lg" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to continue with Geo</p>
        </div>
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
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive text-center">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand/90 text-white"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-brand hover:underline font-medium">
          Sign up
        </a>
      </p>
    </div>
  )
}
