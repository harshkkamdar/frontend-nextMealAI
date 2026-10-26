'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion, type TargetAndTransition } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'

const TAB_ROOTS = new Set(['/dashboard', '/food', '/train', '/chat'])

type Kind = 'tab' | 'push' | 'pop'

/** Browser back/forward sets this until the next route commits, so pops mirror pushes (motion-feel 3c). */
let backPending = false
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { backPending = true })

const ENTER: Record<Kind, TargetAndTransition> = {
  tab: { opacity: 0 },
  push: { opacity: 0, x: 40 },
  pop: { opacity: 0, x: -24, scale: 0.97 },
}

/**
 * Route change motion for the app shell. Tabs are peers: the new page fades in over 160 ms with no slide.
 * A pushed screen enters from 40 px right on the page spring; back enters from the left, the mirror.
 * The old page unmounts at once (App Router), so there is never an empty frame between screens.
 */
export function RouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  // The screen the app opened on paints at rest; only later navigations animate.
  // shortcut: returning to that same screen later also paints at rest; track a navigation count if that ever matters.
  const [openedOn] = useState(pathname)
  const first = pathname === openedOn

  const kind: Kind = TAB_ROOTS.has(pathname) ? 'tab' : backPending ? 'pop' : 'push'

  useEffect(() => { backPending = false }, [pathname])

  const transition = reduce ? reducedFade : kind === 'tab' ? { duration: 0.16, ease: 'easeOut' as const } : spring.page

  return (
    <motion.div
      key={pathname}
      initial={first ? false : reduce ? { opacity: 0 } : ENTER[kind]}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}
