import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MacroBarDot } from '@/components/shared/macro-bar-dot'

function getDot() {
  return screen.getByRole('button', { name: /show protein breakdown/i })
}

describe('MacroBarDot', () => {
  // AC01.1 — solid filled circle, colour class applied
  it('renders a solid filled circle with the provided colour class', () => {
    render(
      <MacroBarDot percent={50} colorClass="bg-info" ariaLabel="Show protein breakdown" onClick={() => {}} />,
    )
    const dot = getDot()
    expect(dot).toBeInTheDocument()
    expect(dot.className).toContain('bg-info')
    expect(dot.className).toContain('rounded-full')
  })

  // AC01.2 — 0% → left end, dot still present
  it('renders at 0% when consumed is 0', () => {
    render(
      <MacroBarDot percent={0} colorClass="bg-info" ariaLabel="Show protein breakdown" onClick={() => {}} />,
    )
    const dot = getDot()
    expect(dot.style.left).toBe('0%')
  })

  // AC01.3 — ≥100% clamps to 100%
  it('clamps to 100% when percent exceeds target', () => {
    render(
      <MacroBarDot percent={150} colorClass="bg-info" ariaLabel="Show protein breakdown" onClick={() => {}} />,
    )
    const dot = getDot()
    expect(dot.style.left).toBe('100%')
  })

  // AC01.14 — invalid (NaN, Infinity) falls back to 0%, still tappable
  it('falls back to 0% for non-finite percent and stays tappable', () => {
    const onClick = vi.fn()
    render(
      <MacroBarDot
        percent={Number.NaN}
        colorClass="bg-info"
        ariaLabel="Show protein breakdown"
        onClick={onClick}
      />,
    )
    const dot = getDot()
    expect(dot.style.left).toBe('0%')
    fireEvent.click(dot)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // AC01.15 — a11y: role=button, tabIndex, Enter + Space activation
  it('is a keyboard-activatable button with an aria-label', () => {
    const onClick = vi.fn()
    render(
      <MacroBarDot percent={42} colorClass="bg-info" ariaLabel="Show protein breakdown" onClick={onClick} />,
    )
    const dot = getDot()
    expect(dot).toHaveAttribute('aria-label', 'Show protein breakdown')
    expect(dot.tabIndex).toBe(0)
    fireEvent.keyDown(dot, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(dot, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(dot, { key: 'a' }) // irrelevant key
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('fires onClick on mouse click', () => {
    const onClick = vi.fn()
    render(
      <MacroBarDot percent={10} colorClass="bg-info" ariaLabel="Show protein breakdown" onClick={onClick} />,
    )
    fireEvent.click(getDot())
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
