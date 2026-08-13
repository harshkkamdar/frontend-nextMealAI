/**
 * R6-10 — SuggestedReplies chips. Tapping a chip fires onSelect with the exact
 * option text (so the surface can send it as the next message).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SuggestedReplies } from '@/components/chat/suggested-replies'

describe('SuggestedReplies', () => {
  it('renders one chip per option', () => {
    render(<SuggestedReplies options={['Milk Chocolate', 'Dark Chocolate']} onSelect={() => {}} />)
    expect(screen.getByTestId('suggested-replies')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Milk Chocolate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dark Chocolate' })).toBeInTheDocument()
  })

  it('tapping a chip calls onSelect with that exact option', () => {
    const onSelect = vi.fn()
    render(<SuggestedReplies options={['Pull A', 'Pull B']} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pull B' }))
    expect(onSelect).toHaveBeenCalledWith('Pull B')
  })

  it('renders nothing when there are no options', () => {
    const { container } = render(<SuggestedReplies options={[]} onSelect={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('disables chips when disabled', () => {
    render(<SuggestedReplies options={['A', 'B']} onSelect={() => {}} disabled />)
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled()
  })
})
