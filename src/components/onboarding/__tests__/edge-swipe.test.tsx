import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { useEdgeSwipeBack } from '../edge-swipe'

function Probe({ onBack }: { onBack?: () => void }) {
  useEdgeSwipeBack(onBack)
  return <div data-testid="page" />
}

const touch = (x: number, y = 300) => ({ touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }] })

function swipe(points: Array<[number, number]>, stepMs = 16) {
  const now = vi.spyOn(performance, 'now')
  let t = 1000
  now.mockImplementation(() => t)
  fireEvent.touchStart(window, touch(...points[0]))
  for (const p of points.slice(1)) { t += stepMs; fireEvent.touchMove(window, touch(...p)) }
  fireEvent.touchEnd(window, { touches: [], changedTouches: [touch(...points[points.length - 1]).changedTouches[0]] })
  now.mockRestore()
}

describe('useEdgeSwipeBack', () => {
  it('goes back after a rightward swipe from the left edge past half the screen', () => {
    const onBack = vi.fn()
    render(<Probe onBack={onBack} />)
    swipe([[8, 300], [60, 302], [140, 304], [240, 305]], 120)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('goes back on a short fast flick', () => {
    const onBack = vi.fn()
    render(<Probe onBack={onBack} />)
    swipe([[8, 300], [40, 300], [90, 300]], 16)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('ignores touches away from the edge, vertical drags and short slow drags', () => {
    const onBack = vi.fn()
    render(<Probe onBack={onBack} />)
    swipe([[80, 300], [300, 300]], 120)
    swipe([[8, 300], [20, 360], [24, 460]], 120)
    swipe([[8, 300], [40, 300], [60, 300]], 200)
    expect(onBack).not.toHaveBeenCalled()
  })

  it('does nothing without a back action', () => {
    render(<Probe />)
    expect(() => swipe([[8, 300], [300, 300]])).not.toThrow()
  })
})
