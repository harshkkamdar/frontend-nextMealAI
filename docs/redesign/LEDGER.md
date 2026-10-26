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
| S2-11 | Home Health tiles: connected / not connected / no data today | pending |
| S2-12 | Home check-in due card | built 30959c3; home-checkin-due-*.png (one orange: See your week) |
| S2-13 | Home quick-log sheets (water, weight, sleep, mood, energy) | built 30959c3 (quick-log-sheet.tsx); quicklog-weight/water/sleep-*.png |
| S2-14 | Macro breakdown sheet | built 30959c3; macro-sheet-*.png |
| S2-15 | Splash | pending |
| S2-16 | Notifications prompt | pending |
| S2-17 | Health connect sheet | pending |
| S2-18 | T: tab switch | pending |
| S2-19 | T: + sheet open/close | built ad99c26: tab switch fades, push enters from the right with the page spring and the outgoing page overlapping; frame-diff smooth on a production build |
| S2-20 | T: Home load (ring draw, count-up) | built 4b3ffd5 (layered first-paint entrance: hero scale, tiles +12 px 40 ms apart, rows +8 px 30 ms apart; count-ups on motion values; still on revisit) |
| S2-R1 | R1 core-job metrics | pending |
| S2-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S2-R3 | R3 axe 0 / contrast / 44 pt | pending |
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
| S3-12 | Food database /foods | pending |
| S3-13 | T: log save | built 442e20f; transitions food-search-results, food-select-tray, photo-tray smooth; water-save and food-log-save popped on the old shared route frame, fixed in ad99c26 (re-record pending) |
| S3-R1 | R1 core-job metrics | built 442e20f: J1 log by search = 4 taps (orb, Search, result, Log meal); seconds pending the Phase 6 timed test |
| S3-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S3-R3 | R3 axe 0 / contrast / 44 pt | built 442e20f: axe serious/critical 0, small 0, orange <= 1 on 138 checks (screens/slice-3/checks.json) |
| S3-R4 | R4 frame-diff 0 pops | pending |
| S3-R5 | R5 60 fps on fiqr_lowend | pending |
| S3-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S3-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-3.md? Also: food search sheet moved to the inset sheet (no snap levels); /foods lost the orange Add (round + in header); recent-log right value only for food and workouts |
| S3-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S4 Geo tab

| ID | Item | Status |
|---|---|---|
| S4-01 | Geo chat list | pending |
| S4-02 | Geo chat session | pending |
| S4-03 | Geo companion sheet | pending |
| S4-04 | Report response sheet | pending |
| S4-05 | Chat session list actions | pending |
| S4-06 | T: push to session | pending |
| S4-R1 | R1 core-job metrics | pending |
| S4-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S4-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S4-R4 | R4 frame-diff 0 pops | pending |
| S4-R5 | R5 60 fps on fiqr_lowend | pending |
| S4-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S4-R7 | R7 copy list approved | pending |
| S4-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S5 Food diary

| ID | Item | Status |
|---|---|---|
| S5-01 | Food diary /food | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-02 | Month view sheet | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-03 | Copy meal dialog | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-04 | Name favourite dialog | built 30190d3, bcd3dfa; screens/slice-5/ (18 shots x 2, axe 0, small 0, orange <= 1) |
| S5-05 | T: day change on week strip | built bcd3dfa; day-change, day-change-back, week-swipe, month-open smooth; row-actions-open (shared sheet) popped on the busy dev server, re-check on a production build pending |
| S5-R1 | R1 core-job metrics | pending |
| S5-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S5-R3 | R3 axe 0 / contrast / 44 pt | built bcd3dfa: axe 0, small 0, orange <= 1 on 36 checks |
| S5-R4 | R4 frame-diff 0 pops | pending |
| S5-R5 | R5 60 fps on fiqr_lowend | pending |
| S5-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S5-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-5.md? Also: the sticky orange Log food button was removed (Add food rows, dashed slots and the orb cover it) - OK? |
| S5-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S6 Train + live session

| ID | Item | Status |
|---|---|---|
| S6-01 | Train /train | pending |
| S6-02 | Live session | pending |
| S6-03 | Rest timer (pinned, minimised) | pending |
| S6-04 | Target-muscle map (C7) | pending |
| S6-05 | T: set tick | pending |
| S6-06 | T: start session | pending |
| S6-R1 | R1 core-job metrics | pending |
| S6-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S6-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S6-R4 | R4 frame-diff 0 pops | pending |
| S6-R5 | R5 60 fps on fiqr_lowend | pending |
| S6-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S6-R7 | R7 copy list approved | pending |
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
| S7-R1 | R1 core-job metrics | pending |
| S7-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S7-R3 | R3 axe 0 / contrast / 44 pt | built 56e322c: axe 0, small 0, orange <= 1 on 68 checks |
| S7-R4 | R4 frame-diff 0 pops | pending |
| S7-R5 | R5 60 fps on fiqr_lowend | pending |
| S7-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S7-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-7.md? Also: new Earlier plans list is an extra non-blocking getPlans() read (Q6 says no data-flow change) - keep or drop? Cancel removed from builders (Back does it) - OK? |
| S7-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S8 Check-in

| ID | Item | Status |
|---|---|---|
| S8-01 | Check-in due | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-02 | Check-in mid-week | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-03 | Check-in not enough data | built cf1252b, 46b8db8; screens/slice-8/ (19 shots x 2, axe 0, small 0, orange <= 1) |
| S8-04 | T: check-in load (count-up, trend draw) | built cf1252b; apply smooth; the pushes popped on the old shared route frame, fixed ad99c26 (lead re-record of Home to check-in: smooth, screens/slice-2/transitions-lead/push-home-checkin) |
| S8-R1 | R1 core-job metrics | pending |
| S8-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S8-R3 | R3 axe 0 / contrast / 44 pt | built cf1252b: axe 0, small 0, orange <= 1 on 38 checks |
| S8-R4 | R4 frame-diff 0 pops | pending |
| S8-R5 | R5 60 fps on fiqr_lowend | pending |
| S8-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S8-R7 | R7 copy list approved | needs-owner: approve docs/redesign/copy/slice-8.md? After Apply the screen keeps the applied week until you leave - OK? Settings button dropped from check-in - OK? Health wording "Includes Apple Health weigh-ins" - OK? |
| S8-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S9 Settings and the rest

| ID | Item | Status |
|---|---|---|
| S9-01 | Settings | pending |
| S9-02 | Profile | pending |
| S9-03 | Account deletion sheet | pending |
| S9-04 | Paywall | pending |
| S9-05 | Privacy | pending |
| S9-06 | Support | pending |
| S9-07 | Delete account (public) | pending |
| S9-08 | 404 | pending |
| S9-09 | Crash boundary | pending |
| S9-10 | Confirm dialog | pending |
| S9-11 | Offline band | pending |
| S9-R1 | R1 core-job metrics | pending |
| S9-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S9-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S9-R4 | R4 frame-diff 0 pops | pending |
| S9-R5 | R5 60 fps on fiqr_lowend | pending |
| S9-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S9-R7 | R7 copy list approved | pending |
| S9-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S10 admin

| ID | Item | Status |
|---|---|---|
| S10-01 | Admin dashboard token pass | built de45f9b, 31bd13f (old aliases to v2 tokens in 8 admin files: card, ink-65, radii, macro tints; card-chrome test updated) |
| S10-R1 | R1 core-job metrics | pending |
| S10-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S10-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S10-R4 | R4 frame-diff 0 pops | pending |
| S10-R5 | R5 60 fps on fiqr_lowend | pending |
| S10-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S10-R7 | R7 copy list approved | pending |
| S10-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## Production rows created by the run (F3)

| When | Table / type | Id | Why | Deleted |
|---|---|---|---|---|
