import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/lib/api/client'
import { getChatSessions } from '@/lib/api/chat.api'

const fetchMock = vi.mocked(apiFetch)
const row = (n: number) => ({ id: `s${n}`, session_id: `s${n}`, title: `Chat ${n}` })

describe('getChatSessions', () => {
  beforeEach(() => fetchMock.mockReset())

  it('asks for one page with limit and offset and returns the server hasMore', async () => {
    fetchMock.mockResolvedValue({ sessions: [row(1)], pagination: { hasMore: true } })
    const page = await getChatSessions(20, 40)
    expect(fetchMock).toHaveBeenCalledWith('/v1/chat/sessions?limit=20&offset=40')
    expect(page).toEqual({ sessions: [row(1)], hasMore: true })
  })

  it('infers hasMore from a full page when the server sends no pagination', async () => {
    fetchMock.mockResolvedValue({ sessions: [row(1), row(2)] })
    expect((await getChatSessions(2)).hasMore).toBe(true)
    fetchMock.mockResolvedValue({ sessions: [row(1)] })
    expect((await getChatSessions(2)).hasMore).toBe(false)
  })

  it('accepts a bare array as the last page', async () => {
    fetchMock.mockResolvedValue([row(1), row(2)])
    expect(await getChatSessions(2)).toEqual({ sessions: [row(1), row(2)], hasMore: false })
  })
})
