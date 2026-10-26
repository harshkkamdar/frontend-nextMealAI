'use client'

import { useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
// shortcut: Next exposes no public API to keep an outgoing page rendered; this internal context is the known
// way (frozen router). Re-check it on every Next major upgrade.
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'framer-motion'
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

/** Keeps the outgoing page on the route it had, so it can finish its exit while the next page enters. */
function Frozen({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext)
  const [frozen] = useState(context)
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>
}

/**
 * Route change motion for the app shell. The outgoing page fades out over 120 ms while the next one enters, so
 * the two overlap and there is never a cream-only frame (motion-feel N6). Tabs are peers: a fade, no slide.
 * A pushed screen enters from 40 px right on the page spring; back enters from the left, the mirror.
 */
export function RouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const kind: Kind = TAB_ROOTS.has(pathname) ? 'tab' : backPending ? 'pop' : 'push'

  useEffect(() => { backPending = false }, [pathname])

  const transition = reduce ? reducedFade : kind === 'tab' ? { duration: 0.18, ease: 'easeOut' as const } : spring.page

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : ENTER[kind]}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: reduce ? 0.15 : 0.12, ease: 'easeIn' } }}
        transition={transition}
        className="w-full"
      >
        <Frozen>{children}</Frozen>
      </motion.div>
    </AnimatePresence>
  )
}
