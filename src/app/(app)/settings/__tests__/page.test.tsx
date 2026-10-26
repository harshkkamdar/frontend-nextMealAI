import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  healthName: null as 'Apple Health' | 'Health Connect' | null,
  native: false,
  subscribed: false,
  getSettings: vi.fn(),
  getProfile: vi.fn(),
  updateSettings: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => false }))
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { id: string; email: string } }) => unknown) => selector({ user: { id: 'u1', email: 'user@example.com' } }),
}))
vi.mock('@/lib/api/settings.api', () => ({
  getSettings: (...args: unknown[]) => mocks.getSettings(...args),
  updateSettings: (...args: unknown[]) => mocks.updateSettings(...args),
}))
vi.mock('@/lib/api/profile.api', () => ({
  getProfile: (...args: unknown[]) => mocks.getProfile(...args),
  updateProfile: vi.fn(),
}))
vi.mock('@/lib/api/account.api', () => ({ downloadExport: vi.fn() }))
vi.mock('@/lib/api/auth.api', () => ({ logout: vi.fn() }))
vi.mock('@/lib/platform', () => ({ isNative: () => mocks.native }))
vi.mock('@/lib/platform/health', () => ({
  healthLabel: () => mocks.healthName,
  isHealthConnected: vi.fn().mockResolvedValue(false),
  disconnectHealth: vi.fn().mockResolvedValue(undefined),
  lastHealthSync: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/platform/purchases', () => ({
  isSubscribed: () => Promise.resolve(mocks.subscribed),
  restorePurchases: vi.fn().mockResolvedValue(false),
  manageSubscription: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/components/native/health-connect-sheet', () => ({ HealthConnectSheet: () => null }))
vi.mock('@/components/settings/delete-account-sheet', () => ({ DeleteAccountSheet: () => null }))

import SettingsPage from '@/app/(app)/settings/page'

beforeEach(() => {
  mocks.healthName = null
  mocks.native = false
  mocks.subscribed = false
  mocks.getSettings.mockResolvedValue({
    id: 'settings-1', user_id: 'u1', notifications_enabled: false, notification_time: '08:00', notification_types: [],
    geo_personality: 'balanced', auto_apply_suggestions: false, auto_apply_threshold: 0.8, check_in_weekday: 1,
    share_progress: false, analytics_enabled: false, rest_timer_seconds: 90, created_at: '', updated_at: '',
  })
  mocks.getProfile.mockResolvedValue({ id: 'profile-1', user_id: 'u1', full_name: 'Test User', created_at: '', updated_at: '' })
})

describe('Settings health and subscription sections', () => {
  it('shows Apple Health with Never when no sync has completed', async () => {
    mocks.healthName = 'Apple Health'
    mocks.native = true
    render(<SettingsPage />)

    expect(await screen.findByText('Apple Health')).toBeInTheDocument()
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('omits the health section when the platform does not support health data', async () => {
    render(<SettingsPage />)

    await screen.findByText('Test User')
    expect(screen.queryByText('Apple Health')).not.toBeInTheDocument()
    expect(screen.queryByText('Health Connect')).not.toBeInTheDocument()
  })

  it('shows the paid plan and management row for a subscriber', async () => {
    mocks.native = true
    mocks.subscribed = true
    render(<SettingsPage />)

    expect(await screen.findByText('FIQR Plus')).toBeInTheDocument()
    expect(screen.getByText('Manage subscription')).toBeInTheDocument()
  })
})

describe('Settings plan row', () => {
  it('shows Free on web and explains that plans are managed in the phone app', async () => {
    render(<SettingsPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Plan\s*Free/ }))
    expect(screen.getByText('Your plan lives in the app')).toBeInTheDocument()
  })

  it('links the native free plan to the paywall', async () => {
    mocks.native = true
    render(<SettingsPage />)

    expect(await screen.findByRole('link', { name: /Plan\s*Free/ })).toHaveAttribute('href', '/paywall')
  })
})

describe('Settings pickers', () => {
  it('shows the saved check-in day and saves a new one from the native picker', async () => {
    mocks.updateSettings.mockImplementation((patch: object) => Promise.resolve({ ...patch }))
    render(<SettingsPage />)

    const picker = await screen.findByLabelText('Check-in day')
    expect(picker).toHaveValue('1')
    expect(screen.getAllByText('Monday')[0]).toBeVisible()
    fireEvent.change(picker, { target: { value: '4' } })
    expect(mocks.updateSettings).toHaveBeenCalledWith({ check_in_weekday: 4 })
  })
})
