# FIQR v2 motion and feel spec

26 Oct 2026. Binding for every screen, sheet and state in the redesign. It sits next to `design-system.md` and extends its "Motion" section. If the two disagree, this file wins for motion and that file wins for colour, type and glass values.

Why it exists: the owner's review of `/welcome` (slice 1b) said it is "static, not too fluid", "PowerPoint slides moving left to right, not fading in and out", "not liquid glass", "looks like AI slop". The carousel is a horizontal `scroll-snap` pager, its text and bentos play one shared 14 px fade-up (`.rise`), and its dots animate `width`. That is a deck, not an interface. This spec says what the feel is (WHAT), what it must never look like (WHAT NOT), how to build it in our stack (HOW), the traps to avoid (HOW NOT), and how to grade it (checklist).

Evidence base: 101 reference stills (Bevel IMG_6856-6918, Cal AI IMG_6818-6855). No screen recordings exist in the inspiration folder, so no reference durations or easing could be measured. Every number below comes from Apple's own guidance, the source code of libraries we ship (vaul 1.1.2, framer-motion 12), or our own low-end Android measurements. Each number is a starting value; the checklist ranges are what is graded.

Hard constraints (from `decisions.md`, `design-system.md`, `AGENTS.md`):
- Animate `transform` and `opacity` only. Never animate `filter`, `backdrop-filter`, `width`, `height`, `top`, `left`, `margin`, `box-shadow` or `border-radius`. One bounded exception (section 3f): SVG `stroke-dashoffset` on rings and lines no larger than 200 x 200 px.
- Glass (`backdrop-filter`) only on the controls layer (C1, Q3), never animated, off on low-end (`html[data-glass="off"]`, set by `src/lib/platform/glass.ts`).
- 60 fps on the 2-core `fiqr_lowend` emulator: no frame over 16.7 ms, at most 2 dropped frames per transition (rubric item 5).
- Reduced motion: every movement becomes a 150 ms opacity fade, and count-ups jump to the final value (`reducedFade` in `src/lib/motion.ts`).
- Colours: `#111C35`, `#E8622A`, `#FDF6EC`, `#FFFFFF` and their alpha tints, plus macro teal and ochre for carbs and fat only. Archivo only.

## 1. WHAT: the feel (7 principles)

1. **Continuity: nothing teleports.** Every element that exists before and after a change moves, morphs or crossfades into its new state. Apple: "As you go between states in an app, Liquid Glass dynamically morphs between the controls in each context ... as the controls continually shape shift" ([WWDC25 219](https://developer.apple.com/videos/play/wwdc2025/219/)). Reference: Bevel IMG_6867 was captured mid tab switch; the selection lens is caught between Journal and Fitness and magnifies the labels it crosses. The pill travels; it does not jump.
2. **The finger drives, the spring finishes.** During a drag the content follows the finger 1:1. On release, a spring takes over at the finger's velocity. Apple: "One-to-one tracking is extremely important. When swiping or dragging, the contents should stay attached to the gesture" and "remember to project momentum" ([WWDC18 803](https://developer.apple.com/videos/play/wwdc2018/803/)). Springs "are the only type of animation that maintains continuity both for static cases and cases with an initial velocity" ([WWDC23 10158](https://developer.apple.com/videos/play/wwdc2023/10158/)).
3. **Interruptible always.** Any motion can be grabbed, reversed or replaced mid-flight, and it carries its current velocity into the new target. Apple: "Let people cancel motion ... don't make people wait for an animation to complete" ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
4. **Depth, not distance.** Screens change through scale, opacity and small offsets (8-48 px), not through full-width slides. A stage stays put and its layers trade places. Reference: Bevel IMG_6857-6859 keep the title, bento area, dots and Continue at identical positions on every slide, so it reads as one fixed stage whose contents change. Bevel IMG_6886 floats its feature cards at different tilts and depths; the layers are what move.
5. **Choreography with a lead.** One element leads (the hero or the touched element). Others follow in 25-40 ms steps, and each layer has its own distance and timing. Reference: the + hub in Bevel IMG_6912-6913 grows from the orb, so the orb leads and the grid follows. Uniform motion means nothing leads.
6. **Material that responds.** Glass controls react to touch: they lift, glow from the fingertip and settle. They never fade in like a slide. Apple: "Liquid Glass responds to interaction by instantly flexing and energizing with light" and "Instead of fading, Liquid Glass objects materialize in and out" ([WWDC25 219](https://developer.apple.com/videos/play/wwdc2025/219/)). Reference: Bevel IMG_6911 shows the pressed tab lens swelling past the capsule edge.
7. **Brief, precise, earned.** Feedback is short and tied to an action. Frequent interactions get almost no motion. Apple: "Don't add motion for the sake of adding motion" and "generally avoid adding motion to UI interactions that occur frequently" ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)). Cal AI IMG_6818-6835: the back button, progress bar and Continue never move between questions; only the question changes, and the progress bar grows.

## 2. WHAT NOT: deck and AI-slop tells

Each tell has a detection rule that runs on a 60 fps frame dump (`ffmpeg -i rec.mov -vf fps=60 f/%04d.png`) or on a single screenshot.

| # | Tell | Detect it |
|---|---|---|
| N1 | Whole-screen horizontal paging as the transition (the current `/welcome`) | Frames where more than 60% of the screen's columns shift by the same dx at once. Any element translating more than 64 px horizontally outside a drag fails. |
| N2 | Linear or ease-in-out tweens on movement | Plot an element's position over frames: symmetric S-curves, or constant per-frame deltas, mean a tween. A spring's velocity peaks in the first 25% of the movement. |
| N3 | Everything starts at once | 5 or more elements begin moving in the same frame. |
| N4 | One uniform fade-up on every element (`.rise` everywhere) | All entering elements share the same dy and duration within 1 frame. |
| N5 | Bounce for its own sake | Overshoot greater than 4% of the travel distance on anything not released by a gesture with velocity. More than 1 visible oscillation anywhere. |
| N6 | Dead frame between screens (fade out, then fade in) | 2 or more consecutive frames that show only cream between two screens. This is how `leaveThen` works today. |
| N7 | Glows, gradient sweeps, coloured shadows, shimmering highlights | In a screenshot: any hue outside the palette, any shadow tinted other than ink, any moving gradient band. |
| N8 | Spinner for data the user has already seen | A spinner or skeleton frame on a revisit while the cache holds data (Q21). |
| N9 | Layout jumps | Elements outside the animated element shift between consecutive frames after first paint (E3 pop rule: more than 8% of changed pixels in one frame). |
| N10 | Hard cut of a persistent element | The tab pill, a header title or a card disappears in one frame and reappears elsewhere. |
| N11 | Non-interruptible motion | Tap Continue twice fast, or reverse a drag mid-settle: the second input waits, or the element snaps to the end first. |
| N12 | Slow decorative loops | Ambient motion that cycles at about 0.2 Hz. Emil Kowalski's apple-design skill flags loops "near one cycle per 5 seconds" as uncomfortable ([skill](https://github.com/emilkowalski/skills/tree/main/skills/apple-design)). Ambient mist moves only when the user moves it. |

## 3. HOW: recipes per pattern

### Presets (replace the body of `src/lib/motion.ts`; existing names keep their values)

| Preset | framer `stiffness/damping/mass` | Damping ratio | Apple "response" | Use |
|---|---|---|---|---|
| `tap` | 500 / 35 / 1 | 0.78 | 0.28 s | press release, chips, steppers |
| `glide` (new) | 300 / 35 / 1 | 1.0 (critical) | 0.36 s | stage scrub settle, repositioning, list entrance |
| `lens` (new) | 380 / 33 / 1 | 0.85 | 0.32 s | tab lens, orb morph: small, earned overshoot (bounce of about 0.15) |
| `sheet` | 320 / 32 / 1 | 0.89 | 0.35 s | sheets, + surface |
| `page` | 260 / 30 / 1 | 0.93 | 0.39 s | push and pop |

Damping ratio = d / (2 * sqrt(k * m)). Start critical, and add bounce only when a gesture with momentum ends ([WWDC18 803](https://developer.apple.com/videos/play/wwdc2018/803/): "we recommend starting with 100% damping"; "if the gesture ... has momentum, then you should reward that momentum with a little bit of overshoot"). Never go above a bounce of 0.4 ([WWDC23 10158](https://developer.apple.com/videos/play/wwdc2023/10158/): "cautious about using values higher than around 0.4"). Durations: tweens are allowed only for count-ups (900 ms ease-out cubic), draws (700 ms) and opacity-only fades (120-200 ms ease-out). Never use ease-in or ease-in-out on movement.

Shared helpers (add to `motion.ts`, with a unit test):
```ts
// Apple/Emil projection: where a flick would come to rest (px). rate .998 = iOS normal scroll deceleration.
export const project = (vPxPerS: number, rate = 0.998) => ((vPxPerS / 1000) * rate) / (1 - rate)
// iOS rubber-band: resistance grows with overshoot; c = .55.
export const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over))
```

### 3a. Welcome carousel: a fixed stage, scrubbed by the finger

Rebuild `welcome-carousel.tsx` with no scroll container. The four slides are absolutely stacked in one stage. A single motion value `p` (0..3, fractional mid-drag) drives everything through `useTransform`, so React re-renders only when the settled index changes.

```tsx
const p = useMotionValue(0)                       // slide position, fractional while dragging
const W = stageWidth                              // measured once per resize
function onPan(_: PointerEvent, i: PanInfo) {     // framer onPan, after 10 px hysteresis (onPanStart)
  let next = start - i.offset.x / W
  if (next < 0) next = -rubberband(-next * W, W) / W
  if (next > 3) next = 3 + rubberband((next - 3) * W, W) / W
  p.set(next)
}
function onPanEnd(_: PointerEvent, i: PanInfo) {
  const landing = p.get() - project(i.velocity.x) / W
  const target = clamp(Math.round(landing), start - 1, start + 1, 0, 3)  // one slide per flick
  animate(p, target, { ...spring.glide, velocity: -i.velocity.x / W })  // velocity hand-off
  if (target !== start) haptic('selection')                                // Q28
}
```
Continue and the arrow keys call `animate(p, index + 1, spring.glide)`. A second tap mid-flight retargets from the live value (N11).

Per slide `i`, with `d = useTransform(p, v => v - i)` (d < 0 is the slide coming in from the right, d > 0 is the slide that left):
| Layer | opacity | translateX | scale | Notes |
|---|---|---|---|---|
| Slide root | `clamp(1 - abs(d) * 1.4, 0, 1)` | 0 | `1 - min(abs(d), 1) * 0.06` | crossfade with depth: at mid-drag both slides show at 30% |
| Title (42/760) | follows root | `-d * 48` px | 1 | foreground moves most |
| Line | follows root | `-d * 36` px | 1 | |
| Bento card k (0..3) | `clamp(1 - abs(d) * (1.4 + k * 0.2))` | `-d * (20 + k * 8)` px | `1 - abs(d) * 0.04` | far cards trail and fade first |

Distances are capped: nothing travels more than 64 px (N1). `pointer-events` and `aria-hidden` go to every slide except `round(p)`.

Live bento contents (counts, fills, digit rolls) start when a slide's `abs(d)` first drops below 0.5, using the stagger in 3e. They play once, then hold (the `live` prop already does this).

Mist background: replace the static `radial-gradient` with 3 blob divs. Each blob is about 70% of the viewport width, has `border-radius: 50%` and a soft `radial-gradient(closest-side, tint, transparent)` fill. Only `x`, `y`, `scale` and `opacity` interpolate over `p`, with `useTransform(p, [0,1,2,3], [...])`. There is no `filter: blur`, because the softness lives in the gradient. Per-slide tints (alpha tints of brand colours, Q2): Food accent/9%, Train ink/9%, Geo ink/6% plus white/60%, Check-in accent/6%. Blob positions move 40-90 px and scale 0.9-1.15 between slides, so the mist "flows" with the finger. It never moves on its own (N12). Set `will-change: transform` on the blobs only while the stage is being dragged.

Liquid progress pill: one 6 px ink dot rides a track of 4 ink-20 dots (6 px dots, 6 px gap, so 12 px per step). `x = p * 12`. `scaleX = 1 + 1.6 * (1 - abs(2 * frac(p) - 1))`, so the dot stretches to about 2.6x between dots and settles round when `p` lands. Use `transform-origin: center`. A 6 px capsule tolerates the radius distortion. Do not use `layoutId` here: `layoutId` animates only after a React commit, so it cannot follow a finger. `layoutId` is for state changes such as the tab lens (3b). The current dots animate `width`, which the hard constraints forbid.

Buttons: Continue is a fixed control that never moves. Its label crossfades to "Get started" over 150 ms as `p` passes 2.5, and its fill crossfades from ink to orange through two stacked layers (opacity, not `background-color`).

### 3b. Tab switch

- Lens: keep `layoutId="tab-pill"` and switch it to `spring.lens`. On pointer-down the lens scales to 1.06 and an inner white/14% overlay fades in within 80 ms. On release it settles with `spring.tap` (principle 6, Bevel IMG_6911).
- Icon: the newly active icon goes from scale 0.9 to 1 with `spring.tap`. Labels never move.
- Content: no slide. Tabs are peers, so there is no direction to imply ([WWDC18 803](https://developer.apple.com/videos/play/wwdc2018/803/) on spatial consistency). With View Transitions (3c): root old opacity 1 to 0 over 120 ms, root new opacity 0 to 1 over 180 ms, both starting at 0 ms, so they overlap. Without View Transitions: the incoming page fades from 0 to 1 over 160 ms, mounted at once. Delete the fade-out-first step (`leaveThen`): it adds 140 ms before navigation starts and creates N6.
- Haptic light, only when the tab actually changes (Q28). Large titles do not re-animate on tab return (principle 7).

### 3c. Push and pop between screens

Feature-detect at call time: `if (document.startViewTransition) ... else fallback`. Support per MDN browser-compat-data 8.1.7 (fetched 26 Oct 2026): Chrome, Chrome Android and Android WebView 111+, Safari and iOS 18+. Our iOS 17 WKWebView and the Chrome 91 `fiqr_lowend` emulator do not have it, so the fallback must be first-class.

View Transitions path: `document.startViewTransition(() => new Promise(r => { router.push(href); onNextRouteCommit(r) }))`, where `onNextRouteCommit` resolves from the incoming page's first `useLayoutEffect`.
```css
.vt-hero { view-transition-name: var(--vt, none); }   /* set --vt on the tapped card and on the target's hero only */
::view-transition-group(*) { animation-duration: 380ms; animation-timing-function: cubic-bezier(.32,.72,0,1); }
::view-transition-old(root) { animation: 380ms cubic-bezier(.32,.72,0,1) both vt-recede; }
::view-transition-new(root) { animation: 380ms cubic-bezier(.32,.72,0,1) both vt-enter; }
@keyframes vt-recede { to { opacity: 0; transform: scale(.97); } }
@keyframes vt-enter  { from { opacity: 0; transform: translateX(40px); } }
html[data-nav="back"]::view-transition-new(root) { animation-name: vt-enter-back; } /* from translateX(-24px) scale(.97) */
```
`cubic-bezier(.32,.72,0,1)` is the iOS sheet curve that vaul ships (`node_modules/vaul/style.css`). Pop is the exact mirror of push ([WWDC18 803](https://developer.apple.com/videos/play/wwdc2018/803/): "a symmetric path"). Caveat: an interrupted View Transition snaps to its end before the next one starts ([motion.dev layout docs](https://motion.dev/docs/react-layout-animations)). Keep them at 380 ms or less and never chain them.

Fallback path (framer): the incoming page root uses `initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={spring.page}`, and back navigation uses `x: -24`. The shared-element morph is only possible inside one React tree (card to sheet, row to expanded row) with `layoutId` plus `AnimatePresence`. It does not work across routes. Do not fake a cross-route morph with fixed-position clones.

### 3c-native. Native push, pop and swipe-back (owner choice, 26 Oct 2026)

Supersedes the 40 px fade-in fallback above. Built in `src/components/layout/route-frame.tsx`; values in `src/lib/motion.ts`.
- Stack: every page stays mounted under the page that covers it (frozen router contexts), so back keeps its state and scroll. Only the top page is live and in the document flow; pages underneath are `fixed inset-0 overflow-hidden` at their own `scrollTop`, `inert`, `visibility: hidden` at rest, and `display: none` two or more levels down.
- Push: the new page enters from x 100% to 0 over the old one and carries the `--shadow-push` token (`-12px 0 32px` ink 10%); the old page moves to x -30% under an ink dim from 0 to 0.08. One spring drives progress 0..1 for both pages and the dim: `spring.push` 320 / 36 / 1 (zeta 1.0, no overshoot, within 2 px of 390 by about 0.42 s, at rest by about 0.5 s). Pop is the exact reverse and starts from the live position if it interrupts a push. A push that interrupts a running push or pop starts the covered page from its live position too (its offset shrinks to 0 as the spring arrives), and the page below a half-slid page stays shown until it is covered.
- Swipe-back: a touch that starts within 20 px of the left edge and moves sideways first follows the finger 1:1; it is claimed (touchmove cancelled) only once it is 8 px rightward and more sideways than down, so an undecided or vertical gesture keeps its native scroll (parallax and dim tied to progress). Release completes past 35% of the width or at more than 300 px/s rightward; a leftward flick faster than 300 px/s cancels. A push still sliding in can be caught. Vertical-first touches are left to scroll; `[data-no-swipe-back]` (edge-to-edge horizontal scrollers: the session pager, chip rails, day and week strips, the ruler) and vaul drawers opt out; off on tab roots, with nothing underneath, and in iOS Safari outside the app (Safari owns that edge). WKWebView's own back-forward swipe stays off (Capacitor never sets `allowsBackForwardNavigationGestures`).
- Direction (`classifyNav`): a route still in the stack is a pop to it (back button, hardware back, swipe, or a pushed page's link to its root). Browser back or forward outside the stack reads the history index stamped on each entry. Tab root to tab root (from the tab bar, or browser and hardware back between tab roots), or another tab chosen from a pushed page, is the 3b crossfade (new 0.18 s ease-out over old 0.12 s ease-out: an exit fade is ease-out too, never ease-in), and the stack starts over.
- Reduced motion: every route change is a 0.15 s crossfade, and pages underneath stay at x 0. Swipe-back still follows the finger (without parallax) and completes with the 0.15 s crossfade; a cancelled swipe returns to rest at once.
- Late commit: after a completed swipe the route frame calls `history.back()`; if no popstate arrives within 600 ms (nothing to go back to) the page is put back, otherwise the late commit lands on the already-slid page without a second slide.
- Focus: when a push or pop settles, focus moves to the new page's `h1` (else its `main`), `tabIndex -1`, `preventScroll`, unless the user already placed focus outside the pages.
- Tab bar: outside the stack, so it never slides with a push; it only leaves with its own slide on `hidesTabBar` routes. Each page layer carries its own tab bar clearance.

### 3d. Sheets

The inset `BottomSheet` stays on vaul 1.1.2. Its behaviour is fixed by its source and is accepted: 1:1 drag; release on a 500 ms `cubic-bezier(.32,.72,0,1)` transition; close when the drag passes 25% of the height (`CLOSE_THRESHOLD`) or the velocity exceeds 0.4 px/ms (`VELOCITY_THRESHOLD`); upward overdrag damped by `8 * (ln(v + 1) - 2)`. The repo README now says "This repo is unmaintained": pin 1.1.2 and do not upgrade blind.
- Dim: `bg-ink/30`, with opacity tied to sheet progress (vaul does this). No background scale for inset, content-sized sheets (Bevel IMG_6862, 6874 dim but do not scale). Sheets over 85% of the viewport height get vaul `shouldScaleBackground` (scale 0.94 or more, transform only).
- Content: sheet children do not run their own entrance. The sheet's arrival is the entrance; the exception is the + sheet grid (3i).
- Nested scroll: the sheet drags only when its body's `scrollTop` is 0 (vaul `scrollLockTimeout` 100 ms).

### 3e. List and card entrance choreography

Runs on the first paint of a screen in a session only. Revisits and cached renders paint at rest (principle 7, N8).

| Order | Element | Start | Motion |
|---|---|---|---|
| 1 | Header (title, glass buttons) | 0 ms | opacity 0 to 1 over 150 ms, no movement (persistent chrome) |
| 2 | Hero card | 0 ms | opacity plus scale 0.98 to 1, `glide` |
| 3 | Hero ring draw and count-up | 120 ms | 3f |
| 4 | Tiles (2x2) | 160 ms plus 40 ms x i | opacity plus y 12 to 0 px, `glide` |
| 5 | Rows | 240 ms plus 30 ms x i, only the first 6 | opacity plus y 8 to 0 px, `glide`; rows past 6 appear with row 6 |

Everything is readable by 450 ms, and no more than 4 elements start in one frame (N3). Distances differ by layer (hero 0, tiles 12, rows 8) so the motion is never uniform (N4). In code, replace `.rise` with framer variants (`staggerChildren: 0.04`, `delayChildren: 0.16`) or a CSS class per layer with its own dy and duration. Pass `--i` only within a layer.

### 3f. Count-ups and chart draws (Q23 places only)

- Count-up: drive a motion value and render through `useTransform`, never `setState` per frame:
```tsx
const mv = useMotionValue(from); const text = useTransform(mv, v => Math.round(v).toLocaleString('en-AU'))
useEffect(() => { const c = animate(mv, to, { duration: reduce ? 0 : 0.9, ease: [0.33, 1, 0.68, 1] }); return c.stop }, [to])
return <motion.span className="tabular-nums">{text}</motion.span>
```
  Start from the last shown value, not 0, when data refreshes. Use `tabular-nums` so the width never changes (N9).
- Ring and line draws: 700 ms ease-out with `motion.circle` or `motion.path` `pathLength` (0 to value). This is the bounded `stroke-dashoffset` paint exception: the SVG must be 200 x 200 px or smaller, and the trace for it must show paint under 2 ms per frame on `fiqr_lowend`.
- Bars and meters: `scaleX` or `scaleY` from 0, with `transform-origin` at the base, 40 ms stagger, `glide`. Never animate `width` or `height`.
- Macro dots: opacity 0 to 1, 15 ms per dot, capped at 300 ms in total.

### 3g. Press feedback

- On `pointerdown`, never on click: buttons scale to 0.97 and cards and rows to 0.98 in 100 ms ease-out (Emil Kowalski: "Respond on pointer-down, not on release", [apple-design skill](https://github.com/emilkowalski/skills/tree/main/skills/apple-design)). The release springs back with `tap`. Use framer `whileTap` or `:active` with a `transform` transition. The tap slop is 10 px: a drag beyond it cancels the press with no action.
- Glass controls (orb, round buttons, tab lens) also get the fingertip glow: a `radial-gradient(white/22%, transparent 60%)` layer placed at the touch point. Its opacity goes to 1 in 80 ms and back to 0 in 200 ms. Only opacity animates.
- Haptics per Q28: selection on chips, steppers and onboarding options; success on log save and set tick.

### 3h. Skeleton to content

- Skeletons appear only after 150 ms with no data (cached data paints instantly). Each skeleton block has the exact final box size, so the swap causes no shift (N9).
- Swap: content opacity 0 to 1 over 180 ms, and the skeleton opacity 1 to 0 over 120 ms, both starting in the same frame. The blocks do not move. Count-ups and draws then start from 3f.
- While waiting longer than 600 ms: ink-04 blocks pulse opacity between 0.6 and 1 on a 1.2 s cycle. Remove the `.shimmer` gradient sweep (N7).

### 3i. The orb opens the + sheet

The + sheet becomes a framer component (vaul cannot morph from a source element). The orb's surface and the sheet panel share `layoutId="orb-surface"` inside one `LayoutGroup` in the app shell. Apple: menus open so "it communicates a very clear and direct relationship between the button and the content" ([WWDC25 219](https://developer.apple.com/videos/play/wwdc2025/219/)); reference: Bevel IMG_6882, 6912-6913.
1. 0 ms: the surface morphs from the 64 px orb circle to the panel (inset 8 px, radius 38) with `spring.lens`. Set `borderRadius` through `style` so framer's scale correction keeps the corners round. The tab capsule fades to 0 over 150 ms and scales to 0.96. The plus icon rotates 45 degrees with `spring.tap`. Haptic light.
2. While morphing, the surface is solid (`glass-solid`). The backdrop-blur layer is a separate child whose opacity goes 0 to 1 over 160 ms after the spring settles (`onLayoutAnimationComplete`). The blur radius never animates, and on `data-glass="off"` the layer does not exist.
3. 80 ms: the Geo field fades in with y 8 px. From 110 ms, the 9 grid items scale 0.92 to 1 with opacity, 25 ms apart, in row order. Everything is in place by about 400 ms.
4. Close (orb tap, dim tap, or a drag down past 25% or faster than 0.4 px/ms with `drag="y"`, `dragElastic={{ top: 0.08, bottom: 0.6 }}`): the content fades out over 100 ms all at once, the blur layer drops to 0 at once, and the surface shrinks back into the orb with `spring.sheet`, carrying the drag velocity. If the user re-taps mid-close, the morph reverses from its live position (N11).

### 3j. Tab bar minimises on scroll (iOS 26)

Owner ask (26 Oct 2026): "the menu bar should collapse into just one home icon on scroll". What Apple ships, checked 26 Oct 2026:
- iOS 26 tab bars can minimise on scroll: SwiftUI `tabBarMinimizeBehavior(.onScrollDown)`, UIKit `tabBarController.tabBarMinimizeBehavior = .onScrollDown`. "The tab bar minimizes when scrolling down, and expands when scrolling back up" ([UIKit MinimizeBehavior.onScrollDown](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior/onscrolldown); [WWDC25 284](https://developer.apple.com/videos/play/wwdc2025/284/) and [WWDC25 323](https://developer.apple.com/videos/play/wwdc2025/323/): "The tab bar re-expands when scrolling in the opposite direction"). iPhone only.
- The minimised bar is the currently open tab, not always Home: the HIG art shows "the tab bar ... minimized into the currently open tab at the leading bottom corner of the screen, with the MiniPlayer at the bottom center, and the search tab in the trailing corner" ([HIG Tab bars, iOS](https://developer.apple.com/design/human-interface-guidelines/tab-bars#iOS)). So on Home it shows the Home icon (what the owner described); on Food it shows Food. We follow Apple.
- Exit: "A person can exit the minimized state by tapping a tab or scrolling to the top of the view" (same HIG section), plus any scroll up.
- A separate control stays separate: the search tab keeps its own circle at the trailing corner, and a bottom accessory "animates down to display inline with the tab bar" ([WWDC25 284](https://developer.apple.com/videos/play/wwdc2025/284/); Music: [9to5Mac](https://9to5mac.com/?p=1020858)). Our + orb is that trailing control and does not move.
- Motion: Apple publishes no curve for this. Liquid Glass controls "morph" and "shape shift" between states and "materialize in and out" rather than fade ([WWDC25 219](https://developer.apple.com/videos/play/wwdc2025/219/)), so the capsule's glass shrinks into the circle rather than swapping.

Build (`src/components/layout/tab-bar.tsx`, state in `src/lib/tab-bar-minimise.ts`):
1. Thresholds with hysteresis: collapse after 24 px of travel down from the lowest point since the bar last expanded, and only past y 96. Expand after 12 px up from the deepest point, at y 48 or less, on a tap on the circle, and on every route change (re-anchored at the page's restored scroll, so the restore after a pop never reads as a scroll down). One state step per frame (passive `scroll` on `window`, rAF; only a flip is committed, in a microtask after the frame, so no `setState` runs inside rAF), and `scrollY` is clamped to the real range so iOS's bottom rubber band never reads as a scroll up.
2. Collapse (`spring.glide`, 300/35/1, critically damped: the morph follows a scroll, not a flick release, so it earns no overshoot): one glass surface shrinks from the capsule to the 52 pt circle at the leading edge through framer layout projection (transforms only, `borderRadius` in `style` so the corners stay round). The three other tabs and the labels fade out in 120 ms while scaling to 0.8 (a `transform` string, so the scale stays on the compositor while the page scrolls). The open tab's icon flies into the circle (shared `layoutId="tab-icon-<href>"`, one id per tab so a tab switch never flies an icon across the bar; the travelling icon, the plain icon and the collapsed placeholder each have their own React key, so none reuses another's motion state) and grows from 20 to 22 px.
3. Expand is the reverse on the same spring. Items fade back over 180 ms after a 120 ms delay, so they arrive behind the growing glass, not ahead of it.
4. The circle is a `button` inside the `nav` landmark, named "Show tabs, Home" (or the open tab), 52 x 52 pt. Tapping it expands and never navigates; a keyboard or screen reader activation hands focus to the open tab, because the circle unmounts. While collapsed, the links are `inert`. Pages outside the four tabs never collapse, because there is no open tab to show.
5. Interruptible: a scroll back up mid-collapse reverses the glass from its live width (measured: 282 to 147 px, then back to 282 with no snap).
6. Reduced motion: no projection. Two still surfaces (capsule and circle) crossfade with `reducedFade`, and the circle button fades in and out.
7. The + orb, the `orb-surface` morph into the + sheet, and the slide-away on full-screen routes are unchanged.

## 4. HOW NOT: implementation traps

1. `scroll-snap` pagers for narrative slides. The browser owns the physics, there is no progress value to scrub layers with, and the result is N1. Use `scroll-snap` only for real lists and pickers (`wheel-picker.tsx` is fine).
2. Animating `backdrop-filter`, `filter: blur()`, or the size of a blurred element on low-end devices. The Chrome team says "Animating a blur is not really an option as it is very slow" ([Chrome blog](https://developer.chrome.com/blog/animated-blur/)), and we measured 150-200 ms freezes on `fiqr_lowend` (`design-system.md`). Fade a separate layer instead (3i step 2).
3. `setState` in `requestAnimationFrame` or in pointer handlers (today's `useCountUp` and `onScroll` do this). Use motion values: "Changes to the motion value will update the DOM without triggering a React re-render" ([motion.dev](https://motion.dev/docs/react-motion-value)).
4. CSS `@keyframes` for anything a user can interrupt. Keyframes restart from 0 and ignore velocity. Use them only for one-shot decoration (`shake`). CSS transitions can retarget but carry no velocity, so use them for opacity and press only, never for gesture-released motion.
5. `transition-[width,...]`, `transition-all`, or Tailwind `transition` with no property list. Each needs an explicit `transform` and/or `opacity` property.
6. Fade-out-then-navigate (`leaveThen`). It adds 140 ms of latency to every route change (INP target < 100 ms, Q21) and creates N6.
7. Measuring layout during a drag (`getBoundingClientRect` per move). Measure once on `pointerdown` and on resize.
8. `will-change` left on permanently, or on more than about 6 elements at once. Each one is a GPU layer, and the 2 GB emulator pays for them.
9. Using duration-based springs or tween easing to imitate a spring after a gesture. Always pass `velocity` into `animate()`.
10. `AnimatePresence` exit animations on route pages in the Next App Router. The old tree unmounts before an exit can run; use View Transitions or the enter-only fallback (3c).
11. Using a spring with bounce on a page or sheet that no gesture threw (N5).
12. Following emilkowalski's apple-design advice to "animate blur radius and scale together on enter/exit". It conflicts with trap 2 (already flagged in `sources.md`).

## 5. Checklist (grade every screen and transition)

Record on the iOS simulator and the `fiqr_lowend` emulator, dump frames at 60 fps, and add a Chrome trace for Android. A screen passes only when every applicable row passes. Report failures with the frame numbers.

| # | Check | Pass |
|---|---|---|
| M1 | E3 pop rule | No single frame changes more than 8% of the pixels outside the animated element's bounding box. |
| M2 | Durations, from the first changed frame to the last | press 80-150 ms; tab content 140-220 ms; push and pop 300-450 ms; sheet open 350-550 ms; stage settle after release 250-500 ms; + morph 300-450 ms; count-up 850-950 ms; draw 650-750 ms. |
| M3 | Exit and enter overlap | 60 ms or more (4 or more frames) where both the old and new content have opacity above 0.1; 0 cream-only frames between screens (N6). |
| M4 | Stagger | First paint: 3 or more distinct start frames among entering elements, 4 or fewer starting in one frame, all at rest by 450 ms (count-ups excepted). |
| M5 | Not uniform | Entering layers differ in dy or start time; no two layers share both. |
| M6 | Drag tracking | With touch indicators on: the finger-to-element offset stays within 2 px for the whole drag. |
| M7 | Velocity hand-off | Speed in the first frame after release is within 25% of the speed in the last drag frame (no stop-then-go). |
| M8 | Interruptible | Reversing a drag or double-tapping mid-transition reverses within 1 frame, and no frame-to-frame jump exceeds 2x the previous delta. |
| M9 | Easing shape | Position over time shows a spring (velocity peaks in the first 25%, settles with 4% overshoot or less unless gesture-released, bounce 0.4 or less); no linear or symmetric S-curves on movement. |
| M10 | Frame budget (`fiqr_lowend`) | No frame over 16.7 ms in the window; 2 or fewer dropped frames per transition; no Layout events during an animation; Paint only for 3f SVGs, under 2 ms. |
| M11 | Properties gate (grep) | No `transition-all`, no `width`, `height`, `top` or `left` in transition or animate props, no `backdrop-filter` or `filter` in transition or keyframes, and no `setState` inside rAF across `src/`. |
| M12 | Glass | `backdrop-filter` only on `.glass`, `.glass-cream` and the 3i blur layer; none rendered when `data-glass="off"`. |
| M13 | Reduced motion | With reduced motion on: every transition is opacity only and 150 ms or less, count-ups show final values in frame 1, and the stage changes slide with a 150 ms crossfade. |
| M14 | Seen data | Revisiting a screen with cached data: 0 spinner or skeleton frames, no entrance choreography, numbers final in the first frame. |
| M15 | Welcome stage | At 50% drag, both slides show at opacity 0.2-0.4; nothing moves more than 64 px; 3 or more parallax speeds are visible; the mist and pill move only with `p`; a flick at 500 px/s or more advances exactly one slide. |
| M16 | Palette | Screenshots contain no hue outside the palette and its alpha tints, and no moving gradient band (N7). |
