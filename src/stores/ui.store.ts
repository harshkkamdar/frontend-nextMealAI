import { create } from 'zustand'

interface UIState {
  activeSheet: string | null
  openSheet: (name: string) => void
  closeSheet: () => void
  /** Geo replies in flight anywhere in the app; the nav's Geo mark orbits while it is above zero. */
  geoWorking: number
  /** Counts Geo tasks that finished well; the nav's mark makes one turn each time it moves. */
  geoDone: number
  geoStart: () => void
  geoEnd: (ok?: boolean) => void
}

/** Runs a Geo task (a reply, a photo read): the nav's Geo works while it runs and turns once when it lands. */
export async function geoTask<T>(run: () => Promise<T>): Promise<T> {
  const { geoStart, geoEnd } = useUIStore.getState()
  geoStart()
  try {
    const result = await run()
    geoEnd(true)
    return result
  } catch (error) {
    geoEnd(false)
    throw error
  }
}

export const useUIStore = create<UIState>()((set) => ({
  activeSheet: null,
  openSheet: (name) => set({ activeSheet: name }),
  closeSheet: () => set({ activeSheet: null }),
  geoWorking: 0,
  geoDone: 0,
  geoStart: () => set((state) => ({ geoWorking: state.geoWorking + 1 })),
  geoEnd: (ok = false) => set((state) => ({ geoWorking: Math.max(0, state.geoWorking - 1), geoDone: ok ? state.geoDone + 1 : state.geoDone })),
}))
