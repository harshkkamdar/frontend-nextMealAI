import { create } from 'zustand'

interface UIState {
  activeSheet: string | null
  openSheet: (name: string) => void
  closeSheet: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeSheet: null,
  openSheet: (name) => set({ activeSheet: name }),
  closeSheet: () => set({ activeSheet: null }),
}))
