// Native push and pop (motion-feel 3c "Native push"): Home -> Settings and back, a tab switch, and the edge swipe-back.
// Transitions: mock API plus a static export of out/, then
//   BASE_URL=http://localhost:<web> API_URL=http://localhost:<api> node scripts/redesign-transitions.mjs nav-push
//   python3 scripts/redesign-framediff.py docs/redesign/screens/nav-push/transitions

/** Before recording starts, open Settings from Home with a real in-app push, so Home sits under it in the stack. */
const openSettingsFirst = (page) => page.addInitScript(() => {
  if (location.pathname !== '/dashboard/' && location.pathname !== '/dashboard') return
  const tap = () => { const b = document.querySelector('[aria-label=Settings]'); if (b) b.click(); else setTimeout(tap, 100) }
  setTimeout(tap, 500)
})

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

const nav = {
  shots: [],
  transitions: [
    { name: 'push-home-to-settings', url: '/dashboard', home: 'returning', warm: '/settings', act: (p) => p.getByRole('button', { name: 'Settings' }).click() },
    { name: 'pop-settings-to-home', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => p.getByRole('button', { name: 'Back to Today' }).click() },
    { name: 'tab-home-to-food', url: '/dashboard', home: 'returning', warm: '/food', act: (p) => p.getByRole('link', { name: 'Food' }).click() },
    // Slow drag to 60% then lift: follows the finger, completes past 35%.
    { name: 'swipe-back-complete', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => edgeSwipe(p, 240, 24) },
    // Short drag to 25% then lift slowly: snaps back.
    { name: 'swipe-back-cancel', url: '/dashboard', home: 'returning', setup: openSettingsFirst, act: (p) => edgeSwipe(p, 100, 24, 24) },
  ],
}

export default nav
