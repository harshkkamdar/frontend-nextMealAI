'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import s from './aurora.module.css'

/** A field's offset from its base, in mock px (the mock phone is 300 wide, so 3 px = 1vw), its scale and opacity. */
type Field = [x: number, y: number, scale?: number, opacity?: number]
/** A slab's offset in mock px and its rotation in degrees. */
type Slab = [x: number, y: number, rotate: number]
interface Scene { f: [Field, Field, Field, Field]; s: [Slab, Slab] }

const REST: Field = [0, 0]
/** Scene positions from mocks/aurora-onboarding.html. Each step moves the fields, so the flow reads as one space. */
export const SCENES = {
  w0: { f: [[30, 50, 1.1], [0, 0, 1, 0.7], [0, 0, 1, 0.8], REST], s: [[0, 0, 18], [0, 0, -14]] },
  w1: { f: [[170, 250, 0.9, 0.6], [-40, -150, 1.15], [60, -40, 1, 0.7], REST], s: [[-14, 40, 26], [10, -20, -8]] },
  w2: { f: [[120, -40, 0.8, 0.5], [-150, -40, 1.25], [160, 20, 0.9, 0.6], REST], s: [[8, 90, 10], [20, -40, -20]] },
  w3: { f: [[190, 40, 0.9, 0.7], [-60, 120, 0.9, 0.6], [90, -170, 1.3], REST], s: [[-26, 20, 32], [30, -10, -4]] },
  form: { f: [[0, -40, 0.9, 0.55], [30, 170, 0.9, 0.45], [0, 50, 0.9, 0.45], REST], s: [[40, -50, 14], [-30, 70, -10]] },
  q0: { f: [[60, 20], [0, 60, 1, 0.6], [40, 0, 1, 0.6], REST], s: [[30, -30, 20], [-20, 60, -12]] },
  q1: { f: [[140, 60, 1, 0.7], [-60, 0, 1.1, 0.8], [60, -40, 1, 0.6], REST], s: [[14, -6, 28], [-6, 40, -18]] },
  q2: { f: [[80, 200, 1, 0.7], [-20, -80, 1, 0.7], [140, -120, 1.1, 0.8], REST], s: [[0, 20, 36], [10, 20, -24]] },
  plan: { f: [[110, 190, 1.2], [-130, 30, 1.2], [130, -140, 1.2], [0, -60, 1.3]], s: [[-30, 100, 44], [30, -90, -36]] },
  reveal: { f: [[80, 40, 1.25], [-40, 150, 1, 0.7], [110, -110, 1.15, 0.9], [0, -80, 1.2]], s: [[-6, -10, 24], [0, 30, -10]] },
} satisfies Record<string, Scene>

export type SceneName = keyof typeof SCENES

const QUESTION_SCENES = ['q0', 'q1', 'q2'] as const
/** Question steps take turns through three scenes, so every Continue moves the fields. */
export function questionScene(index: number): SceneName {
  return QUESTION_SCENES[((index % 3) + 3) % 3]
}

const SetScene = createContext<(scene: SceneName) => void>(() => {})

/** Puts the Aurora behind this screen into `scene` while the screen is shown. */
export function useAuroraScene(scene: SceneName) {
  const set = useContext(SetScene)
  useEffect(() => set(scene), [scene, set])
}

/** The translucent surface for cards that sit on the fields (solid white under reduced transparency). */
export const auroraSurface = s.surface

/**
 * Layout wrapper for sign-in and onboarding: plain cream (DESIGN.md: no decorative fields). The scene API is kept so
 * screens can still name their scene; nothing is drawn for it.
 */
export function AuroraLayout({ children }: { children: ReactNode; initial?: SceneName }) {
  return (
    <div className="relative min-h-dvh bg-cream">
      <SetScene.Provider value={noScene}>{children}</SetScene.Provider>
    </div>
  )
}

const noScene = () => {}
