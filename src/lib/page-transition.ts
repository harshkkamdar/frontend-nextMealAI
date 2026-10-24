/** Route changes fade through cream instead of cutting: the current page (`[data-page]`) fades out, then `go` runs
 *  and the next page fades in on mount (`.page-in`). Reduced motion navigates at once. */
export function leaveThen(go: () => void): void {
  const page = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-page]') : null
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!page || reduce || typeof page.animate !== 'function') return go()
  page.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' }).finished.then(go, go)
}
