'use client'

import { useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
// shortcut: Next exposes no public API to keep a page rendered after its route is left; these internal contexts
// are the known way (frozen router). Re-check them on every Next major upgrade.
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathParamsContext, PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { animate, motion, motionValue, useReducedMotion, type AnimationPlaybackControls, type MotionValue } from 'framer-motion'
import { hidesTabBar } from '@/components/layout/tab-bar'
import { isNative } from '@/lib/platform'
import { PUSH_DIM, PUSH_PARALLAX, SWIPE_EDGE_PX, reducedFade, shouldCompleteSwipe, spring, SWIPE_SLOP_PX } from '@/lib/motion'
import { TAB_ROOTS, classifyNav, navHistory, stampHistory, type NavKind } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

/** One mounted page. Only the top layer is live and in the document flow; the others are fixed, each at its own scroll. */
interface Layer {
  key: string
  scrollY: number
  /** Arrived by a slide: the slide is its entrance, so the page's own staggered entrance is skipped (globals.css). */
  slid?: boolean
  x: MotionValue<number>
  dim: MotionValue<number>
  opacity: MotionValue<number>
}

interface Step { kind: NavKind; top: Layer; old: Layer; settled: boolean }
/** `front`: key of the page in front of a running slide (it carries the shadow); `moving`: a slide or fade is running. */
interface Nav { stack: Layer[]; exiting: Layer[]; step: Step | null; front: string | null; moving: boolean }

const makeLayer = (key: string): Layer => ({ key, scrollY: 0, x: motionValue(0), dim: motionValue(0), opacity: motionValue(1) })
/** Soft left-edge shadow on the page in front of a slide (ink 10%, Q2). */
const SHADOW = '-12px 0 32px rgba(17,28,53,0.10)'

/** Places a push pair at progress p: 0 = top page covers the screen, 1 = top page gone and the page under it at rest. */
function setPair(top: Layer, under: Layer | undefined, p: number) {
  const w = window.innerWidth
  top.x.set(p * w)
  if (under) {
    under.x.set(-PUSH_PARALLAX * w * (1 - p))
    under.dim.set(PUSH_DIM * (1 - p))
  }
}

/** The next nav state for a route change, decided during render so the old page never renders the new route. */
function advance(nav: Nav, to: string): Nav {
  const keys = nav.stack.map((l) => l.key)
  const old = nav.stack[nav.stack.length - 1]
  const { kind, index } = classifyNav(keys, to, navHistory.backPending)
  const exiting = nav.exiting.filter((l) => l.key !== to)
  // A page still fading or sliding out is reused, so a quick return keeps its state.
  const top = index >= 0 ? nav.stack[index] : nav.exiting.find((l) => l.key === to) ?? makeLayer(to)
  if (kind === 'pop' && index >= 0) {
    // After a completed swipe-back the leaving page is already off screen: drop it, nothing left to animate.
    if (navHistory.swipeCommitted && index === keys.length - 2) return { stack: nav.stack.slice(0, index + 1), exiting, step: { kind, top, old, settled: true }, front: null, moving: false }
    return { stack: nav.stack.slice(0, index + 1), exiting: [...exiting, old], step: { kind, top, old, settled: false }, front: old.key, moving: true }
  }
  top.opacity.set(1)
  if (kind !== 'tab') top.slid = true
  if (kind === 'pop') {
    top.x.set(-PUSH_PARALLAX * window.innerWidth)
    top.dim.set(PUSH_DIM)
    return { stack: [top], exiting: [...exiting, old], step: { kind, top, old, settled: false }, front: old.key, moving: true }
  }
  top.x.set(0)
  top.dim.set(0)
  if (kind === 'tab') return { stack: [top], exiting: [...exiting, old], step: { kind, top, old, settled: false }, front: null, moving: true }
  return { stack: [...nav.stack, top], exiting, step: { kind, top, old, settled: false }, front: top.key, moving: true }
}

/** The router contexts and page content a frozen layer keeps rendering. */
interface Kept { layout: unknown; pathname: unknown; search: unknown; params: unknown; content: ReactNode }

/** Keeps a page on the route and query it had when it stopped being the top page, so it can sit underneath or finish leaving. */
function Freeze({ live, children }: { live: boolean; children: ReactNode }) {
  const current: Kept = { layout: useContext(LayoutRouterContext), pathname: useContext(PathnameContext), search: useContext(SearchParamsContext), params: useContext(PathParamsContext), content: children }
  const [kept, setKept] = useState(current)
  if (live && (Object.keys(current) as (keyof Kept)[]).some((k) => current[k] !== kept[k])) setKept(current)
  const { layout, pathname, search, params, content } = live ? current : kept
  return (
    <LayoutRouterContext.Provider value={layout as never}>
      <PathnameContext.Provider value={pathname as never}>
        <SearchParamsContext.Provider value={search as never}>
          <PathParamsContext.Provider value={params as never}>{content}</PathParamsContext.Provider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </LayoutRouterContext.Provider>
  )
}

/**
 * A layer's part in the current frame: `top` is the live page; `leaving` is fading or sliding out; `under` is the page a
 * running slide uncovers or covers; `covered` sits under the top page at rest (kept painted-ready, invisible); `buried` is
 * two or more levels down (display none).
 */
type Role = 'top' | 'leaving' | 'under' | 'covered' | 'buried'

function PageLayer({ layer, role, navMoving, front, children }: { layer: Layer; role: Role; navMoving: boolean; front: boolean; children: ReactNode }) {
  const live = role === 'top'
  const show = role === 'buried' ? 'none' : role === 'covered' ? 'hidden' : 'visible'
  const moving = navMoving && show === 'visible'
  const ref = useRef<HTMLDivElement>(null)
  // A fixed layer shows the page where its user left it; display:none drops scrollTop, so reapply on show.
  useLayoutEffect(() => { if (!live && show !== 'none' && ref.current) ref.current.scrollTop = layer.scrollY }, [live, show, layer])
  return (
    <motion.div
      ref={ref}
      inert={!live || undefined}
      aria-hidden={!live || undefined}
      style={{
        x: layer.x,
        opacity: layer.opacity,
        display: show === 'none' ? 'none' : undefined,
        visibility: show === 'hidden' ? 'hidden' : undefined,
        willChange: moving ? 'transform, opacity' : undefined,
        boxShadow: front ? SHADOW : undefined,
      }}
      data-route={layer.key}
      data-slid={layer.slid || undefined}
      className={cn('min-h-screen w-full bg-background', !live && 'fixed inset-0 overflow-hidden', !hidesTabBar(layer.key) && 'pb-[var(--tabbar-clearance)]')}
    >
      <Freeze live={live}>{children}</Freeze>
      {/* The dim also rides on the live page while a pop uncovers it, so pop is the exact reverse of push. */}
      {(!live || moving) && <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[49] bg-ink" style={{ opacity: layer.dim }} />}
    </motion.div>
  )
}

/**
 * Route motion for the app shell, as a native navigation stack (motion-feel 3c). A push slides the new page in from
 * the right edge over the old one, which parallaxes to -30% under an ink dim; pop is the exact reverse, and a swipe
 * from the left edge drives the pop with the finger. Pages stay mounted under the one that covers them, so going back
 * keeps their state and scroll. Tabs are peers: a quick crossfade, and the stack starts over.
 */
export function RouteFrame({ children }: { children: ReactNode }) {
  // The static export (trailingSlash) reports '/food/'; keys and TAB_ROOTS use '/food'.
  const pathname = usePathname().replace(/(.)\/$/, '$1')
  const reduce = useReducedMotion()
  const [nav, setNav] = useState<Nav>(() => ({ stack: [makeLayer(pathname)], exiting: [], step: null, front: null, moving: false }))
  const navRef = useRef(nav)
  const active = useRef<{ stop: () => void } | null>(null)

  const top = nav.stack[nav.stack.length - 1]
  if (top.key !== pathname) setNav(advance(nav, pathname))

  useLayoutEffect(() => { navRef.current = nav }, [nav])

  // Track each page's scroll, so it can sit underneath (or come back) exactly where it was.
  useEffect(() => {
    const onScroll = () => { const s = navRef.current.stack; s[s.length - 1].scrollY = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /** Runs one transition; a newer one finishes the previous at once so nothing is left half-way. */
  const run = (start: () => AnimationPlaybackControls[], done: () => void) => {
    const previous = active.current
    active.current = null
    previous?.stop()
    let finished = false
    const entry = { stop: () => {} }
    const finish = () => {
      if (finished) return
      finished = true
      if (active.current === entry) { active.current = null; setNav((n) => ({ ...n, front: null, moving: false })) }
      done()
    }
    const controls = start()
    entry.stop = () => { controls.forEach((c) => c.stop()); finish() }
    active.current = entry
    void Promise.all(controls.map((c) => c.finished)).then(finish, finish)
  }

  /** Springs a push pair from progress `from` to `to` on one spring, so both pages and the dim stay tied. */
  const slide = (t: Layer, under: Layer | undefined, from: number, to: number, velocity: number) => {
    const p = motionValue(from)
    setPair(t, under, from)
    const unsub = p.on('change', (v) => setPair(t, under, v))
    const c = animate(p, to, { ...spring.push, velocity })
    void c.finished.then(unsub, unsub)
    return [c]
  }

  useLayoutEffect(() => {
    const step = nav.step
    stampHistory()
    if (!step) return
    navHistory.backPending = null
    navHistory.swipeCommitted = false
    window.scrollTo(0, step.top.scrollY)
    if (step.settled) return
    const { kind, top: t, old } = step
    const drop = () => setNav((n) => ({ ...n, exiting: n.exiting.filter((l) => l !== old || n.stack.includes(l)) }))
    if (kind === 'tab' || reduce) {
      // Tabs, and every route change under reduced motion: overlapping crossfade, no slide (motion-feel 3b).
      // A reduced push leaves the page underneath at rest (x 0), so a reduced pop uncovers it without a jump.
      if (kind === 'pop') { t.x.set(0); t.dim.set(0) }
      if (kind !== 'pop') t.opacity.set(0)
      run(() => [
        ...(kind === 'pop' ? [] : [animate(t.opacity, 1, reduce ? reducedFade : { duration: 0.18, ease: 'easeOut' as const })]),
        ...(kind === 'push' ? [] : [animate(old.opacity, 0, reduce ? reducedFade : { duration: 0.12, ease: 'easeOut' as const })]),
      ], drop)
      return
    }
    if (kind === 'push') { run(() => slide(t, old, 1, 0, 0), () => {}); return }
    // Pop: start from wherever the leaving page is and with its velocity (an interrupted push reverses without a brick wall).
    const w = window.innerWidth
    run(() => slide(old, t, Math.max(0, old.x.get() / w), 1, old.x.getVelocity() / w), drop)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per route change; run and slide are plain helpers
  }, [nav.step])

  // Interactive swipe-back from the left edge (motion-feel 3c). WKWebView's own back-forward swipe stays off (Capacitor
  // never enables allowsBackForwardNavigationGestures); iOS Safari in a browser owns that edge, so it is left alone there.
  useEffect(() => {
    if (!isNative() && /iPad|iPhone|iPod/.test(navigator.userAgent)) return
    /** `base`: where the page was when the finger caught it (0 at rest, more when a push is caught mid-slide). */
    let track: { x0: number; y0: number; x: number; t: number; v: number; dragging: boolean; base: number } | null = null
    const pair = () => { const s = navRef.current.stack; return { t: s[s.length - 1], under: s[s.length - 2] as Layer | undefined } }

    const onStart = (e: TouchEvent) => {
      track = null
      const { t, under } = pair()
      const touch = e.touches[0]
      if (e.touches.length !== 1 || !under || TAB_ROOTS.has(t.key) || touch.clientX > SWIPE_EDGE_PX) return
      // A push still sliding in can be caught (interruptible, as on iOS); a running pop or tab fade cannot.
      if (active.current && navRef.current.front !== t.key) return
      if (useUIStore.getState().activeSheet || (e.target as Element).closest?.('[data-vaul-drawer],[data-no-swipe-back]')) return
      track = { x0: touch.clientX, y0: touch.clientY, x: touch.clientX, t: e.timeStamp, v: 0, dragging: false, base: 0 }
    }
    const onMove = (e: TouchEvent) => {
      if (!track) return
      const touch = e.touches[0]
      const dx = touch.clientX - track.x0
      const dy = touch.clientY - track.y0
      if (!track.dragging) {
        // Vertical first is a scroll and leftward is not a back swipe: let both go. Until the finger is past the slop the
        // gesture is undecided, and cancelling an early touchmove would kill the scroll for the whole gesture on iOS.
        if (Math.abs(dy) > Math.abs(dx) || dx < -SWIPE_SLOP_PX) { track = null; return }
        if (dx < SWIPE_SLOP_PX || dx <= Math.abs(dy)) return
        track.dragging = true
        const caught = active.current
        active.current = null
        caught?.stop()
        track.base = Math.max(0, pair().t.x.get())
        const key = pair().t.key
        setNav((n) => ({ ...n, front: key, moving: true }))
      }
      // Committed as a rightward swipe: claim it before the page or a carousel starts panning.
      if (e.cancelable) e.preventDefault()
      const dt = e.timeStamp - track.t
      if (dt > 0) track.v = 0.8 * (((touch.clientX - track.x) / dt) * 1000) + 0.2 * track.v
      track.x = touch.clientX
      track.t = e.timeStamp
      const { t, under } = pair()
      setPair(t, under, Math.max(0, track.base + dx) / window.innerWidth)
    }
    const onEnd = (e: TouchEvent) => {
      const done = track
      track = null
      if (!done?.dragging) return
      const { t, under } = pair()
      const w = window.innerWidth
      const v = e.timeStamp - done.t > 100 ? 0 : done.v
      const complete = shouldCompleteSwipe(done.base + done.x - done.x0, w, v)
      run(() => slide(t, under, Math.max(0, done.base + done.x - done.x0) / w, complete ? 1 : 0, v / w), () => {
        if (!complete) return
        // Keep the page underneath shown until the route commits, or the screen would flash empty.
        setNav((n) => ({ ...n, front: null, moving: true }))
        navHistory.swipeCommitted = true
        window.history.back()
        // No history to go back to (a cold deep link): put the page back instead of leaving it off screen.
        window.setTimeout(() => {
          if (!navHistory.swipeCommitted || pair().t !== t) return
          navHistory.swipeCommitted = false
          setNav((n) => ({ ...n, front: t.key, moving: true }))
          run(() => slide(t, under, 1, 0, 0), () => {})
        }, 600)
      })
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const underIndex = nav.stack.length - 2
  const roleOf = (layer: Layer, i: number): Role => {
    if (layer === top) return 'top'
    if (i >= nav.stack.length) return 'leaving'
    if (i === underIndex) return nav.moving ? 'under' : 'covered'
    return 'buried'
  }
  return (
    <>
      {[...nav.stack, ...nav.exiting].map((layer, i) => {
        return (
          <PageLayer key={layer.key} layer={layer} role={roleOf(layer, i)} navMoving={nav.moving} front={nav.front === layer.key}>
            {children}
          </PageLayer>
        )
      })}
    </>
  )
}
