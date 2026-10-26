'use client'

import { useEffect } from 'react'
import { DriftLayer } from '@/components/ui/fiqr/scroll-drift'

/**
 * Spatial Depth atmosphere (mocks/spatial-app.html, option 19; owner request 27 Oct 2026): soft brand colour fields on
 * the cream ground, behind every tab and pushed page. Two fixed layers drift with the scroll at 0.05x (peach and teal
 * fields) and 0.16x (a white glass slab and an ochre hint), and each breathes on a very slow transform-only loop.
 *
 * The fields are painted once as SVG backgrounds (`--atmo-far`, `--atmo-near` in globals.css). While this is mounted,
 * `html[data-atmosphere]` makes the live page layer transparent so the fields show through; a lifted page layer (under a
 * push, a sheet or a tab fade) paints the same fields itself at its own scroll, so it keeps its tint as it steps back.
 * Reduced transparency hides all of it (plain cream, solid cards); reduced motion stops the drift and the loop.
 */
export function Atmosphere() {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.atmosphere = ''
    // The ambient loop pauses while the app is hidden (globals.css keys on data-hidden).
    const onVisibility = () => root.toggleAttribute('data-hidden', document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      delete root.dataset.atmosphere
      root.removeAttribute('data-hidden')
    }
  }, [])
  return (
    <div aria-hidden="true" className="atmosphere">
      <DriftLayer speed={0.05} className="-z-10"><div className="atmo-field atmo-far" /></DriftLayer>
      <DriftLayer speed={0.16} className="-z-10"><div className="atmo-field atmo-near" /></DriftLayer>
    </div>
  )
}
