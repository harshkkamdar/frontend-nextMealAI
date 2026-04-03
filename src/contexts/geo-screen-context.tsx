'use client'

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'
import { useEffect } from 'react'

interface ScreenContext {
  screen: string
  context: Record<string, unknown>
}

interface GeoScreenContextValue {
  getScreenContext: () => ScreenContext
  setScreenContext: (screen: string, context: Record<string, unknown>) => void
}

const GeoScreenCtx = createContext<GeoScreenContextValue | null>(null)

export function GeoScreenContextProvider({ children }: { children: ReactNode }) {
  const ref = useRef<ScreenContext>({ screen: 'unknown', context: {} })

  const getScreenContext = useCallback(() => ref.current, [])

  const setScreenContext = useCallback((screen: string, context: Record<string, unknown>) => {
    ref.current = { screen, context }
  }, [])

  return (
    <GeoScreenCtx.Provider value={{ getScreenContext, setScreenContext }}>
      {children}
    </GeoScreenCtx.Provider>
  )
}

export function useGeoScreenContext() {
  const ctx = useContext(GeoScreenCtx)
  if (!ctx) throw new Error('useGeoScreenContext must be used within GeoScreenContextProvider')
  return ctx.getScreenContext
}

export function useSetGeoScreen(screen: string, context: Record<string, unknown>) {
  const ctx = useContext(GeoScreenCtx)
  useEffect(() => {
    ctx?.setScreenContext(screen, context)
  }, [ctx, screen, JSON.stringify(context)])
}
