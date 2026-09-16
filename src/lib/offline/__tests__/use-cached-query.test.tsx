import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/offline/cache', () => ({
  recall: vi.fn(),
  remember: vi.fn(),
}))

import { useCachedQuery } from '@/hooks/use-cached-query'
import { recall, remember } from '@/lib/offline/cache'

describe('useCachedQuery', () => {
  beforeEach(() => {
    vi.mocked(recall).mockReset()
    vi.mocked(remember).mockReset()
  })

  it('serves cached data first and replaces it with fresh data', async () => {
    let resolveFresh!: (value: { value: string }) => void
    const fetcher = vi.fn(
      () => new Promise<{ value: string }>((resolve) => { resolveFresh = resolve }),
    )
    vi.mocked(recall).mockResolvedValue({
      payload: { value: 'cached' },
      savedAt: '2026-09-17T08:00:00.000Z',
    })

    const { result } = renderHook(() => useCachedQuery('dashboard', fetcher, []))

    await waitFor(() => expect(result.current.data).toEqual({ value: 'cached' }))
    expect(result.current.stale).toBe(true)
    expect(result.current.savedAt).toBe('2026-09-17T08:00:00.000Z')

    resolveFresh({ value: 'fresh' })
    await waitFor(() => expect(result.current.data).toEqual({ value: 'fresh' }))
    expect(result.current.stale).toBe(false)
    expect(remember).toHaveBeenCalledWith('dashboard', { value: 'fresh' })
  })
})
