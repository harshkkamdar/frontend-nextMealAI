import { create } from 'zustand'

type OnboardingStatus = 'unknown' | 'incomplete' | 'complete'
type ConsentStatus = 'unknown' | 'missing' | 'given'

interface OnboardingState {
  status: OnboardingStatus
  consent: ConsentStatus
  setStatus: (status: OnboardingStatus) => void
  setConsent: (value: boolean) => void
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  status: 'unknown',
  consent: 'unknown',
  setStatus: (status) => set(status === 'unknown' ? { status, consent: 'unknown' } : { status }),
  setConsent: (value) => set({ consent: value ? 'given' : 'missing' }),
}))
