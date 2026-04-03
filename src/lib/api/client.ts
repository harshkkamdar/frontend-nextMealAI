// CLIENT-SIDE ONLY: This module reads from Zustand's persisted store (localStorage).
// Do not import or call apiFetch from Server Components or Route Handlers.
import { ApiException } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

// In-flight refresh promise to prevent concurrent refresh races
let refreshPromise: Promise<string | null> | null = null

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) return null
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const newAccess = data.session?.access_token
      const newRefresh = data.session?.refresh_token
      if (!newAccess) return null
      const user = useAuthStore.getState().user!
      useAuthStore.getState().setSession(user, newAccess, newRefresh ?? refreshToken)
      document.cookie = `nextmealai-token=${newAccess}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
      return newAccess
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken

  // If no token and this isn't an auth endpoint, redirect to login
  if (!accessToken && !path.startsWith('/auth/')) {
    handleAuthFailure()
    throw new ApiException(401, 'Not authenticated', 'NO_TOKEN', 'No access token')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      // Try to refresh the token once, then retry the original request
      const newToken = await tryRefreshToken()
      if (newToken) {
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
        const retryRes = await fetch(`/api${path}`, {
          ...options,
          headers: retryHeaders,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        })
        if (retryRes.ok) {
          if (retryRes.status === 204) return undefined as T
          return retryRes.json() as Promise<T>
        }
      }
      handleAuthFailure()
      throw new ApiException(401, 'Session expired', 'INVALID_TOKEN', 'Please log in again')
    }

    let errorData: { error?: string; code?: string; message?: string } = {}
    try {
      errorData = await response.json()
    } catch {
      // ignore parse errors
    }
    throw new ApiException(
      response.status,
      errorData.error ?? response.statusText,
      errorData.code,
      errorData.message
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function handleAuthFailure() {
  useAuthStore.getState().clearSession()
  document.cookie = 'nextmealai-token=; path=/; max-age=0'
  document.cookie = 'nextmealai-onboarded=; path=/; max-age=0'
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}
