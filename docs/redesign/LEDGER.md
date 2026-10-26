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
| S2-01 | Tab capsule (Home, Food, Train, Geo) + orb, every app screen | pending |
| S2-02 | + sheet (Tell Geo + log grid) | pending |
| S2-03 | Main-tab header (large title, condenses) | pending |
| S2-04 | Pushed-screen header (centred title, round back) | pending |
| S2-05 | Home default (returning user) | pending |
| S2-06 | Home first run (no logs, no plan) | pending |
| S2-07 | Home loading (skeleton) | pending |
| S2-08 | Home error | pending |
| S2-09 | Home offline | pending |
| S2-10 | Home long text | pending |
| S2-11 | Home Health tiles: connected / not connected / no data today | pending |
| S2-12 | Home check-in due card | pending |
| S2-13 | Home quick-log sheets (water, weight, sleep, mood, energy) | pending |
| S2-14 | Macro breakdown sheet | pending |
| S2-15 | Splash | pending |
| S2-16 | Notifications prompt | pending |
| S2-17 | Health connect sheet | pending |
| S2-18 | T: tab switch | pending |
| S2-19 | T: + sheet open/close | pending |
| S2-20 | T: Home load (ring draw, count-up) | pending |
| S2-R1 | R1 core-job metrics | pending |
| S2-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S2-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S2-R4 | R4 frame-diff 0 pops | pending |
| S2-R5 | R5 60 fps on fiqr_lowend | pending |
| S2-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S2-R7 | R7 copy list approved | pending |
| S2-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S3 logging

| ID | Item | Status |
|---|---|---|
| S3-01 | Log food search | pending |
| S3-02 | Log food photo | pending |
| S3-03 | Food search sheet | pending |
| S3-04 | Log weight | pending |
| S3-05 | Log water | pending |
| S3-06 | Log sleep | pending |
| S3-07 | Log mood | pending |
| S3-08 | Log energy | pending |
| S3-09 | Log workout (manual) | pending |
| S3-10 | Log chooser /logs | pending |
| S3-11 | Log list actions | pending |
| S3-12 | Food database /foods | pending |
| S3-13 | T: log save | pending |
| S3-R1 | R1 core-job metrics | pending |
| S3-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S3-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S3-R4 | R4 frame-diff 0 pops | pending |
| S3-R5 | R5 60 fps on fiqr_lowend | pending |
| S3-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S3-R7 | R7 copy list approved | pending |
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
| S5-01 | Food diary /food | pending |
| S5-02 | Month view sheet | pending |
| S5-03 | Copy meal dialog | pending |
| S5-04 | Name favourite dialog | pending |
| S5-05 | T: day change on week strip | pending |
| S5-R1 | R1 core-job metrics | pending |
| S5-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S5-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S5-R4 | R4 frame-diff 0 pops | pending |
| S5-R5 | R5 60 fps on fiqr_lowend | pending |
| S5-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S5-R7 | R7 copy list approved | pending |
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
| S7-01 | Plans list | pending |
| S7-02 | Plan detail workout | pending |
| S7-03 | Plan detail meal | pending |
| S7-04 | Meal plan builder | pending |
| S7-05 | Workout plan builder | pending |
| S7-06 | Edit program | pending |
| S7-07 | T: push to detail | pending |
| S7-R1 | R1 core-job metrics | pending |
| S7-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S7-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S7-R4 | R4 frame-diff 0 pops | pending |
| S7-R5 | R5 60 fps on fiqr_lowend | pending |
| S7-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S7-R7 | R7 copy list approved | pending |
| S7-R8 | R8 AGENTS laws, palette grep, lint/type/test | pending |

## S8 Check-in

| ID | Item | Status |
|---|---|---|
| S8-01 | Check-in due | pending |
| S8-02 | Check-in mid-week | pending |
| S8-03 | Check-in not enough data | pending |
| S8-04 | T: check-in load (count-up, trend draw) | pending |
| S8-R1 | R1 core-job metrics | pending |
| S8-R2 | R2 states captured (web 390/360, iOS, Android) | pending |
| S8-R3 | R3 axe 0 / contrast / 44 pt | pending |
| S8-R4 | R4 frame-diff 0 pops | pending |
| S8-R5 | R5 60 fps on fiqr_lowend | pending |
| S8-R6 | R6 blind critic (top 3 of 5, >= 8/10, 3 runs) | pending |
| S8-R7 | R7 copy list approved | pending |
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
| S10-01 | Admin dashboard token pass | pending |
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
