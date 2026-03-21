import { apiFetch } from './client'
import { useAuthStore } from '@/stores/auth.store'

interface AuthResponse {
  user: { id: string; email: string }
  session: { access_token: string; refresh_token: string }
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
