# Spatial Depth build spec (owner approved 26 Oct 2026)

The owner locked a direction and per-screen picks from coded mocks. This file is the build contract. Mocks live in `docs/redesign/mocks/` (open the HTML files in a browser); picks in `mocks/PICKS.md`.

## Objective
Rebuild the app's screens to match the locked mocks: Spatial Depth (option 19) app-wide, tab bar minimise to circle (option 01), Aurora on onboarding and login, compact real-iOS sizing, using the existing data and API (no backend changes).

## Fixed system
- **Depth push** replaces the native side push (41110bfc): the page behind steps back (scale about 0.94, light dim, no animated blur; blur measurably dropped frames), the new page comes forward; left-edge swipe-back tracks the finger with velocity hand-off; tab switches are a quick depth crossfade. Keep all review fixes (focus, reduced motion, history, swipe slop, interrupts).
- **Sheets** float forward over a scrim while the screen behind steps back; drag down to close; interruptible.
- **Tab bar**: compact capsule 52 pt + separate 52 pt ink orb; collapses to the open tab's circle on scroll (ce9caad2, 02cc8d18).
- **Materials**: content cards solid white (Q3); glass only on floating controls; orb ink (Q4); one orange action per screen.
- **Press**: cards tilt slightly toward the finger only while pressed (max about 2.5 deg, tiles 5 deg); background layers drift subtly on scroll (0.05x / 0.16x), large title drifts and fades a little.
- **Sizing (at 390 pt)**: large title 30 (Archivo 800, stretch 100-105), hero number 24, card title 17-18, body 15-16 (lh 1.35), caption 13, label 12, tab labels 11; gutters 16, feed gap 10; card radius 22 (tiles 20), padding 16 (tiles 14); rows 56-60; buttons 50; chips 44; steppers 56; fields 60; rings 112 / 84 / 60; tile min-height 128; sheet radius 36-40. Every target >= 44 pt.
- Motion: transform/opacity only, critically damped springs (slight bounce only after a flick), reduced motion = short crossfades, reduced transparency = solid surfaces.

## Locked picks per slice
| Slice | Picks |
|---|---|
| K Kit | depth push, sheets, press tilt, drift, sizing tokens, tab bar sizes |
| T Today | Hero Ring first; Tiles Log first (+ on Water logs a glass with Undo, weight 0.1 kg nudges, steps/sleep week views); Geo line with action chip + Undo; check-in due card; water and weight quick logs; macro detail sheet with per-macro icons, hue tints, rings, coloured rows; weight sheet with icon, teal trend, change chip; notifications sheet; Health permission sheet; splash and cold start |
| F Food | Day summary Ring; Day strip; Photo-led meal rows (photo when the log has one, otherwise a meal glyph on a macro-hue tint; no backend change); Tap for actions sheet (change meal, copy, delete with confirm and Undo); month view sheet; edit a logged item; enhance the "Your nutrition plan" link in the same style |
| W Train | Next up A3 Muscle hero; live session B1 Stepper rows + list sheet, one exercise per screen ("Exercise n of N", Previous/Next with depth step, All exercises sheet with done/now/next and jump); rest C3 Rest screen; summary D2 Session receipt plus a graph |
| G Geo | A2 Action card (Undo/Adjust, Use this plan/Change on the card); B1 Capsule composer; C1 Floating companion sheet |
| P Check-in and plans | A3 Today preview check-in; B1 Answer card; C1 Focused builder steps |
| S Settings and system | Paywall Depth stack; Settings Grouped list; system states Status capsule (one capsule under the header for all messages; crash/404 float a card over the last screen) |
| O Onboarding and login | Aurora fields + depth steps per `mocks/aurora-onboarding.html` |
| L Log a meal | waiting for owner picks |

## Done criteria per slice
1. Screens match the locked mock in a side-by-side screenshot at 390 and 360 (read by the builder and by a fresh reviewer on a different model).
2. axe serious/critical 0, targets < 44 pt 0, orange actions <= 1 per screen (scripts/redesign-capture.mjs).
3. Transitions recorded on a static build (scripts/redesign-transitions.mjs + redesign-framediff.py): 0 real pops in two runs.
4. `npm run lint` (0 errors), `npm run type-check`, `npm test` exit 0; new logic has tests.
5. iOS simulator screenshot of the slice's main screen read by eye.
6. Commit per slice; no backend, .env or CHANGELOG changes; no co-author lines.

## Known backend issues (not in scope; ticket for the backend)
Check-in proposal computed without last week's state; uncached reads write `check_ins` rows; "Keep current targets" calls Apply; Apply rewrites carbs/fat and the meal plan unseen; mid-week shows last week. Chat sessions limited to 20; titles unbounded; no streaming; send/report failures silent.
