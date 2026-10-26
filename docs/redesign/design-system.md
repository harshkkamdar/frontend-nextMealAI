# FIQR v2 design system (Phase 4)

24 Oct 2026. Direction C (Bento) with the critic-1 fixes, nav per D2-D4. Tokens live in `src/app/globals.css` (`@theme`), motion in `src/lib/motion.ts`, glass mode in `src/lib/platform/glass.ts`. Everything here is additive: screens not yet redesigned keep working on the old tokens until their slice lands.

## Colour

Only the four brand colours and the two macro colours, plus alpha tints of them (Q2).

| Token | Value | Use |
|---|---|---|
| `ink` | #111C35 | text, icons, protein, selected states |
| `accent` | #E8622A | the one primary action per screen; calories in charts (data, never next to an orange button in one card) |
| `cream` | #FDF6EC | page |
| `card` | #FFFFFF | cards, tiles, rows |
| `macro-teal` | #3E7C77 | carbs only |
| `macro-ochre` | #A07A3C | fat only |
| `ink-04` ... `ink-65` | ink at 4-65% | tracks, separators, secondary text (ink-65 is the floor for small text, 4.5:1 on cream and white) |
| `glass-fill` | white 72% | glass surfaces when glass is on |
| `glass-solid` | white 96% | the same surfaces when glass is off |

## Spatial sizing (SPATIAL-BUILD, 26 Oct 2026; supersedes the sizes below where they differ)

True 390 pt values from `mocks/journey-today.html`'s sizing spec. Tokens in `globals.css` `@theme`; every target stays 44 pt or more.

| Role | Token / utility | Value |
|---|---|---|
| Large title | `text-title` + `font-display` | 30, Archivo 800, stretch 102%, -0.02em |
| Hero number, page title | `text-hero` + `font-display` | 24, 800 (page titles 700) |
| Card title | `text-headline` | 18 / 700 (17-18) |
| Body | `text-body` / `text-body-sm` | 16 / 15, line height 1.35 |
| Caption | `text-caption` | 13 |
| Label | `text-label` | 12 / 600 |
| Tab label | `text-tab` | 11 |
| Gutter, feed gap | `px-gutter`, `--spacing-gutter` | 16, 10 |
| Card / tile radius | `rounded-card` / `rounded-bento` | 22 / 20; card padding 16, tile padding 14, tile min height `min-h-tile` 128 |
| Sheet radius | `rounded-sheet` | 38 (36-40) |
| List row | `min-h-row` | 58 (56-60) |
| Button | `h-btn` / `min-h-btn` | 50, capsule |
| Chip | `min-h-chip` | 44 |
| Stepper | `h-stepper` | 56 |
| Field | `h-field` | 60 |
| Rings | `size-ring` / `size-ring-md` / `size-ring-sm` | 112 / 84 / 60 |

Shared primitives in `src/components/ui/fiqr` (primary and secondary buttons, page header, chip, option rows, text field, metric tile, feature and action cards, section label) and the large-title header use these.

Reduced transparency: the system setting (`prefers-reduced-transparency`) or the native flag passed to `applyGlassMode(true)` sets `html[data-transparency="reduced"]` and glass off, and every glass surface is solid card or cream with no blur.

## Type (Archivo only, variable width axis)

Archivo is loaded with its `wdth` axis. Wide (`font-stretch: 112-118%`) is reserved for titles and hero numbers; everything else is normal width.

| Role | Size / line | Weight | Width | Notes |
|---|---|---|---|---|
| Hero number | 40/1 | 750 | 112% | tabular; the largest type on the screen (critic fix 4) |
| Large title | 32/1.1 | 750 | 118% | condenses to 17/600 inline title on scroll |
| Title 2 | 22/1.2 | 700 | 100% | sheet titles, onboarding questions use 30/1.15 750 118% |
| Tile value | 28/1 | 700 | 110% | tabular, unit at 14/600 ink-65 normal width |
| Body | 16/1.45 | 400 | 100% | Geo lines 15/1.45 |
| Label | 13/1.3 | 600 | 100% | sentence case, ink-65; no all-caps eyebrows |
| Caption | 12/1.3 | 500 | 100% | |

## Space, shape, depth

- 4 pt grid. Page gutter 16 pt for bento grids, 20 pt for text. Tile gap 10 pt. Section gap 24 pt.
- Radii (concentric): card 24, tile 22, row 16, control 14, capsule and round buttons full. Sheets 38 with an 8 pt inset.
- Shadow: one card token, `--shadow-card` `0 1px 2px ink/4%, 0 8px 24px ink/6%`. No borders on cards; selection is a 1.5 pt ink outline, never a fill. Motion-only: `--shadow-push` `-12px 0 32px ink/10%`, the left-edge shadow on the page in front of a push or pop slide (motion-feel 3c-native).
- Bottom clearance: content ends 106 pt + safe area above the bottom (`--tabbar-clearance`: 10 pt offset + 52 pt bar + 44 pt), so the tab bar never covers content at rest (critic fix 7).
- Tab bar (compact, iOS 26, owner ask 26 Oct 2026): capsule 52 pt tall with 4 pt glass padding, so the active pill and each tab link are 44 pt tall; orb and collapsed circle 52 pt; tab icons 20 pt, labels 11 pt; the bar sits 10 pt above the safe area. Every target stays 44 pt or more.

## Glass material (C1, Q3, Q14)

Glass on the controls layer: tab capsule, orb, floating header buttons, sheets, and the condensed top bar.

### Spatial atmosphere and card glass (differs: Q3, owner 27 Oct 2026)

The owner asked to see the tint and liquid glass of mock 19 (`mocks/spatial-app.html`) in the app, so Q3 (solid content cards) is relaxed:

- Atmosphere (`src/components/ui/fiqr/atmosphere.tsx`, mounted once in `src/app/(app)/layout.tsx`): mock 19's warm look behind every tab and pushed page. Far layer (drift 0.05x): a beige wash over the whole page (ochre into accent, 12-13%), a large peach field behind the content (accent 22%), teal mid right (14%, kept low so it never turns the beige grey) and an ochre hint top left. Near layer (drift 0.16x): the white glass slab behind the hero and an ochre slab. Each layer breathes on a slow transform-only loop (29-38 s), paused while the app is hidden. Painted once as SVG (`--atmo-far`, `--atmo-near`); nothing animates a blur.
- Secondary text: the `ink-65` token (and the text-secondary, text-tertiary, muted-foreground and info aliases) is ink at 76%, up from 65%, so secondary text keeps at least 5.5:1 on the strongest field. Measured per text node against the rendered pixels on Home, Food and Settings at 390 and 360.
- Pages: while the atmosphere is mounted (`html[data-atmosphere]`) the live page layer is transparent; a lifted layer (under a push, behind a sheet, in a tab fade) paints the same fields at its own scroll (`--lift-y`), so it keeps its tint as it steps back.
- Small coloured text (teal, ochre) on a glass card can drop under 4.5:1 over the fields; use ink text instead (Home weight delta, 27 Oct).
- Content cards: `card-glass` (`--surface-card` white 76%, `--shadow-card-glass`: 1 px white inner rim and top highlight, soft deep shadow). No backdrop blur on cards (cheap; the fields behind are already soft). Use `card-glass` instead of `bg-card shadow-[var(--shadow-card)]` for content cards on the page; inputs, sheet contents, menus and stacked cards (paywall) stay solid.
- Top bar: `glass-bar` (cream 72%, blur 16 saturate 1.7 when glass is on, fading out at its lower edge) appears once content scrolls under the large title.
- Reduced transparency (`data-transparency="reduced"` or the media query): no atmosphere, plain cream ground, solid white cards. Reduced motion: no drift, no ambient loop.
- Round header buttons: `glass-btn` (white 60%, blur 14 saturate 1.8, white top rim, soft drop) when glass is on; solid white otherwise.
- One orange action per screen and the ink orb are unchanged.

```
glass on:  background white/72%; backdrop-filter blur(20px) saturate(1.6);
           inset 0 1px 0 white/90% highlight; 0 8px 24px ink/10% shadow
glass off: background white/96% (sheets cream/98%); no backdrop-filter; same highlight and shadow
```

Mode is set once at start on `<html data-glass="on|off">`:
- off when `navigator.hardwareConcurrency <= 4` or `navigator.deviceMemory <= 4`
- off on iOS when Reduce Transparency is on (native check, local Capacitor plugin, slice 1)
- otherwise on

Never animate a blur value. Animate only `transform` and `opacity`.

### Measured on the low-end emulator (prototype `docs/redesign/proto/tab-bar.html`)

Device: AVD `fiqr_lowend` (Pixel 4a profile, 2 cores, 2 GB, Android 11), Chrome 91, the same engine version as the system WebView on that image. Benchmark per run: 4 s eased scroll, 6 tab switches, 4 sheet open/close pairs; janky = frames over 25 ms. Raw data: `docs/redesign/proto/bench-results.jsonl`.

| Glass mode | Runs | Scroll janky (median) | Worst stall | Tabs janky | Sheet janky (8 transitions) | Verdict |
|---|---|---|---|---|---|---|
| on (blur 20 + saturate) | 3 | 4 | **150-200 ms in 3/3 runs** | 0 | 2 | fails: visible freezes |
| lite (blur 10, opaque sheet) | 6 | 4 | 167 ms once; 2/6 runs badly janky | 1 | 2.5 | not reliable |
| off (opaque fallback) | 6 | 2 | 67 ms | 0.5 | 2.5 (< 1 per transition) | passes the rubric (<= 2 dropped per transition) |

Decision from the data: low-end Android ships with glass off, which the auto-detection already chooses (the emulator reported 2 cores and got `off` without a query flag). Glass on is unmeasured on mid-range Android and on iPhone; both are measured in slice 1 on the iOS simulator and, if available, a real mid-range phone. One noisy run (off, 22 janky) coincided with host load; emulator timings are a pessimistic proxy, not a device.

## Motion (Q13, framer-motion springs)

| Preset | Stiffness / damping | Use |
|---|---|---|
| `tap` | 500 / 35 | press feedback, chips, steppers |
| `sheet` | 320 / 32 | sheets, the + sheet, tab pill |
| `page` | 260 / 30 | in-page step changes (onboarding steps, plan builder steps) |
| `push` | 224 / 30 / 1, critically damped (zeta 1.0, response 0.42 s) | Spatial Depth push and pop between screens and the swipe-back release (SPATIAL-BUILD; motion-feel 3c-native) |
| `pushFlick` | 224 / 24.5 / 1 (zeta 0.82) | swipe-back released by a flick over 600 px/s: earned overshoot |
| `tab` | 500 / 45 / 1, critically damped | tab switch depth scale (0.975 to 1 in, 1 to 1.02 out) |
| `countUp` | 900 ms, ease-out cubic | hero and tile numbers, once per visit |
| `draw` | 700 ms, ease-out | ring and chart draw-in, once per visit |

Opacity-only fades use ease-out, never ease-in: the tab crossfade is new 180 ms ease-out over old 120 ms ease-out.

Reduced motion: every preset becomes a 150 ms opacity fade; count-ups jump to the final value.

## Components (built in slice order)

Tab bar (capsule + orb), round glass button, large-title header (condensing), hero ring card (ring, macro strips with targets, Geo line), metric tiles (steps bar, weight trend, sleep 7-night strip, water level), week strip with ticks, + sheet, inset sheet, row card, dashed empty slot, onboarding step shell (progress, back, question, why-line, fixed CTA), option card, ruler input, digit-tile timer, target-muscle map.
