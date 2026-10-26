import { describe, expect, it } from 'vitest'
import { motionValue } from 'framer-motion'
import { holdSheetDepth, releaseSheetDepth, sheetDepth } from '@/lib/depth'

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
