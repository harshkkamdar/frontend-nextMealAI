import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useOnboardingDraft } from './onboarding-draft.store'
import { createPlatformStorage } from '@/lib/platform/storage'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  hasHydrated: boolean
  setSession: (user: User, accessToken: string, refreshToken: string) => void
  clearSession: () => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      hasHydrated: false,
      setSession: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isLoading: false }),
      clearSession: () => {
        // Onboarding answers (name, date of birth) must not survive into the next account on this device.
        useOnboardingDraft.getState().reset()
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
      },
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'nextmealai-auth',
      storage: createJSONStorage(() => createPlatformStorage()),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)
