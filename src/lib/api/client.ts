import { ApiException } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken

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
