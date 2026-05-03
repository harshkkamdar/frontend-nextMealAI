import { apiFetch } from './client'
import { useAuthStore } from '@/stores/auth.store'
import { ApiException } from '@/types/api.types'

interface AuthResponse {
  user: { id: string; email: string }
  session: { access_token: string; refresh_token: string }
}

interface ResetPasswordResponse {
  message: string
}

interface UpdatePasswordResponse {
  message?: string
}

export async function signup(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, password, fullName },
  })
  useAuthStore.getState().setSession(data.user, data.session.access_token, data.session.refresh_token)
  document.cookie = `nextmealai-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  useAuthStore.getState().setSession(data.user, data.session.access_token, data.session.refresh_token)
  document.cookie = `nextmealai-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  return data
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    useAuthStore.getState().clearSession()
    document.cookie = 'nextmealai-token=; path=/; max-age=0'
    document.cookie = 'nextmealai-onboarded=; path=/; max-age=0'
  }
}

export async function forgotPassword(email: string): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: { email },
  })
}

export async function updatePassword(
  password: string,
  accessToken: string
): Promise<UpdatePasswordResponse> {
  // The access token comes from the Supabase magic-link URL fragment, not the
  // persisted auth store, so we bypass apiFetch's automatic Bearer attachment
  // and call the proxy directly with an explicit Authorization header.
  const response = await fetch('/api/auth/update-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
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

  if (response.status === 204) {
    return {}
  }

  return response.json() as Promise<UpdatePasswordResponse>
}
