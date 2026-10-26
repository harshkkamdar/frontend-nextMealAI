import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { MotionValue } from 'framer-motion'
import { ResizableSheet } from '../resizable-sheet'

// Records, for each entrance animation, whether the sheet was already in the DOM and where it started.
const starts: { mounted: boolean; from: number; velocity: number }[] = []
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return {
    ...actual,
    useReducedMotion: () => false,
    animate: (value: MotionValue<number>, ...rest: unknown[]) => {
      starts.push({ mounted: document.querySelector('[role=dialog]') !== null, from: value.get(), velocity: value.getVelocity() })
      return (actual.animate as (...args: unknown[]) => { stop: () => void })(value, ...rest)
    },
  }
})

describe('ResizableSheet entrance', () => {
  it('starts the slide-up only after the sheet has mounted below the screen, at rest', () => {
    const { rerender } = render(<ResizableSheet open={false} onClose={() => {}} ariaLabel="Geo"><p>body</p></ResizableSheet>)
    expect(starts).toHaveLength(0)
    rerender(<ResizableSheet open onClose={() => {}} ariaLabel="Geo"><p>body</p></ResizableSheet>)
    // Started before the commit, the spring ran while the sheet mounted and it first painted part way up.
    expect(starts).toHaveLength(1)
    expect(starts[0].mounted).toBe(true)
    // Below the screen (height + 48 px; jsdom's 768 px window at the default 0.5 level gives 384 + 48).
    expect(starts[0].from).toBe(432)
    // A jump, not a set: no stray velocity that would make the spring dive further down first.
    expect(starts[0].velocity).toBe(0)
  })
})
