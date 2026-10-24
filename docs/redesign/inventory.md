# Screen and state inventory (redesign Phase 0)

24 Oct 2026, branch `phase2/fiqr` at 832302c. Source of truth for "every route x every state". A redesign slice is not done until every cell it owns is captured in the after set.

## Coverage today

| Surface | Captured | Where |
|---|---|---|
| Web, 390x844 and 360x800 (Playwright, mobile emulation) | 350 captures, 41 D2 rows, states default/empty/loading/error/offline/long | `docs/phase2/screens/after/` (23 Oct, current code bar 832302c native fix) |
| iOS simulator | 4 shots: Home, Home scrolled, Food diary, Live session | `docs/phase2/screens/after/ios-sim/` |
| Android emulator | none | blocked: no Android SDK or emulator on this machine |

`scripts/d2-capture.mjs` needs `TEST_EMAIL` / `TEST_PASSWORD` and the core API on :4010; neither credential is available to the agent, so no new captures were taken in Phase 0. See "Blockers" at the end.

## States

`D` default, `E` empty, `Ld` loading, `Er` error, `Off` offline, `Lg` long text, `1st` first run (new account, no data, no plan), `Ret` returning user (weeks of data). `1st` and `Ret` are new for the redesign; the D2 script does not produce them yet (`E` approximates `1st` by emptying arrays, `D` on the test account approximates `Ret`).

Legend: `w` web capture exists at both widths, `-` state does not apply, `.` applies but not captured.

## Routes (33 `page.tsx`, 39 URLs once `/logs/new/[type]` expands)

| # | Route | Screen | D2 row | D | E | Ld | Er | Off | Lg | 1st | Ret | iOS | Android |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | redirect to `/welcome` (slice 1b; was `/login`) | - | - | - | - | - | - | - | - | - | - | - |
| 2 | `/login` | Login | D2-25 | w | - | - | w | . | - | - | - | . | . |
| 3 | `/signup` | Sign-up | D2-26 | w | - | - | w | . | - | - | - | . | . |
| 4 | `/forgot-password` | Password reset, request | D2-27 | w | - | - | w | . | - | - | - | . | . |
| 5 | `/reset-password` | Password reset, new | D2-27b | w | - | - | . | . | - | - | - | . | . |
| 6 | `/onboarding/personal` | Onboarding 1 | D2-23 | w | - | - | . | . | w | . | - | . | . |
| 7 | `/onboarding/fitness` | Onboarding 2 | D2-23b | w | - | - | . | . | w | . | - | . | . |
| 8 | `/onboarding/nutrition` | Onboarding 3 | D2-23c | w | - | - | . | . | w | . | - | . | . |
| 9 | `/onboarding/review` | Onboarding review | D2-23d | w | - | . | . | . | w | . | - | . | . |
| 10 | `/onboarding/generating` | Plan generating | **none** | . | - | . | . | . | - | . | - | . | . |
| 11 | `/onboarding/consent` | AI consent | D2-24 | w | - | - | . | . | w | . | - | . | . |
| 12 | `/dashboard` | Home | D2-01 | w | w | w | w | w | w | . | . | 2 shots | . |
| 13 | `/check-in` | Check-in due / mid-week / not enough data | D2-02..04 | w | w | w | w | w | w | . | . | . | . |
| 14 | `/food` | Food diary | D2-05 | w | w | w | w | w | w | . | . | 1 shot | . |
| 15 | `/logs/new/food` | Log food: search, photo | D2-06, 07 | w | w | w | w | w | w | . | . | . | . |
| 16 | `/logs/new/weight` | Log weight | D2-09 | w | w | w | w | w | w | . | . | . | . |
| 17 | `/logs/new/water` | Log water | D2-10 | w | w | w | w | w | w | . | . | . | . |
| 18 | `/logs/new/sleep` | Log sleep | D2-11 | w | w | w | w | w | w | . | . | . | . |
| 19 | `/logs/new/mood` | Log mood | D2-12 | w | w | w | w | w | w | . | . | . | . |
| 20 | `/logs/new/energy` | Log energy | D2-13 | w | w | w | w | w | w | . | . | . | . |
| 21 | `/logs/new/workout` | Log workout (manual) | **none** | . | . | . | . | . | . | . | . | . | . |
| 22 | `/logs` | Log chooser | D2-14 | w | w | w | w | w | w | . | . | . | . |
| 23 | `/foods` | Food database | D2-15 | w | w | w | w | w | w | . | . | . | . |
| 24 | `/train` | Train | D2-16 | w | w | w | w | w | w | . | . | . | . |
| 25 | `/train/session` | Live session | D2-17 | w | w | w | w | w | w | . | . | 1 shot | . |
| 26 | `/plans` | Plans list | D2-18 | w | w | w | w | w | w | . | . | . | . |
| 27 | `/plans/view` | Plan detail, workout / meal | D2-19, 19b | w | w | w | w | w | w | . | . | . | . |
| 28 | `/plans/new/meal` | Meal plan builder | D2-20 | w | - | - | . | . | w | - | - | . | . |
| 29 | `/plans/new/workout` | Workout plan builder | D2-20b | w | - | - | . | . | w | - | - | . | . |
| 30 | `/plans/edit` | Edit program | D2-20c | w | w | w | w | w | w | - | - | . | . |
| 31 | `/chat` | Geo chat list | D2-21 | w | w | w | w | w | w | . | . | . | . |
| 32 | `/chat/session` | Geo chat session (+ menu scan prefill D2-08) | D2-21b, 08 | w | w | w | w | w | w | . | . | . | . |
| 33 | `/settings` | Settings | D2-28 | w | w | w | w | w | w | - | - | . | . |
| 34 | `/settings/profile` | Profile | D2-29 | w | w | w | w | w | w | - | - | . | . |
| 35 | `/paywall` | Paywall (D10) | **none** | . | - | . | . | . | - | . | - | . | . |
| 36 | `/privacy` | Privacy | D2-30 | w | - | - | - | . | - | - | - | . | . |
| 37 | `/support` | Support | D2-31 | w | - | - | - | . | - | - | - | . | . |
| 38 | `/delete-account` | Account deletion (public) | D2-32 | w | - | - | . | . | - | - | - | . | . |
| 39 | `/admin` | Admin dashboard (web only) | **none** | . | . | . | . | . | . | - | - | - | - |
| + | `not-found`, `error.tsx` | 404, crash boundary | none | . | - | - | - | - | - | - | - | . | . |

## Overlays (sheets, dialogs, prompts) with no route of their own

| Overlay | Component | Opened from | Captured |
|---|---|---|---|
| Geo companion sheet | `geo/geo-companion-sheet` | nav "Talk to Geo" (every app screen) | w (D2-22: D, Off, Lg) |
| Account deletion sheet | `settings/delete-account-sheet` | Settings | w (D2-32b: D) |
| Macro breakdown sheet | `shared/macro-breakdown-sheet` | Home macro bars | . |
| Food search sheet | `diary/food-search-sheet` | Food diary | . |
| Month view sheet | `diary/month-view-sheet` | Food diary calendar | . |
| Copy meal dialog | `diary/copy-meal-dialog` | Meal row overflow | . |
| Name favourite dialog | `shared/name-favourite-dialog` | Meal row overflow | . |
| Confirm dialog | `shared/confirm-dialog` | deletes, discard session | . |
| Report response sheet | `chat/report-sheet` | Geo message | . |
| Chat session list actions | `chat/session-list` | Geo chat list kebab | . |
| Log list actions | `logs/log-list` | Log chooser recent rows | . |
| Home quick-log sheets (water, weight, sleep, mood) | inline in `dashboard/page.tsx` | Home tiles | . |
| Rest timer (pinned and minimised) | `workout/rest-timer` | Live session | . |
| Health Connect / Apple Health sheet | `native/health-connect-sheet` | native only | . |
| Notifications prompt | `native/notifications-prompt` | native only | . |
| Offline band | `shared/offline-band` | any screen offline | w (inside Off captures) |
| Splash | `native/splash-hider` + native splash | app launch | . |

## Shared components every slice touches

Bottom nav (4 tabs + Talk to Geo), PageHeader, PrimaryButton, SecondaryButton, ActionCard, FeatureCard, MetricTile, MacroBar, Chip, SectionLabel, GeoLine, ErrorState, EmptyState, CardSkeleton, CalendarStrip, BottomSheet, ResizableSheet, Input, OfflineBand, Wordmark.

## Gaps the redesign capture set must close

1. Rows with no D2 capture: `/onboarding/generating`, `/logs/new/workout`, `/paywall`, `/admin`, 404 and crash boundary.
2. Every overlay above marked `.`.
3. `1st` and `Ret` states on every data screen (needs a fresh test account and a seeded one).
4. Native shells: every row on the iOS simulator and an Android emulator, at least `D`, `E`, `Off`, plus keyboard-open for every form.
5. Transitions (none recorded anywhere yet): tab switch, push to detail, sheet open/close, Geo sheet, log-food tray, onboarding step to step.

## Blockers

- **Android**: no Android SDK, emulator or AVD on this Mac (`emulator` not on PATH, `~/Library/Android/sdk` missing, `adb devices` empty). Needs Android Studio (or `sdkmanager`) plus a low-end AVD profile, or a real low-end phone over USB.
- **Test account**: `TEST_EMAIL` / `TEST_PASSWORD` are not set and not stored anywhere the agent may read. Also needed: a second, fresh account for `1st` captures.
- **Core API**: must run locally on :4010 (`cd packages/core && PORT=4010 npx tsx --env-file=../../.env src/index.ts` in the backend repo, per `docs/phase2/HANDOFF.md`).


## Added in slice 1b (24 Oct 2026)

- `/welcome`: 4-slide welcome carousel (Food, Train, Geo, Check-in) before sign-up. States: each slide, offline (static, no network use). Captured web 390/360, iOS simulator, Android emulator (`screens/slice-1b/`).
- `/forgot-password` gains a "Check your email" state (replaces a toast).
