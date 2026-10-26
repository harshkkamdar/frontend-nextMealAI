import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

const props = { title: 'Delete food?', description: 'This removes it from your list.', confirmLabel: 'Delete' }

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    render(<ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} {...props} />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('labels the dialog, focuses Cancel first and closes on Escape', () => {
    const onClose = vi.fn()
    render(<ConfirmDialog open onClose={onClose} onConfirm={() => {}} {...props} />)
    const dialog = screen.getByRole('alertdialog', { name: 'Delete food?' })
    expect(dialog).toHaveAccessibleDescription('This removes it from your list.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('runs the action once and blocks closing while it works', async () => {
    let finish = () => {}
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const onClose = vi.fn()
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'One moment…' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    finish()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled())
  })
})
