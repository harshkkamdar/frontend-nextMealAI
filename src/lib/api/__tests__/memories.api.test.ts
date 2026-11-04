import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api/client'
import { forgetMemory, getProfileMemories } from '@/lib/api/memories.api'

const fetchMock = vi.mocked(apiFetch)

describe('memories api', () => {
  beforeEach(() => fetchMock.mockReset())

  it('loads profile memories and archives one with the removal reason', async () => {
    const memory = { id: 'm1', content: 'Prefers morning workouts', type: 'preference', created_at: '2026-11-03T08:00:00Z' }
    fetchMock.mockResolvedValueOnce({ memories: [memory] }).mockResolvedValueOnce(undefined)

    await expect(getProfileMemories()).resolves.toEqual([memory])
    await forgetMemory('m1')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/memories?limit=500')
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/memories/m1/archive', {
      method: 'POST',
      body: { reason: 'Removed by the user in Settings' },
    })
  })

  it('leaves out short-term notes past their end', async () => {
    fetchMock.mockResolvedValueOnce({ memories: [
      { id: 'a', content: 'Sore knee', type: 'context', created_at: '2026-11-01', metadata: { expires_at: '2000-01-01T00:00:00Z' } },
      { id: 'b', content: 'Travelling', type: 'context', created_at: '2026-11-01', metadata: { expires_at: '2999-01-01T00:00:00Z' } },
    ] })
    expect((await getProfileMemories()).map((m) => m.id)).toEqual(['b'])
  })

  it('returns an empty list when memories are missing', async () => {
    fetchMock.mockResolvedValue({})
    await expect(getProfileMemories()).resolves.toEqual([])
  })
})
