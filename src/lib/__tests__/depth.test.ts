import { describe, expect, it } from 'vitest'
import { motionValue } from 'framer-motion'
import { act, renderHook } from '@testing-library/react'
import { anyHeld, holdSheetDepth, releaseSheetDepth, sheetDepth, useSheetDepth } from '@/lib/depth'

describe('sheet depth', () => {
  it('follows the deepest held sheet and returns to 0 once every sheet is released', () => {
    const a = motionValue(0)
    const b = motionValue(0)
    holdSheetDepth(a)
    holdSheetDepth(a)
    a.set(0.4)
    expect(sheetDepth.get()).toBeCloseTo(0.4)
    holdSheetDepth(b)
    b.set(0.9)
    expect(sheetDepth.get()).toBeCloseTo(0.9)
    releaseSheetDepth(b)
    expect(sheetDepth.get()).toBeCloseTo(0.4)
    // Released values no longer count.
    b.set(1)
    expect(sheetDepth.get()).toBeCloseTo(0.4)
    a.set(3)
    expect(sheetDepth.get()).toBe(1.05)
    releaseSheetDepth(a)
    releaseSheetDepth(a)
    expect(sheetDepth.get()).toBe(0)
  })
})

describe('useSheetDepth', () => {
  it('releases a sheet dragged fully down and then closed, so the page behind is not left lifted', () => {
    const view = renderHook(({ open }) => useSheetDepth(open), { initialProps: { open: true } })
    expect(anyHeld()).toBe(true)
    act(() => view.result.current.drag(0))
    view.rerender({ open: false })
    expect(anyHeld()).toBe(false)
    view.unmount()
  })
})
