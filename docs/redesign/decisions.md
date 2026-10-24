# Redesign decisions

Every decision here was put to Ved with a recommendation and answered in writing. "Costly to reverse" marks the ones the brief requires an explicit yes on.

## Round 1 (24 Oct 2026, Ved: "yes to all")

| # | Decision | Costly to reverse |
|---|---|---|
| Q1 | Ved's own initiative, beyond SOW D2. Ved approves each slice; the client sees one before/after sheet at the end; nothing ships to the stores until the client agrees. | no |
| Q2 | Alpha tints of `#111C35`, `#E8622A`, `#FDF6EC`, `#FFFFFF` count as the same four colours. No new hues, no greys other than ink tints. One line added to AGENTS.md. | no |
| Q3 | Glass only on the controls layer: tab bar, floating header buttons, sheets, the separate action orb. Content (cards, lists, rings, forms) stays solid. Android: blur + tint; low-end: near-opaque fallback. No refraction. | yes (glass material) |
| Q4 | Bottom nav becomes a floating capsule with 4 tabs (Home, Food, Train, Check-in) plus one separate round orb outside the capsule. Capsule minimises on scroll. Orb is ink or glass, never orange. | yes (navigation model, tab bar) |
| Q5 | Onboarding becomes one question (or tight group) per screen, about 20 screens, existing fields only (height included), Cal AI patterns without its dark patterns. Start list: `teardown/cal-ai.md`. | yes (onboarding flow) |
| Q6 | Out of scope: new backend fields (pace, barriers), AI-generated food photos, video and shader work, dark mode, admin beyond a token pass, any behaviour or data-flow change. In scope: all 39 URLs, 17 overlays, paywall, 404, crash, splash. | no |
| Q7 | Keep the palette and Archivo. Earn distinction through craft; the critic penalises AI tells. | no |
| Q8 | Test credentials go in `.env.capture` (gitignored by `.env*`), read only by capture scripts. | no |

## Round 2 (24 Oct 2026)

| # | Decision (Ved's words in quotes) | Costly to reverse |
|---|---|---|
| Q9 | (c): the orb opens a sheet with a Geo text field on top ("What did you eat?") and a grid of the existing log methods (Photo, Menu, Search, Weight, Water, Sleep, Mood, Energy, Workout). Replaces the Home "Log food" card and the nav "Talk to Geo". `/logs` stays as a route, leaves the nav. | yes (navigation model) |
| Q10 | No macro bars. "Take inspiration from Bevel - how they represent calories etc - see all images." Rings allowed. Anshu's app is a nice-to-consider update, not the main inspiration. Exact Home composition: round 3. | no |
| Q11 | Headers follow Bevel Journal (large left title + subtitle, glass pill actions top right, week strip under) and Bevel Fitness (centred title, round glass buttons, week strip with tick ruler and orange today marker) - "nice - thoughts?". Pattern choice per screen: round 3. | yes (header system) |
| Q12 | Ved "loves" the Bevel onboarding frosted bento cards (live mini components: digit-tile timer, set progress, mini chart, energy bank) and the Bevel Home metric cards (big value + small unit + status word + vertical range meter). Card shape per Q12 recommendation (white, no border, soft shadow, 24/20/16 radius). | no |
| Q13 | Smooth transitions, fades and motion on every page; roll-up counts in places; moving charts; "everything shall load in milliseconds, all pages". Springs as proposed. Performance metric: round 3. | no |
| Q14 | Native Reduce Transparency check on iOS via a local Capacitor plugin; Android low-end fallback by cores/memory. | no |
| Q15 | Branch `redesign/fiqr-v2` from `phase2/fiqr`, commit per slice. | no |
| Q16 | Phase 3 directions as static HTML mocks in `docs/redesign/directions/`. | no |

## Round 3 (24 Oct 2026)

| # | Decision | Costly to reverse |
|---|---|---|
| Q17 | Home: header "Today, <date>"; hero card with orange calorie ring (remaining inside) and protein/carbs/fat dot columns; Geo "COACHING" line in the same card; 2x2 Bevel-style metric tiles for Steps, Weight, Water, Sleep (big value, small unit, status word, vertical range meter); Next up workout card; today's meals as rows. Ring draws and numbers count up on load. Ved: steps, sleep etc. come from Apple Health on iOS (Health Connect on Android) - added to the brief. | yes (Home layout) |
| Q18 | Calories orange, protein ink, carbs teal, fat ochre. Orange in a chart is data, not an action; never orange chart next to an orange button in one card. | no |
| Q19 | Main tabs: large left title + subtitle, round glass actions top right; Food and Train add the week strip with tick ruler and orange today marker. Pushed screens: centred title + round glass back. Both condense on scroll. No coloured header wash. | yes (header system) |
| Q20 | Yes: pre-auth welcome carousel, 4 slides (Food, Train, Geo, Check-in), frosted bento of live FIQR mini-components on cream with an ink-tint mist; ink Continue, orange Get started on the last slide; "I have an account" to login. Explicit exception to Q6 (flow change). | yes (first-run flow) |
| Q21 | Perceived speed targets as proposed (INP < 100 ms, cached screen drawn < 200 ms on low-end Android, no spinner for seen data, 60 fps, JS per route not above today). Network: "as fast as possible" with a numeric target - proposed in round 4. | no |
| Q22 | Custom filled icon set (about 14) for tab bar and the + sheet; lucide outline at stroke 1.75 elsewhere. | no |
| Q23 | Count-ups: Home ring and tiles, Check-in headline, Food day total, live workout volume, onboarding plan reveal. Moving charts: Home ring and macro dots, Check-in weight trend, Train weekly volume. Not in lists, forms, settings. | no |

## Round 4 (24 Oct 2026)

| # | Decision | Costly to reverse |
|---|---|---|
| Q24 | Network targets on low-end Android, Fast 4G: cold-start fresh Home data <= 1.5 s median; later screens cached instantly, fresh <= 800 ms; API reads behind Home/Food/Train p95 < 300 ms; Home <= 6 parallel requests. Frontend work in scope; backend misses are logged as separate items. | no |
| Q25 | Geo chat as one running conversation: Geo plain text, user ink-tint pills, logged foods as inline rows with numbers, option buttons, floating glass composer. Clarified: the user's own photos in chat stay (existing attachments, shown as thumbnails); only AI-generated food imagery is out (Q6). | no |
| Q26 | Food diary in the Bevel Journal pattern: week strip with logged-day ticks, compact hero with count-up, meal sections of white rows, dashed empty slots, no emoji. | no |
| Q27 | Live session uses digit-tile timer, segmented set progress, big current-exercise card, volume count-up and haptic on tick; Finish workout is the one orange. Ved asked for exercise form images: round 5. | no |
| Q28 | Haptics: light on tab change and + sheet, selection on chips/steppers/onboarding options, success on log save and set tick. | no |
| Q29 | Geo voice: short, plain, warm, sentence case, no exclamation marks, no emoji, no "AI" talk. Each slice ships with an old/new copy list for Ved's approval. | no |
| Q30 | **Goal (confirmed by Ved):** "Rebuild every FIQR screen, sheet and state as one calm, Apple-native glass-and-paper system on the existing palette and Archivo, so logging a meal, reading today, talking to Geo and onboarding are measurably faster and smoother on a low-end Android phone and an iPhone, proven by device captures, frame-level motion checks, a blind critic and timed tests with 5 real people." | - |

## Round 5 (24 Oct 2026) - grilling closed

| # | Decision | Costly to reverse |
|---|---|---|
| Q31 | Yes, after Ved sees samples: exercise form images from `yuhonas/free-exercise-db` (Unlicense), name-mapped (top 100 hand-checked, no match = no image), loaded on demand from jsDelivr and cached, rendered as an ink duotone on cream. | yes (new data source) |
| Q32 | Health on screen: Steps, Weight, Sleep tiles from Health with source mark and last-sync time; Water manual; not-connected tile = one-tap connect; no data today = dash + yesterday, never a fake 0; sync on open, resume and pull-to-refresh with a non-blocking "Syncing" pill; Check-in trend and Train label Health-sourced data; honest pre-permission screen, no steering; verified on iOS simulator (seeded Health) and Android emulator (Health Connect). | no |
| Q31b | Lead agent judged the free-exercise-db samples below the bar (dated stock photos, murky duotone, wrong Plank start frame). Ved accepted the recommendation: (c) look for a better licensed source (2-3 checked, 10 samples first), (b) ship without exercise images if none passes. Not blocking. | no |

## Phase 2 - written agreement (signed by Ved, 24 Oct 2026: "yes to all")

### Objective
The Q30 goal sentence above.

### Metrics (measured per slice, recorded in PROGRESS.md)
| Metric | Baseline | Target |
|---|---|---|
| J1 log a meal by search: taps / seconds | 4 / not yet measured | <= 4 taps; seconds -20% |
| J1c log by telling Geo: taps | 3-4 | 2 (+ sheet text field, Q9) |
| J2 read today: taps / legible above the fold at 360x800 | 0 / yes | 0 / yes, numbers drawn < 200 ms from cache |
| J3 talk to Geo: taps | 3 | 2 |
| J4 onboarding: taps / seconds | 24 + 7 fields / not yet measured | <= 24 taps, one question group per screen, seconds -25% |
| Perceived speed (Q21) | to measure | INP < 100 ms; cached screen < 200 ms; 60 fps; JS per route <= today |
| Network (Q24) | to measure | cold Home fresh <= 1.5 s; later fresh <= 800 ms; API p95 < 300 ms; Home <= 6 requests |

### Lever
Layout, hierarchy, materials, motion, copy and client-side data strategy (cache-first, prefetch, parallel requests). Not backend, not new data fields.

### Reference examples of "great" (moodboard, not targets to copy)
| FIQR surface | Reference |
|---|---|
| Tab bar, + orb, + sheet | Bevel IMG_6866, 6907, 6909-6912 |
| Headers | Bevel IMG_6868 (Journal), 6869 (Fitness) |
| Home hero, tiles, coaching line | Bevel IMG_6907, 6891; image 15 (Health Monitor tiles) |
| Cards, empty states | Bevel IMG_6865, 6869, 6904-6906 |
| Sheets | Bevel IMG_6862, 6879, 6915-6918 |
| Welcome carousel | Bevel IMG_6857-6859 (frosted bento) |
| Onboarding steps | Cal AI IMG_6818-6835, 6853 (minus the rejected dark patterns) |
| Geo chat | Anshu's calorie tracker screenshot (conversation with inline food rows) |
| Live session | Bevel IMG_6857 (digit-tile timer, set progress) |

### Grading rubric (every slice, all must pass)
1. Core-job metrics above at or better than target for the jobs the slice touches.
2. Every inventory cell the slice owns captured: web 390 and 360, iOS simulator, Android emulator (`fiqr_lowend`).
3. axe: 0 serious/critical; text contrast >= 4.5:1 (large text 3:1); tap targets >= 44 pt.
4. Every transition the slice owns recorded on the simulator and the emulator, frames dumped with ffmpeg, frame-diff shows no pop (no single-frame jump > 8% of changed pixels outside the animated element, no layout shift after first paint).
5. 60 fps on `fiqr_lowend` during scroll, transitions and count-ups (Chrome trace: no frame > 16.7 ms in the measured window, allowing <= 2 dropped frames per transition).
6. Blind critic (fresh subagent on a different, larger model than the implementer, same prompt every run): sees 5 unlabeled screenshots (the slice's FIQR screen + 4 references), ranks them by polish and taste, and scores FIQR against a top-studio bar, penalising AI tells. Pass = FIQR ranked in the top 3 of 5 and scored >= 8/10 in 3 consecutive runs. The pass threshold is not in the critic prompt.
7. Copy list (old/new) approved by Ved (Q29).
8. AGENTS.md rules and the palette grep gate hold (Q2 tints allowed); lint, type-check, tests pass.

### Costly-to-reverse decisions needing Ved's explicit yes
| # | Decision | Source | Yes? |
|---|---|---|---|
| C1 | Glass material only on the controls layer, blur + tint, opaque fallback | Q3, Q14 | **yes** (Ved, 24 Oct 2026) |
| C2 | Navigation: floating 4-tab capsule + separate orb; orb opens the Geo + log sheet; `/logs` leaves the nav | Q4, Q9 | **yes** (Ved, 24 Oct 2026) |
| C3 | Header system: two patterns, no header wash | Q11, Q19 | **yes** (Ved, 24 Oct 2026) |
| C4 | Home layout: ring + macro dots + coaching line + Health tiles | Q17, Q32 | **yes** (Ved, 24 Oct 2026) |
| C5 | Onboarding as ~20 one-question screens + plan reveal | Q5 | **yes** (Ved, 24 Oct 2026) |
| C6 | Pre-auth welcome carousel | Q20 | **yes** (Ved, 24 Oct 2026) |
| C7 | No exercise form images; each exercise shows a target-muscle diagram in ink and orange from an MIT-licensed SVG muscle map, with a layout placeholder so a licensed set (WorkoutLabs) can drop in later if the client pays. Research: `exercise-images.md`. | Q31b | **yes** (Ved, 24 Oct 2026) |
| C8 | Branch `redesign/fiqr-v2`; `phase2/fiqr` stays shippable | Q15 | **yes** (Ved, 24 Oct 2026) |

Spring values (Q13) are starting points. The 8% frame-diff threshold, <= 2 dropped frames per transition and the critic pass bar (top 3 of 5, >= 8/10, 3 runs) were proposed by the agent and approved by Ved with "yes to all".

## Phase 3 pick and navigation change (24 Oct 2026)

| # | Decision | Costly to reverse | Yes? |
|---|---|---|---|
| D1 | Direction **C Bento** (`directions/c-*.png`). The critic-1 fixes apply (targets on macros, no weight range meter, hero number largest, sleep as "7h 12m" with a 7-night strip, one accent outside the ring, bottom padding under the tab bar). Merging the Geo line into the ring card is a critic fix taken by the agent; cheap to reverse. | yes | **yes** (Ved: "option c") |
| D2 | Tabs become **Home, Food, Train, Geo** (replaces Check-in tab; amends C2). | yes | **yes** (Ved) |
| D3 | Check-in leaves the nav: a Home card when a check-in is due (plus the existing push), otherwise a "This week" link on Home's header row. Not in the + sheet. | yes | **yes** (Ved) |
| D4 | The + sheet keeps its "Tell Geo" field on top plus the log grid; the Geo tab holds full conversations and history. | no | **yes** (Ved) |
