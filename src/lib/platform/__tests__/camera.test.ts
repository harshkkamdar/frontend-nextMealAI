import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/platform', () => ({
  isNative: () => false,
}))

import { pickPhoto } from '@/lib/platform/camera'

describe('pickPhoto', () => {
  it('returns null on the web', async () => {
    await expect(pickPhoto({ source: 'prompt' })).resolves.toBeNull()
  })
})
