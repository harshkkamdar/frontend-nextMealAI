// Spatial Depth kit (SPATIAL-BUILD slice K): depth push and pop, swipe-back, tab depth crossfade, sheets stepping the
// screen back, and the tab bar collapse. Mock API plus a static export of out/, then
//   BASE_URL=http://localhost:<web> API_URL=http://localhost:<api> node scripts/redesign-transitions.mjs spatial-kit
//   python3 scripts/redesign-framediff.py docs/redesign/screens/spatial-kit/transitions

/** Before recording starts, open Settings from Home with a real in-app push, so Home sits under it in the stack. */
const openSettingsFirst = (page) => page.addInitScript(() => {
  if (location.pathname !== '/dashboard/' && location.pathname !== '/dashboard') return
  const tap = () => { const b = document.querySelector('[aria-label=Settings]'); if (b) b.click(); else setTimeout(tap, 100) }
  setTimeout(tap, 500)
})

/** Before recording starts, open the weight quick-log sheet from Home's Weight tile. */
const openWeightFirst = (page) => page.addInitScript(() => {
  if (!location.pathname.startsWith('/dashboard')) return
  const tap = () => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent ?? '').startsWith('Weight')); if (b) b.click(); else setTimeout(tap, 100) }
  setTimeout(tap, 600)
})

/** Home scrolled 320 px before recording, so the page behind a push has its fixed bar showing (lifted layer check). */
const homeScrolled = (page) => page.addInitScript(() => addEventListener('load', () => { setTimeout(() => scrollTo(0, 160), 500); setTimeout(() => scrollTo(0, 320), 700) }))

/** One finger from the left edge to `toX` over `steps` frames, then lifted (CDP touch, so it is a real touch stream). */
async function edgeSwipe(page, toX, steps, frameMs = 16) {
  const cdp = await page.context().newCDPSession(page)
  const y = 420
  const at = (x) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(6) })
  for (let s = 1; s <= steps; s++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(6 + ((toX - 6) * s) / steps) })
    await page.waitForTimeout(frameMs)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/** `steps` wheel ticks of `dy` px, one per frame, from the middle of the screen. */
const wheel = async (p, dy, steps) => { await p.mouse.move(195, 400); for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(16) } }

const kit = {
  shots: [],
  transitions: [
    { name: 'push-home-to-settings', url: '/dashboard', home: 'returning', warm: '/settings', act: (p) => p.getByRole('button', { name: 'Settings' }).click() },
    { name: 'push-from-scrolled-home', url: '/dashboard', home: 'returning', warm: '/settings', setup: homeScrolled, act: (p) => p.getByRole('button', { name: 'Settings' }).click() },
    { name: 'pop-settings-to-home', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => p.getByRole('button', { name: 'Back to Today' }).click() },
    // Slow drag to 62% then lift: follows the finger, completes past half.
    { name: 'swipe-back-complete', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => edgeSwipe(p, 240, 24) },
    // Short slow drag to 26% then lift: snaps back.
    { name: 'swipe-back-cancel', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => edgeSwipe(p, 100, 24, 24) },
    // Short fast flick (about 1,100 px/s): completes by momentum projection.
    { name: 'swipe-back-flick', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => edgeSwipe(p, 110, 6) },
    { name: 'tab-home-to-food', url: '/dashboard', home: 'returning', warm: '/food', act: (p) => p.getByRole('link', { name: 'Food' }).click() },
    { name: 'sheet-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: /^Weight/ }).click() },
    { name: 'sheet-close', url: '/dashboard', home: 'returning', setup: openWeightFirst, act: (p) => p.keyboard.press('Escape') },
    { name: 'plus-open', url: '/dashboard', home: 'returning', act: (p) => p.getByRole('button', { name: 'Log something' }).click() },
    { name: 'tabbar-collapse', url: '/dashboard/', home: 'returning', act: (p) => wheel(p, 15, 30) },
  ],
}

export default kit
