'use client'

import { useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
// shortcut: Next exposes no public API to keep a page rendered after its route is left; these internal contexts
// are the known way (frozen router). Re-check them on every Next major upgrade.
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathParamsContext, PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { animate, motion, motionValue, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue, type Transition } from 'framer-motion'
import { hidesTabBar } from '@/components/layout/tab-bar'
import { isNative } from '@/lib/platform'
import { useSheetHeld, sheetDepth } from '@/lib/depth'
import { SWIPE_EDGE_PX, depthPair, reducedFade, sheetBehind, shouldCompleteSwipe, spring, SWIPE_SLOP_PX } from '@/lib/motion'
import { TAB_ROOTS, classifyNav, navHistory, stampHistory, type NavKind } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'

/** One mounted page. Only the top layer is live and in the document flow; the others are fixed, each at its own scroll. */
interface Layer {
  key: string
  scrollY: number
  /** Its height in the document flow, kept by a ResizeObserver while it is in the flow (the spacer stands in when lifted). */
  height: number
  /** Arrived by a slide: the slide is its entrance, so the page's own staggered entrance is skipped (globals.css). */
  slid?: boolean
  x: MotionValue<number>
  /** Depth scale from the push (behind pages step back, the front page grows in) and the tab crossfade. */
  scale: MotionValue<number>
  dim: MotionValue<number>
  opacity: MotionValue<number>
  /** Progress of the sheet this page sits behind (0..1); written only by the route frame, from the sheet depth. */
  sheet: MotionValue<number>
}

interface Step { kind: NavKind; top: Layer; old: Layer; settled: boolean }
/**
 * `front`: key of the page in front of a running slide (it carries the shadow); `moving`: a slide or fade is running;
 * `deep`: a push caught the page under it mid-slide, so the page below that one still shows until it is covered.
 */
interface Nav { stack: Layer[]; exiting: Layer[]; step: Step | null; front: string | null; moving: boolean; deep?: boolean }

const makeLayer = (key: string): Layer => ({ key, scrollY: 0, height: 0, x: motionValue(0), scale: motionValue(1), dim: motionValue(0), opacity: motionValue(1), sheet: motionValue(0) })

/**
 * How far the front page travels from covering the screen to gone: the width plus its left-edge shadow
 * (--shadow-push, -12 px offset and 32 px blur), so no shadow strip is left at the edge to vanish when the page drops.
 */
const travel = () => window.innerWidth + 44

/** A completed swipe ends off screen, where sub-pixel precision is invisible: rest sooner so the route commits sooner. */
const SETTLE_OFFSCREEN = { restDelta: 0.003, restSpeed: 0.15 }

/**
 * Places a push pair at progress p (Spatial Depth, motion.ts depthPair): 0 = top page covers the screen, 1 = top page
 * gone and the page under it at rest. `flat` (reduced motion): the top page only follows the finger, no depth.
 */
function setPair(top: Layer, under: Layer | undefined, p: number, flat = false) {
  const w = window.innerWidth
  const { front, behind } = depthPair(p)
  top.x.set(front.x * travel())
  top.scale.set(flat ? 1 : front.scale)
  if (under) {
    under.x.set(behind.x * w)
    under.scale.set(behind.scale)
    under.dim.set(behind.dim)
  }
}

/** Puts a page fully behind (where a push leaves the page it covers). */
function setBehind(layer: Layer) {
  const { behind } = depthPair(0)
  layer.x.set(behind.x * window.innerWidth)
  layer.scale.set(behind.scale)
  layer.dim.set(behind.dim)
}

/**
 * After a push or pop settles, focus moves to the new page (its h1, else its main landmark): the page that held focus
 * went inert, which drops focus to the body. Focus the user already placed elsewhere (tab bar, a sheet) is left alone.
 */
function focusPage(key: string) {
  const current = document.activeElement
  if (current && current !== document.body && !current.closest('[inert]')) return
  const page = document.querySelector<HTMLElement>(`[data-route="${key}"]`)
  const target = page?.querySelector<HTMLElement>('h1') ?? page?.querySelector<HTMLElement>('main') ?? page
  if (!target) return
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1
  target.focus({ preventScroll: true })
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
    setBehind(top)
    return { stack: [top], exiting: [...exiting, old], step: { kind, top, old, settled: false }, front: old.key, moving: true }
  }
  top.x.set(0)
  top.scale.set(1)
  top.dim.set(0)
  if (kind === 'tab') return { stack: [top], exiting: [...exiting, old], step: { kind, top, old, settled: false }, front: null, moving: true }
  return { stack: [...nav.stack, top], exiting, step: { kind, top, old, settled: false }, front: top.key, moving: true, deep: old.x.get() > 0 }
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

/**
 * A layer is lifted (fixed to the screen, scrolled inside itself) whenever it can move: under or leaving, while a slide
 * or fade runs on it, and while it sits behind a sheet. Scaling an in-flow page would scale about the middle of the
 * whole document and drag its fixed bars along; lifted, it scales about the screen's middle. Its fixed bars then ride
 * with its inner scroll, so `--lift-y` moves them back (globals.css). While the live page is lifted, the frame's spacer keeps the
 * document its height, so the window scroll (and the tab bar's minimise) never sees a jump.
 */
function PageLayer({ layer, role, navMoving, front, sheet, children }: { layer: Layer; role: Role; navMoving: boolean; front: boolean; sheet: boolean; children: ReactNode }) {
  const live = role === 'top'
  const show = role === 'buried' ? 'none' : role === 'covered' ? 'hidden' : 'visible'
  const moving = navMoving && show === 'visible'
  const lifted = !live || moving || sheet
  const ref = useRef<HTMLDivElement>(null)
  const wasLifted = useRef(false)
  // One writer for the page transform: the push or tab depth times the sheet depth.
  const y = useTransform(() => sheetBehind(layer.sheet.get()).y)
  const scale = useTransform(() => layer.scale.get() * sheetBehind(layer.sheet.get()).scale)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // A lifted layer shows the page where its user left it; display:none drops scrollTop, so reapply on show.
    if (lifted && show !== 'none') el.scrollTop = layer.scrollY
    if (live && !lifted && wasLifted.current) window.scrollTo(0, layer.scrollY)
    wasLifted.current = lifted
  }, [live, lifted, show, layer])
  // The flow height, measured without forcing layout; a lifted layer is screen-sized, so it is not measured then.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => { if (!el.hasAttribute('data-lifted')) layer.height = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight })
    ro.observe(el)
    return () => ro.disconnect()
  }, [layer])
  return (
    <motion.div
      ref={ref}
      inert={!live || undefined}
      aria-hidden={!live || undefined}
      style={{
        x: layer.x,
        y,
        scale,
        opacity: layer.opacity,
        // The page in front of a slide grows from its leading edge, so its left edge never pulls away from the finger.
        originX: front ? 0 : 0.5,
        display: show === 'none' ? 'none' : undefined,
        visibility: show === 'hidden' ? 'hidden' : undefined,
        willChange: moving || sheet ? 'transform, opacity' : undefined,
        boxShadow: front ? 'var(--shadow-push)' : undefined,
        ...(lifted ? ({ position: 'fixed', inset: 0, overflow: 'hidden', contain: 'paint', '--lift-y': `${layer.scrollY}px` } as CSSProperties) : null),
      }}
      data-route={layer.key}
      data-slid={layer.slid || undefined}
      data-lifted={lifted || undefined}
      className={cn('min-h-screen w-full bg-background', !hidesTabBar(layer.key) && 'pb-[var(--tabbar-clearance)]')}
    >
      <Freeze live={live}>{children}</Freeze>
      {/* The dim also rides on the live page while a pop uncovers it, so pop is the exact reverse of push. */}
      {(!live || moving) && <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[49] bg-ink" style={{ opacity: layer.dim }} />}
    </motion.div>
  )
}

/**
 * Route motion for the app shell, as a native navigation stack with Spatial Depth (SPATIAL-BUILD, motion-feel 3c). A
 * push slides the new page in from the right edge, growing from 0.97, while the old one steps back (scale 0.94, a
 * little left, under a light ink dim); pop is the exact reverse, and a swipe from the left edge drives the pop with the
 * finger. Pages stay mounted under the one that covers them, so going back keeps their state and scroll. Tabs are
 * peers: a quick depth crossfade, and the stack starts over. A sheet steps the live page back the same way (sheet depth).
 */
export function RouteFrame({ children }: { children: ReactNode }) {
  // The static export (trailingSlash) reports '/food/'; keys and TAB_ROOTS use '/food'.
  const pathname = usePathname().replace(/(.)\/$/, '$1')
  const reduce = useReducedMotion()
  // The touch handlers are bound once; they read the live preference from here.
  const reduceRef = useRef(reduce)
  useLayoutEffect(() => { reduceRef.current = reduce }, [reduce])
  const [nav, setNav] = useState<Nav>(() => ({ stack: [makeLayer(pathname)], exiting: [], step: null, front: null, moving: false }))
  const navRef = useRef(nav)
  const active = useRef<{ stop: () => void } | null>(null)

  const top = nav.stack[nav.stack.length - 1]
  if (top.key !== pathname) setNav(advance(nav, pathname))

  // The page a sheet opened over steps back with it until the sheet has closed (it stays that page through a push).
  // Reduced motion: no step back; the sheet's scrim is enough.
  const wantSheet = useSheetHeld() && !reduce
  const [sheetKey, setSheetKey] = useState<string | null>(null)
  if (wantSheet && sheetKey === null) setSheetKey(top.key)
  if (!wantSheet && sheetKey !== null) setSheetKey(null)
  const sheetKeyRef = useRef(sheetKey)

  useLayoutEffect(() => { navRef.current = nav }, [nav])

  // Sheet depth reaches the page only once it is lifted (this commit), so it never scales an in-flow page.
  useLayoutEffect(() => {
    const find = (key: string | null) => [...navRef.current.stack, ...navRef.current.exiting].find((l) => l.key === key)
    find(sheetKeyRef.current)?.sheet.set(0)
    sheetKeyRef.current = sheetKey
    find(sheetKey)?.sheet.set(sheetDepth.get())
    if (!sheetKey) return
    return sheetDepth.on('change', (v) => find(sheetKey)?.sheet.set(v))
  }, [sheetKey])

  // Track each page's scroll, so it can sit underneath (or come back) exactly where it was. A lifted page scrolls
  // inside itself, so the window's scroll says nothing about it then.
  useEffect(() => {
    const onScroll = () => {
      if (navRef.current.moving || sheetKeyRef.current) return
      const s = navRef.current.stack
      s[s.length - 1].scrollY = window.scrollY
    }
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
      if (active.current === entry) { active.current = null; setNav((n) => ({ ...n, front: null, moving: false, deep: false })) }
      done()
    }
    const controls = start()
    entry.stop = () => { controls.forEach((c) => c.stop()); finish() }
    active.current = entry
    void Promise.all(controls.map((c) => c.finished)).then(finish, finish)
  }

  /**
   * Springs a push pair from progress `from` to `to` on one spring, so both pages and the dim stay tied. The page
   * underneath starts where it is: one caught mid-slide (a push over a page still sliding in, a push during a pop)
   * keeps its offset from the pair geometry, and the offset shrinks to 0 as the spring arrives.
   */
  const slide = (t: Layer, under: Layer | undefined, from: number, to: number, velocity: number, transition: Transition = spring.push) => {
    const p = motionValue(from)
    const w = window.innerWidth
    const start = depthPair(from).behind
    const dx = under ? under.x.get() - start.x * w : 0
    const dScale = under ? under.scale.get() - start.scale : 0
    const dDim = under ? under.dim.get() - start.dim : 0
    const place = (v: number) => {
      setPair(t, under, v)
      if (!under || from === to || (dx === 0 && dScale === 0 && dDim === 0)) return
      const left = (v - to) / (from - to)
      under.x.set(under.x.get() + dx * left)
      under.scale.set(under.scale.get() + dScale * left)
      under.dim.set(under.dim.get() + dDim * left)
    }
    place(from)
    const unsub = p.on('change', place)
    const c = animate(p, to, { ...transition, velocity })
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
    const { kind, top: t, old } = step
    const land = () => { if (kind !== 'tab') focusPage(t.key) }
    if (step.settled) { land(); return }
    const drop = () => { setNav((n) => ({ ...n, exiting: n.exiting.filter((l) => l !== old || n.stack.includes(l)) })); land() }
    if (kind === 'tab' || reduce) {
      // Tabs, and every route change under reduced motion: overlapping crossfade, no slide (motion-feel 3b). Tabs add
      // depth: the new tab comes forward from 0.975, the old one passes the viewer to 1.02 as it fades (spatial mock).
      // A reduced push leaves the page underneath at rest (x 0), so a reduced pop uncovers it without a jump.
      if (kind === 'pop') { t.x.set(0); t.scale.set(1); t.dim.set(0) }
      if (kind !== 'pop') t.opacity.set(0)
      const depth = kind === 'tab' && !reduce
      if (depth) t.scale.set(0.975)
      run(() => [
        ...(kind === 'pop' ? [] : [animate(t.opacity, 1, reduce ? reducedFade : { duration: 0.18, ease: 'easeOut' as const })]),
        ...(depth ? [animate(t.scale, 1, spring.tab), animate(old.scale, 1.02, spring.tab)] : []),
        ...(kind === 'push' ? [] : [animate(old.opacity, 0, reduce ? reducedFade : { duration: 0.12, ease: 'easeOut' as const })]),
      ], drop)
      return
    }
    if (kind === 'push') { run(() => slide(t, old, 1, 0, 0), land); return }
    // Pop: start from wherever the leaving page is and with its velocity (an interrupted push reverses without a brick wall).
    run(() => slide(old, t, Math.max(0, old.x.get() / travel()), 1, old.x.getVelocity() / travel()), drop)
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
        // Vertical first (past the slop, so a wobble does not count) is a scroll and leftward is not a back swipe: let both go. Until the finger is past the slop the
        // gesture is undecided, and cancelling an early touchmove would kill the scroll for the whole gesture on iOS.
        if ((Math.abs(dy) > SWIPE_SLOP_PX && Math.abs(dy) > Math.abs(dx)) || dx < -SWIPE_SLOP_PX) { track = null; return }
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
      // Reduced motion: the page still follows the finger (direct manipulation), but nothing scales and the page under it stays at rest.
      const reduced = !!reduceRef.current
      setPair(t, reduced ? undefined : under, Math.max(0, track.base + dx) / travel(), reduced)
    }
    const onEnd = (e: TouchEvent) => {
      const done = track
      track = null
      if (!done?.dragging) return
      const { t, under } = pair()
      const w = window.innerWidth
      const v = e.timeStamp - done.t > 100 ? 0 : done.v
      const complete = shouldCompleteSwipe(done.base + done.x - done.x0, w, v)
      const reduced = reduceRef.current
      if (reduced && !complete) {
        // Reduced motion: no slide back; the page returns to rest at once.
        t.x.set(0)
        setNav((n) => ({ ...n, front: null, moving: false }))
        return
      }
      // Reduced motion completes with the short crossfade (motion-feel 3c-native) instead of the spring slide.
      // The release hands the finger's velocity to the spring; a flick (over 600 px/s) earns a slight overshoot.
      const release = reduced ? () => [animate(t.opacity, 0, reducedFade)] : () => slide(t, under, Math.max(0, done.base + done.x - done.x0) / travel(), complete ? 1 : 0, v / travel(), { ...(Math.abs(v) > 600 ? spring.pushFlick : spring.push), ...(complete ? SETTLE_OFFSCREEN : null) })
      run(release, () => {
        if (!complete) return
        // Keep the page underneath shown until the route commits, or the screen would flash empty.
        setNav((n) => ({ ...n, front: null, moving: true }))
        navHistory.swipeCommitted = true
        window.history.back()
        // No history to go back to (a cold deep link): put the page back instead of leaving it off screen. A popstate
        // means the back is under way and only the route commit is slow, so the page stays off and the commit lands as is.
        window.setTimeout(() => {
          if (!navHistory.swipeCommitted || navHistory.backPending || pair().t !== t) return
          navHistory.swipeCommitted = false
          setNav((n) => ({ ...n, front: t.key, moving: true }))
          if (reduced) { t.x.set(0); run(() => [animate(t.opacity, 1, reducedFade)], () => {}) }
          else run(() => slide(t, under, 1, 0, 0), () => {})
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
    if (i === underIndex - 1 && nav.moving && nav.deep) return 'under'
    return 'buried'
  }
  return (
    <>
      {[...nav.stack, ...nav.exiting].map((layer, i) => {
        return (
          <PageLayer key={layer.key} layer={layer} role={roleOf(layer, i)} navMoving={nav.moving} front={nav.front === layer.key} sheet={sheetKey === layer.key}>
            {children}
          </PageLayer>
        )
      })}
      {/* Rendered in the same commit that lifts the live page, so the document never shrinks and the scroll never clamps. */}
      <div aria-hidden="true" style={{ height: nav.moving || sheetKey === top.key ? Math.max(top.height, window.innerHeight) : 0 }} />
    </>
  )
}
