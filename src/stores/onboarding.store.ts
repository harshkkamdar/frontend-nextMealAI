import { create } from 'zustand'

type OnboardingStatus = 'unknown' | 'incomplete' | 'complete'

interface OnboardingState {
  status: OnboardingStatus
  setStatus: (status: OnboardingStatus) => void
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  status: 'unknown',
  setStatus: (status) => set({ status }),
}))
