import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/platform', () => ({
  isNative: () => false,
}))

import { createPlatformStorage } from '@/lib/platform/storage'

describe('createPlatformStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses localStorage on the web', async () => {
    const storage = createPlatformStorage()

    await storage.setItem('fiqr:test', 'saved')

    expect(localStorage.getItem('fiqr:test')).toBe('saved')
    expect(await storage.getItem('fiqr:test')).toBe('saved')

    await storage.removeItem('fiqr:test')
    expect(await storage.getItem('fiqr:test')).toBeNull()
  })

  it('returns null when localStorage cannot be read', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('blocked')
    })

    expect(await createPlatformStorage().getItem('fiqr:test')).toBeNull()
    getItem.mockRestore()
  })
})
