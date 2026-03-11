import { apiFetch } from './client'

export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface AuthResponse {
  user: AuthUser
  session: AuthSession
}

export interface SignupInput {
  email: string
  password: string
  name?: string
}

export interface LoginInput {
  email: string
  password: string
}

// Note: auth routes have no /v1/ prefix
export async function signup(input: SignupInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: input,
  })
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })
}

export async function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' })
}

export async function refreshToken(refreshToken: string): Promise<AuthSession> {
  const result = await apiFetch<{ session: AuthSession }>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  })
  return result.session
}
