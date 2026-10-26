/**
 * Tab bar minimise-on-scroll recordings (motion-feel 3j). Loaded by scripts/redesign-transitions.mjs:
 *   node scripts/redesign-mock-api.mjs 4061
 *   NEXT_PUBLIC_TARGET=capacitor NEXT_PUBLIC_CORE_API_URL=http://localhost:4061 npx next build, serve out/ on :3061
 *   BASE_URL=http://localhost:3061 API_URL=http://localhost:4061 node scripts/redesign-transitions.mjs tabbar-minimise
 *   python3 scripts/redesign-framediff.py docs/redesign/screens/tabbar-minimise/transitions
 */

// Starts the page scrolled (so the bar is already collapsed) before recording begins.
// Two steps after hydration, so the bar sees a downward scroll past the threshold.
const startScrolled = (page) => page.addInitScript(() => addEventListener('load', () => { setTimeout(() => scrollTo(0, 300), 500); setTimeout(() => scrollTo(0, 600), 700) }))

const transitions = [
  { name: 'collapse-scroll-down', url: '/dashboard/', home: 'returning', act: async (p) => { await p.mouse.move(195, 400); for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 15); await p.waitForTimeout(16) } } },
  // Train: the open tab's icon travels the furthest into the circle.
  { name: 'collapse-train', url: '/train/', home: 'returning', act: async (p) => { await p.mouse.move(195, 400); for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 15); await p.waitForTimeout(16) } } },
  { name: 'expand-scroll-up', url: '/dashboard/', home: 'returning', setup: startScrolled, act: async (p) => { await p.mouse.move(195, 400); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -6); await p.waitForTimeout(16) } } },
  { name: 'expand-tap', url: '/dashboard/', home: 'returning', setup: startScrolled, act: (p) => p.getByRole('button', { name: 'Show tabs, Home' }).click() },
]

const tabbarMinimise = { shots: [], transitions }
export default tabbarMinimise
