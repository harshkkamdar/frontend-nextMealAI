// CLIENT-SIDE ONLY: This module reads from Zustand's persisted store (localStorage).
// Do not import or call apiFetch from Server Components or Route Handlers.
import { ApiException } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'
import { isOnline } from '@/lib/platform/network'

export const API_BASE = (process.env.NEXT_PUBLIC_CORE_API_URL ?? 'http://localhost:4010').replace(/\/$/, '')

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  idempotencyKey?: string
}

export class OfflineError extends Error {
  constructor(message = 'Network unavailable') {
    super(message)
    this.name = 'OfflineError'
  }
}

// FB-R6-02 — detect FormData so multipart uploads bypass JSON.stringify and
// let the browser set the multipart boundary automatically.
function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

// In-flight refresh promise to prevent concurrent refresh races
let refreshPromise: Promise<string | null> | null = null

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) return null
      const res = await fetch(`${API_BASE}/auth/refresh`, {
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
      return newAccess
    } catch (error) {
      if (error instanceof TypeError && !(await isOnline())) {
        throw new OfflineError(error.message)
      }
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken
  const { idempotencyKey, ...requestOptions } = options

  // If no token and this isn't an auth endpoint, redirect to login
  if (!accessToken && !path.startsWith('/auth/')) {
    handleAuthFailure()
    throw new ApiException(401, 'Not authenticated', 'NO_TOKEN', 'No access token')
  }

  // FB-R6-02 — FormData bodies skip the JSON Content-Type and the
  // JSON.stringify call so multipart uploads work end-to-end. Header overrides
  // from the caller still take precedence.
  const bodyIsForm = isFormData(options.body)
  const headers: Record<string, string> = {
    ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  // FB-R6.7 Build E — attach the browser's IANA timezone on every request so
  // the BE can bucket `local_date` in the user's actual zone without depending
  // on a profile.timezone row that may be stale or NULL. The header overrides
  // anything stale on the server side; profile.timezone remains the warm-path
  // default.
  if (typeof window !== 'undefined' && !headers['X-Timezone'] && !headers['x-timezone']) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) headers['X-Timezone'] = tz
    } catch {
      // Older browsers / odd environments: silently skip; BE falls back to profile.
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      headers,
      body:
        options.body === undefined
          ? undefined
          : bodyIsForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    })
  } catch (error) {
    if (error instanceof TypeError && !(await isOnline())) {
      throw new OfflineError(error.message)
    }
    throw error
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      // Try to refresh the token once, then retry the original request
      const newToken = await tryRefreshToken()
      if (newToken) {
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
        let retryRes: Response
        try {
          retryRes = await fetch(`${API_BASE}${path}`, {
            ...requestOptions,
            headers: retryHeaders,
            body:
              options.body === undefined
                ? undefined
                : bodyIsForm
                  ? (options.body as FormData)
                  : JSON.stringify(options.body),
          })
        } catch (error) {
          if (error instanceof TypeError && !(await isOnline())) {
            throw new OfflineError(error.message)
          }
          throw error
        }
        if (retryRes.ok) {
          if (retryRes.status === 204) return undefined as T
          return retryRes.json() as Promise<T>
        }
      }
      handleAuthFailure()
      throw new ApiException(401, 'Session expired', 'INVALID_TOKEN', 'Please log in again')
    }

    let errorData: { error?: unknown; code?: string; message?: unknown } = {}
    try {
      errorData = await response.json()
    } catch {
      // ignore parse errors
    }
    // The API sends { error: true, code, message }; never let a non-string reach a toast.
    const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined)
    throw new ApiException(
      response.status,
      text(errorData.error) ?? response.statusText,
      errorData.code,
      text(errorData.message) ?? (response.status >= 500 ? 'Something went wrong on our side. Try again in a moment.' : undefined)
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
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}
