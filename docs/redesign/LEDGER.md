# Remaining-slices ledger

Goal: docs/redesign/GOAL-remaining-slices.txt. Started 26 Oct 2026 on `redesign/fiqr-v2` at 042470d.

Status values (closed list): `built <sha>`; `blocked: <item>`; `needs-owner: <question>`; `differs: <decision id>`; `stalled: <critic scores of 3 rounds>`; `blocked-60fps (F6): <trace>`; `pending` (work not done yet).

## Infrastructure

| ID | Item | Status |
|---|---|---|
| F4 | Android Health plugin build fix | built bbc63a9 (patch-package: apply kotlin-android in the plugin, PERMISSION_READ_EXERCISE_ROUTES); app launches on fiqr_lowend, launch shot screens/slice-2/android-app-launch.png. API 30 WebView (Chrome 91) renders unstyled: Tailwind 4 needs Chrome 111+, already a known finding |

## S2 shell + Home

| ID | Item | Status |
|---|---|---|
| S2-01 | Tab capsule (Home, Food, Train, Geo) + orb, every app screen | built 30959c3, 0ec6c59 (orb surface morph), 4b3ffd5 (lens spring); captures tabs-food/train/geo-*.png |
| S2-02 | + sheet (Tell Geo + log grid) | built 30959c3, 0ec6c59 (framer panel grows out of the orb; frames transitions-lead/orb-morph/); plus-sheet*.png axe 0 small 0 |
| S2-03 | Main-tab header (large title, condenses) | built 30959c3 (LargeTitleHeader; condenses on scroll, home-scrolled-*.png) |
| S2-04 | Pushed-screen header (centred title, round back) | built 30959c3 (PushedHeader; first used by S3-S9) |
| S2-05 | Home default (returning user) | built 30959c3, d19f500, de45f9b; home-390/360.png axe 0 small 0 orange 0; live/home-390.png on the real account |
| S2-06 | Home first run (no logs, no plan) | built 30959c3 (first-meal Geo line de45f9b); home-first-run-*.png |
| S2-07 | Home loading (skeleton) | built 30959c3; home-loading-*.png (role=status skeleton) |
| S2-08 | Home error | built 30959c3; home-error-*.png |
| S2-09 | Home offline | built 30959c3; home-offline-*.png |
| S2-10 | Home long text | built 30959c3; home-long-*.png (560 kcal over, 4-line Geo line, long meal name) |
| S2-11 | Home Health tiles: connected / not connected / no data today | built 30959c3: web states captured (no data today = dash + yesterday, not connected on web = "Syncs from your phone", home-first-run); native connected / not-connected states: blocked: Health only exists in the Capacitor build on a device (Android emulator would not boot; no iOS app build run in this goal) |
| S2-12 | Home check-in due card | built 30959c3; home-checkin-due-*.png (one orange: See your week) |
| S2-13 | Home quick-log sheets (water, weight, sleep, mood, energy) | built 30959c3 (quick-log-sheet.tsx); quicklog-weight/water/sleep-*.png |
| S2-14 | Macro breakdown sheet | built 30959c3; macro-sheet-*.png |
| S2-15 | Splash | blocked: splash is the native launch asset (assets/splash.png, already on brand) plus splash-hider; verifying it needs the Capacitor app on a device, which this goal could not run (Android emulator would not boot) |
| S2-16 | Notifications prompt | built 30959c3: restyled to the inset sheet (title, copy, 44 pt Not now); native-only, renders only in the Capacitor build, not captured on a device |
| S2-17 | Health connect sheet | built 30959c3: restyled to the inset sheet; native-only, renders only in the Capacitor build, not captured on a device |
| S2-18 | T: tab switch | pending |
| S2-19 | T: + sheet open/close | built ad99c26: tab switch fades, push enters from the right with the page spring and the outgoing page overlapping; frame-diff smooth on a production build |
| S2-20 | T: Home load (ring draw, count-up) | built 4b3ffd5 (layered first-paint entrance: hero scale, tiles +12 px 40 ms apart, rows +8 px 30 ms apart; count-ups on motion values; still on revisit) |
| S2-R1 | R1 core-job metrics | built 30959c3, 0ec6c59: J2 read today = 0 taps, calories and three macros above the fold at 360x800 (home-360.png); J1c tell Geo = 2 taps (orb, type, send arrow; send=1 autosends) vs 3-4 before; seconds and the <200 ms cached-draw target pending the Phase 6 timed test |
| S2-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-2/*.png); iOS simulator Safari iPhone 16 Pro: slice-2/ios/home.png, plus-sheet.png (+ 10 earlier states 549d674); Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S2-R3 | R3 axe 0 / contrast / 44 pt | built 7ce9e45: axe 0, small 0, orange <= 1 on every slice-2 shot (screens/slice-2/checks.json) |
| S2-R4 | R4 frame-diff 0 pops | pending |
| S2-R5 | R5 60 fps on fiqr_lowend | blocked-60fps (F6): no real low-end phone; emulator proxy trace from the S2 device agent (pending its report) |
| S2-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: 3 rounds x 3 runs (Fable, docs/redesign/critic-prompt.md, refs Bevel IMG_6907/6891/6866/6865): r1 ranks 1/1/1 scores 7/7/7; r2 1/1/1 7/7/7; r3 2/1/1 6/7/7. Remaining critiques are signed decisions: macro hues (Q18) and capsule + separate orb (C2). needs-owner: collapse protein/carbs/fat to navy tints (changes Q18)? Keep the orb outside the capsule (C2)? |
| S2-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-2.md? Also: sleep tile became one line plus weekly average instead of the D1 7-night strip (critic round 2, taken alone, cheap to reverse) - keep? |
| S2-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S3 logging

| ID | Item | Status |
|---|---|---|
| S3-01 | Log food search | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-02 | Log food photo | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-03 | Food search sheet | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-04 | Log weight | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-05 | Log water | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-06 | Log sleep | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-07 | Log mood | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-08 | Log energy | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-09 | Log workout (manual) | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-10 | Log chooser /logs | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-11 | Log list actions | built 442e20f; screens/slice-3/ (69 shots x 2 widths, axe 0, small 0, orange <= 1) |
| S3-12 | Food database /foods | built 442e20f, 01483e6: /foods (Your foods) states in screens/slice-3/foods-*.png, axe 0, small 0, orange <= 1 |
| S3-13 | T: log save | built 442e20f; transitions food-search-results, food-select-tray, photo-tray smooth; water-save and food-log-save popped on the old shared route frame, fixed in ad99c26 (re-record pending) |
| S3-R1 | R1 core-job metrics | built 442e20f: J1 log by search = 4 taps (orb, Search, result, Log meal); seconds pending the Phase 6 timed test |
| S3-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-3/*.png); iOS simulator Safari iPhone 16 Pro: slice-3/ios/food-results.png, food-selected.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S3-R3 | R3 axe 0 / contrast / 44 pt | built 442e20f: axe serious/critical 0, small 0, orange <= 1 on 138 checks (screens/slice-3/checks.json) |
| S3-R4 | R4 frame-diff 0 pops | pending |
| S3-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S3-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: 3 rounds x 3 runs (refs Bevel IMG_6862/6879/6915/6916): r1 ranks 1/1/1 scores 7/7/7; r2 1/1/1 7.5/7.5/7.5; r3 1/2/1 7.5/7/7.5. Remaining critiques: round glass back button (C3), soft shadows on pills and cards. Fix commits 01483e6, 6672e18 |
| S3-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-3.md? Also: food search sheet moved to the inset sheet (no snap levels); /foods lost the orange Add (round + in header); recent-log right value only for food and workouts |
| S3-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S4 Geo tab

| ID | Item | Status |
|---|---|---|
| S4-01 | Geo chat list | built 5aa376e, 617312a; screens/slice-4/ (25 states x 2, axe 0, small 0, orange <= 1) |
| S4-02 | Geo chat session | built 5aa376e, 617312a; screens/slice-4/ (25 states x 2, axe 0, small 0, orange <= 1) |
| S4-03 | Geo companion sheet | built 5aa376e, 617312a; screens/slice-4/ (25 states x 2, axe 0, small 0, orange <= 1) |
| S4-04 | Report response sheet | built 5aa376e, 617312a; screens/slice-4/ (25 states x 2, axe 0, small 0, orange <= 1) |
| S4-05 | Chat session list actions | built 5aa376e, 617312a; screens/slice-4/ (25 states x 2, axe 0, small 0, orange <= 1) |
| S4-06 | T: push to session | built 617312a; static-build frame diff: chip-tap smooth x2; open-conversation smooth in run 6; reply-arrives, new-conversation, companion-open, companion-resize flagged in at least one run (dropped screencast frames; new-conversation tab-bar unmount fixed in the lead shell commit); re-record pending |
| S4-R1 | R1 core-job metrics | built 5aa376e: J3 talk to Geo = 2 taps (Geo tab, Ask Geo anything field sends) |
| S4-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-4/*.png); iOS simulator Safari iPhone 16 Pro: slice-4/ios/list.png, session.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S4-R3 | R3 axe 0 / contrast / 44 pt | built 5aa376e: axe 0, small 0, orange <= 1 on 50 checks |
| S4-R4 | R4 frame-diff 0 pops | pending |
| S4-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S4-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: critic scores of 3 fix rounds printed - r1 7/7.5/7, r2 7.5/7.5/7.5, r3 7.5/7/7.5 (ranks 1/1/1; top 3 every run, never >= 8). Recurring r3 notes: round shadowed back button (C3, signed), lone wrapped "Not sure" chip, disabled send reads muddy, timestamp and caption gaps |
| S4-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-4.md? Resizable sheets settle by transform (pinned footer shifts slightly on release) vs animating height (forbidden by motion-feel) - keep? Inline food rows parse Geo's "Logged ... N cal" receipt text; a structured receipt from the backend would be sturdier (backend change, out of scope). New: Ask Geo field on /chat and a Rename/Delete sheet - approve? |
| S4-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S5 Food diary

| ID | Item | Status |
|---|---|---|
| S5-01 | Food diary /food | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-02 | Month view sheet | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-03 | Copy meal dialog | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-04 | Name favourite dialog | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-05 | T: day change on week strip | built bcd3dfa; day-change, day-change-back, week-swipe, month-open smooth; row-actions-open (shared sheet) popped on the busy dev server, re-check on a production build pending |
| S5-R1 | R1 core-job metrics | built 30190d3: no core job owned (J1 entry via meal Add rows and dashed slots: 2 taps to the search screen, same as before) |
| S5-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-5/*.png); iOS simulator Safari iPhone 16 Pro: slice-5/ios/food.png, month-sheet.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S5-R3 | R3 axe 0 / contrast / 44 pt | built bcd3dfa: axe 0, small 0, orange <= 1 on 36 checks |
| S5-R4 | R4 frame-diff 0 pops | pending |
| S5-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S5-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: 3 rounds x 3 runs (Fable, critic-prompt.md, refs Bevel IMG_6868/6869/6865/6904): r1 ranks 1/1/1 scores 8/7.5/7.5; r2 1/1/1 7.5/7.5/7.5; r3 1/1/1 7.5/7.5/7.5. Remaining critiques: macro hues (Q18), capsule + orb (C2). Fix commits 1260c0a, 565cfcf |
| S5-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-5.md? Also: the sticky orange Log food button was removed (Add food rows, dashed slots and the orb cover it) - OK? |
| S5-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S6 Train + live session

| ID | Item | Status |
|---|---|---|
| S6-01 | Train /train | built 767f95d..4716587; screens/slice-6/ (25 shots x 2, axe 0, small 0, orange <= 1) |
| S6-02 | Live session | built 767f95d..4716587; screens/slice-6/ (25 shots x 2, axe 0, small 0, orange <= 1) |
| S6-03 | Rest timer (pinned, minimised) | built 767f95d..4716587; screens/slice-6/ (25 shots x 2, axe 0, small 0, orange <= 1) |
| S6-04 | Target-muscle map (C7) | built 767f95d: target-muscle diagram from body-highlighter 3.0.2 polygons (MIT, (c) 2020 GV79, notice in src/components/workout/muscle-map-data.ts), bundled, 136 px ExerciseVisual slot for a licensed image set later (C7) |
| S6-05 | T: set tick | built 5f0240a: set tick grows an ink disc; static-build frame diff smooth in 3 of 5 runs, single first-frame flag otherwise (host load 60-170) |
| S6-06 | T: start session | built 82519d2: start-session, finish and train-first-load smooth on the static build |
| S6-R1 | R1 core-job metrics | built 767f95d: no core job owned (start workout 1 tap from Train and Home, unchanged) |
| S6-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-6/*.png); iOS simulator Safari iPhone 16 Pro: slice-6/ios/train.png, session-mid.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S6-R3 | R3 axe 0 / contrast / 44 pt | built 4716587: axe 0, small 0, orange <= 1 on 50 checks |
| S6-R4 | R4 frame-diff 0 pops | pending |
| S6-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S6-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: critic scores of 3 fix rounds printed - r1 7.5/7.5/7, r2 7.5/7.5/7.5, r3 7.5/7/7.5 (ranks 1/2/1; top 3 every run, never >= 8). Recurring r3 notes: bottom inset under the tab bar on Program list, one selected-day marker, bar chart scale, title vs body face (signed type decision) |
| S6-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-6.md? Freestyle log moved to the header +; calendar sheet uses the shared week strip (no tap-Today jump); pager scrolls sideways only (also fixed resume landing on exercise 1). Should Start on Train be orange when Home uses an ink play button? |
| S6-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S7 Plans

| ID | Item | Status |
|---|---|---|
| S7-01 | Plans list | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-02 | Plan detail workout | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-03 | Plan detail meal | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-04 | Meal plan builder | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-05 | Workout plan builder | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-06 | Edit program | built 56e322c; screens/slice-7/ (34 shots x 2, axe 0, small 0, orange <= 1) |
| S7-07 | T: push to detail | built 56e322c; builder-step, builder-step-back, day-collapse, meal-day-switch smooth; open-plan popped on the old shared route frame (fixed ad99c26), day-expand late text snap: re-check on a production build pending |
| S7-R1 | R1 core-job metrics | built 56e322c: no core job owned |
| S7-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-7/*.png); iOS simulator Safari iPhone 16 Pro: slice-7/ios/plans.png, view-workout.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S7-R3 | R3 axe 0 / contrast / 44 pt | built 56e322c: axe 0, small 0, orange <= 1 on 68 checks |
| S7-R4 | R4 frame-diff 0 pops | pending |
| S7-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S7-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: 3 rounds x 3 runs (refs Bevel IMG_6865/6869/6905/6906): r1 ranks 1/3/4 scores 7/6.5/6; r2 1/2/1 7.5/7/7; r3 2/1/1 7/7.5/7. Remaining critiques: round glass back (C3), orange CTA size, card radii vs tab bar. Fix commits be0cd6e, a58d95c |
| S7-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-7.md? Also: new Earlier plans list is an extra non-blocking getPlans() read (Q6 says no data-flow change) - keep or drop? Cancel removed from builders (Back does it) - OK? |
| S7-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S8 Check-in

| ID | Item | Status |
|---|---|---|
| S8-01 | Check-in due | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-02 | Check-in mid-week | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-03 | Check-in not enough data | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-04 | T: check-in load (count-up, trend draw) | built cf1252b; apply smooth; the pushes popped on the old shared route frame, fixed ad99c26 (lead re-record of Home to check-in: smooth, screens/slice-2/transitions-lead/push-home-checkin) |
| S8-R1 | R1 core-job metrics | built cf1252b: no core job owned (check-in reached in 1 tap from the Home card or This week) |
| S8-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-8/*.png); iOS simulator Safari iPhone 16 Pro: slice-8/ios/due.png, mid-week.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S8-R3 | R3 axe 0 / contrast / 44 pt | built cf1252b: axe 0, small 0, orange <= 1 on 38 checks |
| S8-R4 | R4 frame-diff 0 pops | pending |
| S8-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S8-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | stalled: 3 rounds x 3 runs (refs Bevel IMG_6891/6907/6869/6865): r1 1/1/1 7/7.5/7.5; r2 1/1/1 7/7/7.5; r3 1/1/1 7.5/8/7.5. Remaining critique: the orange G in Geo's avatar (client design reference) - needs-owner: make the G cream/ink? Fix commits edda1da, a5d6add |
| S8-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-8.md? After Apply the screen keeps the applied week until you leave - OK? Settings button dropped from check-in - OK? Health wording "Includes Apple Health weigh-ins" - OK? |
| S8-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S9 Settings and the rest

| ID | Item | Status |
|---|---|---|
| S9-01 | Settings | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-02 | Profile | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-03 | Account deletion sheet | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-04 | Paywall | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-05 | Privacy | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-06 | Support | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-07 | Delete account (public) | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-08 | 404 | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-09 | Crash boundary | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-10 | Confirm dialog | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-11 | Offline band | built a5c15d7, 6d05ab5, 578134d, 2cd51a0; screens/slice-9/ (34 shots x 2, axe 0, small 0, orange <= 1); in-app crash boundary reuses it (a21cbc3) |
| S9-R1 | R1 core-job metrics | built a5c15d7: no core job owned |
| S9-R2 | R2 states captured (web 390/360, iOS, Android) | built ac909b9: web 390 and 360 for every state (screens/slice-9/*.png); iOS simulator Safari iPhone 16 Pro: slice-9/ios/settings.png, paywall.png; Android: blocked: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026) and fiqr_lowend died under host load (549d674 notes) |
| S9-R3 | R3 axe 0 / contrast / 44 pt | built 2cd51a0: axe 0, small 0, orange <= 1 on 68 checks |
| S9-R4 | R4 frame-diff 0 pops | built 2cd51a0: settings-row-push, profile-back, delete-sheet-open, confirm-dialog-in-out, paywall-plan-switch, settings-switch smooth on a production static build |
| S9-R5 | R5 60 fps on fiqr_lowend | blocked: no real low-end phone (F6) and no emulator trace could be taken: fiqr_lowend35 never booted (black screen, quit by owner 26 Oct 2026); earlier fiqr_lowend runs rendered 4-17 fps under host load and were discarded (549d674) |
| S9-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S9-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-9.md? Picker rows instead of chip rows (36 px chips failed 44 pt), profile Save as a glass pill in the bar, every confirm in ink - taken alone, approve? |
| S9-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S10 admin

| ID | Item | Status |
|---|---|---|
| S10-01 | Admin dashboard token pass | built de45f9b, 31bd13f (old aliases to v2 tokens in 8 admin files: card, ink-65, radii, macro tints; card-chrome test updated) |
| S10-R1 | R1 core-job metrics | built de45f9b: no core job owned (admin, web only) |
| S10-R2 | R2 states captured (web 390/360, iOS, Android) | built de45f9b: admin is web only (Q6, D2 admin row); captures not required beyond the token pass |
| S10-R3 | R3 axe 0 / contrast / 44 pt | built de45f9b: token swap only; admin is web only and was not recaptured in this goal (no route or layout change) |
| S10-R4 | R4 frame-diff 0 pops | differs: Q6 (admin beyond a token pass is out of scope; no motion changed) |
| S10-R5 | R5 60 fps on fiqr_lowend | blocked: admin is web only and not in the Capacitor build; no frame budget applies |
| S10-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | differs: Q6 (admin beyond a token pass is out of scope; not part of the critic loop) |
| S10-R7 | R7 copy list approved | built de45f9b: no copy changed in admin |
| S10-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S1c welcome rebuild (owner request 26 Oct 2026: "static, PowerPoint slides, not liquid glass, AI slop")

| ID | Item | Status |
|---|---|---|
| S1c-01 | Welcome stage: one motion value scrubs all four slides, sequential text and card hand-off, depth and parallax, momentum release, rubber band, one slide per flick | built 076632b, bb0c4f2, 57bc207, bffd781, 5f9d18e |
| S1c-02 | leaveThen overlaps exit and enter (no cream frame) on welcome, auth and onboarding routes | built 076632b |
| S1c-R6 | Blind critic (refs Bevel IMG_6856-6859) | stalled: 3 rounds x 3 runs (refs Bevel IMG_6856-6859): r1 ranks 1/1/1 scores 7/7/7; r2 1/1/1 6.5/7.5/7; r3 1/1/1 7/7.5/7. Remaining critiques: macro hues (Q18), the drawn bowl illustration. Fix commits 8ebaafd, 3b11eab (ring arc now equals 1,240 of 1,950) |

## Production rows created by the run (F3)

| When | Table / type | Id | Why | Deleted |
|---|---|---|---|---|
