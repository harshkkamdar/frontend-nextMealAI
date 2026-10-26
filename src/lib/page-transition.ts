/** Route changes crossfade instead of cutting, with no empty frame between screens (motion-feel.md N6, M3).
 *  `go` runs at once. A static copy of the current page (`[data-page]`) is laid over the screen and fades out over
 *  180 ms once the next page has replaced it, while the next page fades in on mount (`.page-in`), so exit and enter
 *  overlap. The copy takes no input. Reduced motion uses the same opacity-only fade at 150 ms. */
export function leaveThen(go: () => void): void {
  const page = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-page]') : null
  if (!page || typeof page.animate !== 'function') return go()
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const from = location.pathname + location.search
  const r = page.getBoundingClientRect()
  const ghost = page.cloneNode(true) as HTMLElement
  ghost.removeAttribute('data-page')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.inert = true
  // A clone replays CSS entrance animations (.page-in, .rise) and drops typed values; freeze it as it looks now.
  for (const el of [ghost, ...ghost.querySelectorAll<HTMLElement>('*')]) el.style.animation = 'none'
  const fields = page.querySelectorAll('input, textarea')
  ghost.querySelectorAll<HTMLInputElement>('input, textarea').forEach((f, i) => { f.value = (fields[i] as HTMLInputElement).value })
  Object.assign(ghost.style, { position: 'fixed', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0', zIndex: '60', pointerEvents: 'none' })
  document.body.appendChild(ghost)
  go()
  const started = performance.now()
  const fade = () => ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 150 : 180, easing: 'ease-out', fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove())
  // Hold the copy until the next page is in the DOM (route code may still be loading), then fade it on the next frame.
  const wait = () => {
    const swapped = !page.isConnected || document.querySelector('[data-page]') !== page || location.pathname + location.search !== from
    if (swapped || performance.now() - started > 3000) requestAnimationFrame(fade)
    else requestAnimationFrame(wait)
  }
  requestAnimationFrame(wait)
}
