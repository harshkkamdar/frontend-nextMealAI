import { create } from 'zustand'

interface UIState {
  activeSheet: string | null
  openSheet: (name: string) => void
  closeSheet: () => void
  /** Geo replies in flight anywhere in the app; the nav's Geo mark orbits while it is above zero. */
  geoWorking: number
  geoStart: () => void
  geoEnd: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeSheet: null,
  openSheet: (name) => set({ activeSheet: name }),
  closeSheet: () => set({ activeSheet: null }),
  geoWorking: 0,
  geoStart: () => set((state) => ({ geoWorking: state.geoWorking + 1 })),
  geoEnd: () => set((state) => ({ geoWorking: Math.max(0, state.geoWorking - 1) })),
}))
