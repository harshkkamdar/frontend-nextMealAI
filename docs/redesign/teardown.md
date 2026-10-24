# Reference teardown (redesign Phase 0)

24 Oct 2026. 101 reference images read one by one: Bevel 63 (`teardown/bevel-a.md` IMG_6856-6887, `teardown/bevel-b.md` IMG_6888-6918), Cal AI 38 (`teardown/cal-ai.md` IMG_6818-6855). Each image has its own section there: what it shows, craft notes in iOS points, why it works, and a FIQR verdict. Measurements are estimates from downscaled views (about +/- 2 pt), not tool-measured. Two images (IMG_6882, IMG_6907) were re-checked by the lead agent against the written claims and match.

## Verdict count

| Source | Images | Adopt | Adapt | Reject |
|---|---|---|---|---|
| Bevel part A | 32 | 15 | 10 | 1 (+6 split verdicts, e.g. "adopt X, reject Y") |
| Bevel part B | 31 | 11 | 14 | 6 |
| Cal AI | 38 | 7 | 16 | 15 |

## What FIQR takes, in priority order

These are the candidates for Phase 1 grilling, not decisions. Each names the reference images and the FIQR surface it changes.

1. **Detached floating tab bar plus a "+" orb** (Bevel 6866, 6907-6911). A round glass capsule with 4 tabs and a separate round + on the right; it collapses to two orbs on scroll. FIQR today has a flat bottom nav with a "Talk to Geo" button. Maps to: every app screen. Cost: the only large `backdrop-filter` surface; opaque fallback on low-end Android.
2. **"+" quick-action hub with Geo in the centre** (Bevel 6882, 6912-6914). One entry for every log method: describe, photo, scan/search, Geo, weight, water, sleep, workout. Replaces the Home "Log food" card, the `/logs` chooser and the nav Geo button with one gesture. Biggest single lever on J1 and J3 (see `baseline.md`).
3. **Floating chrome instead of a nav bar** (Bevel 6862-6869, 6888-6901). 44 pt round back and action buttons over content, large title that condenses on scroll, cream top scrim. Maps to PageHeader everywhere.
4. **Lifted-paper card system** (Bevel throughout). White cards on cream, radius 24/20/16 for card/tile/row, soft wide shadow, no borders; selected = ink outline, never a fill. Replaces today's 1 px ink-12 borders.
5. **Number typography: big value, small unit, status word** (Bevel 6864-6867, 6880, 6890-6891). Tabular figures, unit at about 0.55 em in ink at reduced opacity. Maps to MetricTile, MacroBar, Home calories.
6. **Coach line under the data** (Bevel 6907: "COACHING" + one sentence under the rings). FIQR already has GeoLine; this places Geo's sentence directly under the numbers it explains, on Home, Food and Check-in.
7. **Rings and dot meters as summary primitives** (Bevel 6907, 6889, 6891). Calories as a ring, macros as dot matrices or segmented capsules in orange / teal (carbs) / ochre (fat). Competes with today's four MacroBars; decide in Phase 1.
8. **Inset floating sheets with a round close button** (Bevel 6862, 6863, 6879, 6915-6918). 8 pt inset, 32 pt radius, grabber, 44 pt round X. Maps to BottomSheet, ResizableSheet, Geo companion sheet.
9. **Week strip with today marker and status glyphs** (Bevel 6869, 6882-6885). Maps to CalendarStrip on Food and Train.
10. **Empty states that keep the layout** (Bevel 6865, 6904-6906): ghost rows, dashed slots, "Log 728 kcal to unlock". Maps to EmptyState and the `1st` state on every data screen.
11. **One question per screen onboarding** (Cal AI whole flow, Bevel 6872-6875). Split the 4 long forms into about 20 short screens with a thin progress bar, round back, a why-line under sensitive questions, a fixed bottom CTA, option cards with an ink selected state, a real-work loader and an editable plan reveal. Proposed step list: `teardown/cal-ai.md`, "Proposed FIQR onboarding steps". Biggest lever on J4.
12. **Bottom floating search capsule on list sheets** (Bevel 6916-6918). Maps to Log food search, Food database, FoodSearchSheet.

## What FIQR rejects, and why

- **Native refraction, lens and shape-morph effects** (Bevel 6866, 6911): no WebView equivalent at acceptable cost on Android.
- **Multicolour status palettes, gradient arcs and rings, scenic dark heroes, dark mode** (Bevel 6899-6901, 6907 rings): AGENTS.md palette and no-dark-mode rules.
- **Skeuomorphic clay illustrations and the AI blob mascot** (Bevel 6856, 6860, 6863, 6882 centre, 6887): trade-dress risk and palette; Geo needs its own mark.
- **Cal AI dark patterns**: steering OS permission prompts (6841, 6846-6847), unsourced comparison charts (6823, 6832), generic flattery (6836), a fake percentage loader (6850-6852), unverifiable social proof (6845), and marketing questions inside onboarding (6821, 6822, 6826).

## Conflicts with AGENTS.md to settle in Phase 1

1. Glass and shadows need alpha tints of the four brand colours (for example ink at 6-12%, white at 82-92%). AGENTS.md says "no other colours". Proposed: alpha tints of the four allowed colours count as the same colours.
2. Bevel puts selection and progress in many colours; FIQR keeps orange for the one primary action, so selection, progress and the tab selection pill must be ink.
3. A Bevel-style "+" orb is a strong visual; if it is orange, it becomes the one orange action on every screen and pushes every screen's own primary to ink. If it is ink or glass, each screen keeps its orange.
4. Archivo has to carry what SF does in Bevel and Cal AI (large titles, tabular figures); check Archivo's tabular-figure support and optical sizes in Phase 4.

## Data gaps raised by the references

Weekly pace and barriers (Cal AI 6830, 6833) have no backend fields. They stay out unless the API adds them; no client-only fields.

## Motion

No screen recordings of Bevel or Cal AI were supplied, so no durations or easing were measured. The CSS easing values in the part files are starting points, not measurements. Recording both apps on a phone (15-30 s per flow: tab switch, + hub open and close, sheet open, onboarding step change) would replace them with real numbers via `ffmpeg` frame dumps.
