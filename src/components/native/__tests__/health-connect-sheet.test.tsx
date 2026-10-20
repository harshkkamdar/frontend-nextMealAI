import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ connectHealth: vi.fn() }))

vi.mock('@/components/ui/bottom-sheet', () => ({
  BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
}))

vi.mock('@/lib/platform/health', () => ({
  healthLabel: () => 'Apple Health',
  connectHealth: mocks.connectHealth,
}))

import { HealthConnectSheet } from '@/components/native/health-connect-sheet'

describe('HealthConnectSheet', () => {
  it('uses the platform label and connects once on Continue', async () => {
    const onClose = vi.fn()
    const onConnected = vi.fn()
    mocks.connectHealth.mockResolvedValue(true)
    render(<HealthConnectSheet open onClose={onClose} onConnected={onConnected} />)

    expect(screen.getByRole('heading', { name: 'Connect Apple Health' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(mocks.connectHealth).toHaveBeenCalledTimes(1))
    expect(onConnected).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
