import { beforeEach, describe, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({ value: false }))
const hide = vi.hoisted(() => vi.fn())

vi.mock('@/lib/platform', () => ({ isNative: () => native.value }))
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide } }))

import { hideSplash } from '@/lib/platform/app'

describe('hideSplash', () => {
  beforeEach(() => hide.mockReset())

  it('does nothing on the web', async () => {
    native.value = false
    await hideSplash()
    expect(hide).not.toHaveBeenCalled()
  })

  it('hides the native splash', async () => {
    native.value = true
    await hideSplash()
    expect(hide).toHaveBeenCalledOnce()
  })
})
