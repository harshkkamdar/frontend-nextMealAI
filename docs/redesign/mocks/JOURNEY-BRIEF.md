# FIQR journey mocks - shared brief (owner approved, 26 Oct 2026)

The owner wants "nothing but the best": deep, screen-by-screen design for FIQR in the chosen system, with many coded options where a decision is open, each measured, each with a recommendation. You own ONE journey (see your prompt). Read this whole file first.

## The chosen system (fixed; do not re-pick it)
- Direction: option 19 "Spatial Depth" (owner's favourite): layers of glass at real depths that drift at different speeds as you scroll, tilt toward the finger while pressed, sheets float forward while the screen behind steps back, pages open with the screen behind receding in depth (scale ~0.94, dim, slight blur) and a left-edge swipe back that tracks the finger. Tuned for daily use: quieter than the mock, smoother than the mock.
  Source: section id="o19" in /private/tmp/claude-501/-Users-veddsavla-Developer-clients-backend-nextMealAI/ff125286-6390-4d04-9945-37d8dfbeadb0/scratchpad/glass/group-d.html (generator build-d/build.mjs).
- Tab bar: option 01 "Minimise to Circle": Home/Food/Train/Geo glass capsule + separate + orb; on scroll down the capsule closes into one glass circle with the open tab's icon beside the orb; scroll up or tap the circle to expand. Source: section id="o01" in group-a.html (generator gen-a.mjs).
- Onboarding and login use Aurora fields (another agent owns those).
- A full app prototype in this system is being built at glass/spatial-app.html by another agent. If it exists when you start, reuse its kit (tokens, glass, depth push, sheet, tab bar code) so everything matches; if not, lift the code from o19 and o01 directly.
- Brand: cream #FDF6EC, ink #111C35, orange #E8622A (one primary action per screen max), white cards; macro hues protein ink, carbs teal #3E7C77, fat ochre #A07A3C, alpha tints only; Archivo (Google Fonts); light only inside the phone; no emoji icons; inline SVG icons.
- Signed decisions to respect unless your option explicitly challenges one (then label it "challenges <id>"): /Users/veddsavla/Developer/clients/frontend-nextMealAI/docs/redesign/decisions.md.

## Method (do these in order; the owner asked for depth, not volume)
1. Understand from raw material, not screenshots. For every route in your journey read the page in /Users/veddsavla/Developer/clients/frontend-nextMealAI/src/app/**, its components, the API calls it makes (src/lib/api/*), and the response types (src/types/*). For real data shapes and volumes read the backend read-only: /Users/veddsavla/Developer/clients/backend-nextMealAI/nextmealai/packages/core/src (controllers, orchestrator ops) and supabase/migrations for columns. Do NOT call any API, do NOT log in, do NOT write anything to either repo.
2. Screen card per route: who opens it, how often, the 1-3 jobs, every feature/button today, every state (first run, loading, empty, error, offline, long content, extreme numbers), and today's tap count for the main job (count from the code paths).
3. Rank decisions by impact x openness. For each open, high-impact element in your journey build 3 coded options (more if genuinely different and good), each with its trade-off in one line and one marked Recommended with the reason. Every other screen gets one recommended design.
4. Prototype in code with realistic data (from the types/backend, realistic volumes and long names). Every state in the state matrix gets designed (show them via a state switcher per phone). Run the break-ui skill's worst-case data idea on each screen.
5. Measure each option and print it under the phone: taps and estimated time for the main job vs today's app; tap targets >= 44 pt (count any below); one orange action max; frame timing (max rAF gap) for its push, scroll and sheet measured with Playwright.
6. Validation outside you: write a short first-click / 5-second test per open decision (task line + what counts as success) into the page, and a 5-user usability script for your journey (tasks, success criteria, notes columns).

## Skills and tools (use them; Skill tool or read ~/.agents/skills/<name>/SKILL.md)
impeccable, ui-ux-pro-max, frontend-design:frontend-design, web-design-guidelines, apple-design, animate, emil-design-eng, liquid-glass-design, animation-performance, break-ui, mobile-native; self-review motion with review-animations and fix what it flags. Libraries: only from cdnjs/jsdelivr/unpkg with exact versions if truly needed; prefer none.

## Output (a complete artifact page, one per journey)
Write ONE file at the path in your prompt. It is a page body for the Artifact tool:
- First lines: `<title>FIQR <Journey name></title>` and `<meta name="claude:viewport-fit-sides" content="cover">`, then the Archivo Google Fonts link, then one `<style>`.
- No <!doctype>, <html>, <head>, <body> tags. External scripts only from cdnjs/jsdelivr/unpkg pinned versions; everything else inline; no images except CSS/SVG/data URIs.
- Page chrome (not the phones) must be theme-aware: colour tokens on :root, redefined under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` and `:root[data-theme="dark"] {...}`, body background from a token, side gutter `padding-left: max(16px, env(safe-area-inset-left, 0px))` / right likewise, no horizontal page scroll at 390 px.
- Sections in this order: journey summary (jobs, flow map as a simple inline SVG or HTML diagram), screen cards, state matrix table, then one section per screen/element: its phones (300 x 640, live and interactive, state switcher), measurements, trade-offs, Recommended badge, and a Pick button per option. A pick tray like the existing page (copy picks to clipboard, localStorage wrapped in try/catch). Then the first-click tests and the usability script.
- All IDs and CSS scoped so many phones coexist (prefix per phone). Under 1.5 MB.
- Respect prefers-reduced-motion and prefers-reduced-transparency.

## Verify before reporting
Playwright (require('/Users/veddsavla/Developer/clients/frontend-nextMealAI/node_modules/playwright'), executablePath = Chrome for Testing in ~/Library/Caches/ms-playwright/chromium-1243): load the page at 1280 and 390 wide, 0 console errors, no horizontal scroll; screenshot every phone in key states; read the screenshots and fix what's off. Report: screens covered, open decisions with option names and the recommended one, measurements table, and screenshot folder. Do not publish; the coordinator publishes.

## Added mid-run: taste skill
Read ~/.agents/skills/design-taste-frontend/SKILL.md (its app-screens run) and references/app-screens.md, tells.md, motion.md, type.md, layout.md; apply its no-slop rules to your phones and self-check against tells.md before reporting. Do NOT run its scripts/assets.mjs (it downloads images from the web). Do NOT use the design-mobile-apps skill (it uploads designs to an outside service).

## Added mid-run: real-phone scale (owner feedback 26 Oct, 22:06)
The owner said the earlier mocks look gigantic: the tab bar and everything else were sized for a 390 pt phone but drawn inside a 300 px frame. Build every phone at a real iPhone's logical size, 390 x 844, with real iOS sizes (body 17, tab bar capsule 56 tall with 20 px icons and 10-11 px labels, orb 56, 16-20 px gutters), then show it scaled down with `transform: scale(var(--k))` on the phone (k = 300/390 on desktop grids, and fit-to-width on narrow screens) so proportions match a real iPhone. Keep the compact tab bar sizes above.

## Added mid-run: sizing spec (independent review, owner wants "a tad smaller"), overrides earlier sizes
At true 390 pt width: large title 30 (Archivo 800, font-stretch 100-105, not 110); hero number 24; card/section title 17-18; body 15-16 (line-height 1.35); caption 13, label 12; tab labels 11 (never 10); tile value 22-24; card padding 16 (tiles 14); gutters 16, feed gap 10; card radius 22 (tiles 20); tab bar capsule 52 tall, orb 52, icons 18-20; sheet radius 36-40, padding 8/16/20, grabber 36x5; list rows 56-60; buttons 50, chips 44; rings: hero 112, mid 84, mini 60; tile min-height 128; stepper 56; text fields 60. Every tappable thing stays >= 44 pt.
