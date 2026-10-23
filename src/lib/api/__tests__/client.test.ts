import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiFetch } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth.store'

function respond(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })))
}

describe('apiFetch error messages', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@example.com' }, accessToken: 'token', refreshToken: 'refresh' })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the API message for the API error shape', async () => {
    respond(404, { error: true, code: 'NOT_FOUND', message: 'Plan not found' })
    await expect(apiFetch('/v1/plans/x')).rejects.toThrow('Plan not found')
  })

  it('never surfaces a non-string error body as the message', async () => {
    respond(500, { error: { message: 'boom' } })
    const error = await apiFetch('/v1/plans').catch((e: Error) => e)
    expect(String((error as Error).message)).not.toContain('[object Object]')
    expect((error as Error).message).toMatch(/Something went wrong/)
  })
})
