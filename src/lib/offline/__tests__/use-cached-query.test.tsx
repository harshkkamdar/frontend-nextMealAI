import { act, renderHook, waitFor } from '@testing-library/react'
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

  it('keeps the newest read when an older one lands after it', async () => {
    // Home re-reads on every logs:* event: a read started before the water save must not put the old count back.
    const answers: Array<(value: { value: string }) => void> = []
    const fetcher = vi.fn(() => new Promise<{ value: string }>((resolve) => { answers.push(resolve) }))
    vi.mocked(recall).mockResolvedValue(null)

    const { result } = renderHook(() => useCachedQuery('dashboard', fetcher, []))
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    act(() => { void result.current.refetch() })
    answers[1]({ value: '2 glasses' })
    await waitFor(() => expect(result.current.data).toEqual({ value: '2 glasses' }))

    await act(async () => {
      answers[0]({ value: '1 glass' })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(result.current.data).toEqual({ value: '2 glasses' })
    expect(result.current.loading).toBe(false)
    expect(remember).toHaveBeenLastCalledWith('dashboard', { value: '2 glasses' })
  })
})
