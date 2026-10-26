// Slice 1c: the welcome stage rebuild (motion-feel.md 3a) and the overlapping leaveThen route change.
// Shots: node scripts/redesign-capture.mjs slice-1c   Transitions: node scripts/redesign-transitions.mjs slice-1c

/** Settle the stage on slide i with the arrow keys (the stage has no scroll position to set). */
async function slideTo(page, i) {
  const stage = page.getByLabel('What FIQR does')
  await stage.focus()
  for (let n = 0; n < i; n++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120) }
  await stage.evaluate((el) => el.blur()) // keyboard drove it; drop the focus ring from the still
  await page.waitForTimeout(2400)
}

/** Pointer drag on the stage: from x0 to x1 in `steps` moves `ms` apart, optionally dragging back to `back` before release. */
async function drag(page, x0, x1, steps, ms, { back = null } = {}) {
  const y = 470
  await page.mouse.move(x0, y)
  await page.mouse.down()
  for (let s = 1; s <= steps; s++) { await page.mouse.move(x0 + ((x1 - x0) * s) / steps, y); await page.waitForTimeout(ms) }
  if (back !== null) for (let s = 1; s <= steps; s++) { await page.mouse.move(x1 + ((back - x1) * s) / steps, y); await page.waitForTimeout(ms) }
  await page.mouse.up()
}

/** A flick dispatched inside the page on a 16 ms timer, so a loaded machine's slow CDP round trips cannot turn it into a slow drag. */
function flick(page, x0, x1, steps) {
  return page.evaluate(([x0, x1, steps]) => new Promise((done) => {
    const el = document.querySelector('[aria-roledescription=carousel]')
    const ev = (type, x) => (type === 'pointerdown' ? el : window).dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 470, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, bubbles: true }))
    ev('pointerdown', x0)
    let s = 0
    const id = setInterval(() => {
      s += 1
      const x = x0 + ((x1 - x0) * s) / steps
      ev('pointermove', x)
      if (s === steps) { clearInterval(id); ev('pointerup', x); done() }
    }, 16)
  }), [x0, x1, steps])
}

const slice = {
  shots: [
    ...[0, 1, 2, 3].map((i) => ({ name: `welcome-${i + 1}`, url: '/welcome', guest: true, act: (p) => slideTo(p, i) })),
    { name: 'welcome-offline', url: '/welcome', guest: true, offline: true },
    // Mid-drag still: both neighbours on screen at about 30% (reduced motion in captures, so opacity only).
    { name: 'welcome-mid-drag', url: '/welcome', guest: true, act: async (p) => { await p.mouse.move(330, 470); await p.mouse.down(); for (let s = 1; s <= 20; s++) { await p.mouse.move(330 - s * 9.75, 470); await p.waitForTimeout(16) } await p.waitForTimeout(300) } },
  ],
  transitions: [
    { name: 'welcome-first-paint', url: '/signup', guest: true, act: (p) => p.goto(new URL('/welcome', p.url()).href) },
    // Slow scrub: finger past mid-stage (about 0.6), drift back past halfway, release with almost no velocity (settles back on slide 1).
    { name: 'welcome-drag-scrub', url: '/welcome', guest: true, act: (p) => drag(p, 330, 100, 40, 16, { back: 260 }) },
    // Scrub forward past halfway and release slowly: settles on slide 2 with the drag velocity handed to the spring.
    { name: 'welcome-drag-release', url: '/welcome', guest: true, act: (p) => drag(p, 340, 110, 36, 16) },
    // Short fast flick (80 px in 3 moves, about 1,600 px/s): exactly one slide. Slower input (under 500 px/s) settles back, by design.
    { name: 'welcome-flick', url: '/welcome', guest: true, act: (p) => flick(p, 300, 220, 3) },
    // Hard flick (240 px in 3 moves, about 5,000 px/s): still exactly one slide.
    { name: 'welcome-hard-flick', url: '/welcome', guest: true, act: (p) => flick(p, 340, 100, 3) },
    // Rubber band: pull right on the first slide, release.
    { name: 'welcome-rubber-band', url: '/welcome', guest: true, act: (p) => drag(p, 80, 330, 30, 16) },
    { name: 'welcome-continue', url: '/welcome', guest: true, act: (p) => p.getByRole('button', { name: 'Continue' }).click() },
    // Double tap mid-flight: the second tap retargets from the live value (N11).
    { name: 'welcome-double-continue', url: '/welcome', guest: true, act: async (p) => { const b = p.getByRole('button', { name: 'Continue' }); await b.click(); await p.waitForTimeout(90); await b.click() } },
    { name: 'welcome-last', url: '/welcome', guest: true, act: async (p) => { await slideTo(p, 2); await p.getByRole('button', { name: 'Continue' }).click() } },
    { name: 'welcome-to-signup', url: '/welcome', guest: true, warm: '/signup', act: async (p) => { await slideTo(p, 3); await p.getByRole('button', { name: 'Get started' }).click() } },
    { name: 'welcome-to-login', url: '/welcome', guest: true, warm: '/login', act: (p) => p.getByRole('button', { name: 'I have an account' }).click() },
    { name: 'login-to-welcome', url: '/login', guest: true, warm: '/welcome', act: (p) => p.getByRole('button', { name: 'Back' }).click() },
  ],
}

export default slice
