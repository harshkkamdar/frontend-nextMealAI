import { beforeEach, describe, expect, it, vi } from 'vitest'

const imageCompression = vi.hoisted(() => vi.fn())

vi.mock('browser-image-compression', () => ({ default: imageCompression }))

import { compressImage } from '@/lib/image/compress'

describe('compressImage', () => {
  beforeEach(() => imageCompression.mockReset())

  it('compresses images with the required size limit', async () => {
    const source = new File(['source'], 'meal.jpg', { type: 'image/jpeg' })
    const compressed = new File(['compressed'], 'meal.jpg', { type: 'image/jpeg' })
    imageCompression.mockResolvedValue(compressed)

    await expect(compressImage(source)).resolves.toBe(compressed)
    expect(imageCompression).toHaveBeenCalledWith(
      source,
      expect.objectContaining({ maxWidthOrHeight: 1600 })
    )
  })

  it('returns non-image files untouched', async () => {
    const source = new File(['notes'], 'notes.txt', { type: 'text/plain' })

    await expect(compressImage(source)).resolves.toBe(source)
    expect(imageCompression).not.toHaveBeenCalled()
  })
})
