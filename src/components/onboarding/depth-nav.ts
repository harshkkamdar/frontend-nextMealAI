/**
 * Route changes inside onboarding (welcome, sign-in, setup) step in depth instead of sliding:
 * the screen you leave steps back and fades, the next one arrives from just in front. Only the content (`[data-depth]`)
 * moves; the back button, progress and CTA sit in the same place on every screen, so they stay put.
 * Leaving the flow for the app (`leaveOnboarding`) fades the whole screen over the app.
 */

/** 1 = forward (the old screen steps back), -1 = back (it comes toward you), 0 = in place (one card turns into the next). */
export type DepthDir = 1 | -1 | 0

let pending: DepthDir | null = null

/** The direction the screen now mounting arrived from, or null on a first paint. Read once per mount. */
export function arrivalDir(): DepthDir | null {
  return pending
}
/** Called after the arriving screen has committed. */
export function clearArrival() {
  pending = null
}

/** Behind (step back) and in front (come toward you) scales, the mock's 0.93 and 1.05. */
export const BEHIND = 0.94
export const FRONT = 1.05

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** A frozen copy of `el` laid over it: entrance animations stopped, typed values kept, no input. */
function freeze(el: HTMLElement, z: number): HTMLElement {
  const r = el.getBoundingClientRect()
  const copy = el.cloneNode(true) as HTMLElement
  copy.removeAttribute('data-page')
  copy.removeAttribute('data-depth')
  copy.setAttribute('aria-hidden', 'true')
  copy.inert = true
  const live = [el, ...el.querySelectorAll<HTMLElement>('*')]
  ;[copy, ...copy.querySelectorAll<HTMLElement>('*')].forEach((c, i) => {
    // A clone restarts CSS animations and transitions; pin each layer as it looks now (mid-loop, mid-fade, mid-tint).
    c.style.animation = 'none'
    c.style.transition = 'none'
    if (!live[i]) return
    const cs = getComputedStyle(live[i])
    if (cs.transform !== 'none' && c !== copy) c.style.transform = cs.transform
    if (c !== copy) c.style.opacity = cs.opacity
    c.style.backgroundColor = cs.backgroundColor
    c.style.color = cs.color
  })
  const fields = el.querySelectorAll('input, textarea')
  copy.querySelectorAll<HTMLInputElement>('input, textarea').forEach((f, i) => { f.value = (fields[i] as HTMLInputElement).value })
  Object.assign(copy.style, { position: 'fixed', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0', zIndex: String(z), pointerEvents: 'none', transform: 'none' })
  document.body.appendChild(copy)
  return copy
}

/**
 * Runs `then` on the frame after the route has swapped `el` out (or after 3 s, if the next route never loads).
 * `arrived`: wait until the next screen's element is in the document, not just until this one is gone (a gated layout
 * can render nothing for a moment while it loads).
 */
function afterSwap(el: Element, selector: string, then: () => void, arrived = false) {
  const from = location.pathname + location.search
  const started = performance.now()
  const wait = () => {
    const now = document.querySelector(selector)
    const swapped = arrived ? Boolean(now) && now !== el : !el.isConnected || now !== el || location.pathname + location.search !== from
    if (swapped || performance.now() - started > 3000) requestAnimationFrame(then)
    else requestAnimationFrame(wait)
  }
  requestAnimationFrame(wait)
}

/**
 * Navigate within onboarding with a depth step. `go` runs at once (it usually calls router.push).
 */
export function depthTo(go: () => void, dir: DepthDir = 1): void {
  const el = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-depth]') : null
  pending = dir
  if (!el || typeof el.animate !== 'function') return go()
  const r = el.getBoundingClientRect()
  const ghost = freeze(el, 1)
  ghost.style.transformOrigin = `50% ${Math.round(window.innerHeight * 0.42 - r.top)}px`
  // The back button, bars and CTA: the next screen's fade in underneath (page-in, 220 ms) while these hold, then these
  // fade. Controls both screens share never flicker; ones that differ (the welcome's dots, a CTA's fill) crossfade.
  const liveChrome = [...document.querySelectorAll<HTMLElement>('[data-chrome]')]
  // Each copy fades from the opacity its original had (a hidden CTA bar stays hidden, it does not flash in to fade out).
  const chrome = liveChrome.map((c) => ({ copy: freeze(c, 11), from: getComputedStyle(c).opacity }))
  // The copies stand in for the originals from here on; both at once would double every edge (text reads bolder).
  const originals = [el, ...liveChrome]
  for (const o of originals) o.style.visibility = 'hidden'
  go()
  const scale = dir === 1 ? BEHIND : dir === -1 ? FRONT : 1
  afterSwap(el, '[data-depth]', () => {
    for (const o of originals) o.style.visibility = '' // still here only if the next route never came
    // The outgoing screen is gone by just over half the step, so two screens' words never sit on top of each other.
    const frames = reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, offset: 0.55 }, { opacity: 0, transform: `scale(${scale})` }]
    ghost.animate(frames, { duration: reduced() ? 150 : 420, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove())
    for (const { copy: c, from } of chrome) c.animate([{ opacity: from }, { opacity: 0 }], { duration: 200, delay: reduced() ? 0 : 180, easing: 'ease-out', fill: 'both' }).finished.then(() => c.remove(), () => c.remove())
  }, true)
}

/** Leave onboarding for the app: the screen fades over the next page. */
export function leaveOnboarding(go: () => void): void {
  const page = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-page]') : null
  if (!page || typeof page.animate !== 'function') return go()
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, { position: 'fixed', inset: '0', zIndex: '60', pointerEvents: 'none', isolation: 'isolate' })
  document.body.appendChild(layer)
  layer.appendChild(freeze(page, 0))
  go()
  afterSwap(page, '[data-page]', () => {
    layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 150 : 220, easing: 'ease-out', fill: 'forwards' }).finished.then(() => layer.remove(), () => layer.remove())
  })
}
