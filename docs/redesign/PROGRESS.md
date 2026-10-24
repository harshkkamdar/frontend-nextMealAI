# Redesign progress

Brief: `docs/redesign/BRIEF.md`. Branch `redesign/fiqr-v2` (from `phase2/fiqr` at 832302c).

## Current

Phase 5, slice 1b (welcome carousel and sign-in) at its checkpoint for Ved, together with the slice 1a feel pass. See "Phase 5, slice 1b" below.

## Phase 0

| Item | File | Status |
|---|---|---|
| Route x state matrix | `inventory.md` | written from code and the 350 existing web captures; no new device captures (blocked, see below) |
| Core-job baseline | `baseline.md` | taps counted from code; seconds not measured (blocked) |
| Reference teardown | `teardown.md` + `teardown/` | done: 101/101 images, per-image verdicts; 2 images re-checked by lead (match); 1 agent error fixed (height is collected) |
| Primary sources and skill check | `sources.md` | done: 91 links; HIG quotes "Don't use Liquid Glass in the content layer." and "Use Liquid Glass effects sparingly." re-verified by lead from Apple's JSON; Lenny techniques 7-8 paywalled (secondary summary only); `hairline` skill not found |

## Blockers

1. ~~No Android SDK, emulator or AVD on this Mac.~~ Resolved 24 Oct 2026: JDK 21 (`openjdk@21`), `android-commandlinetools`, emulator, API 30 arm64 image; AVD `fiqr_lowend` (Pixel 4a profile, 2 GB RAM, 2 cores). `ANDROID_HOME=$(brew --prefix)/share/android-commandlinetools`.
2. No test-account credentials available to the agent (`TEST_EMAIL`, `TEST_PASSWORD`), plus a fresh account for first-run captures.
3. ~~Core API must be started locally on :4010.~~ Running (returns 401 unauthenticated, as expected).

## Phase 4 measurements

| Check | Result |
|---|---|
| Tab bar prototype, low-end Android, glass on | fail: scroll stalls 183-200 ms in 3/3 runs |
| Same, glass off (auto on 2 cores) | pass: scroll median 2 janky frames in 4 s, tabs 0.5, sheet 2.5 across 8 transitions |
| lint / type-check / tests after tokens | 0 errors (27 pre-existing warnings) / pass / 436 passed, 1 skipped |
| Existing screens after the Archivo width-axis change | `/login` renders unchanged (screenshot checked) |

## Unrelated breakage found (not fixed, reported)

- Android build fails: `@flomentumsolutions/capacitor-health-extended` build.gradle line 51, "Could not find method kotlin()". Blocks running the real app on the emulator; needs a fix before Android captures of the app (prototype measured in emulator Chrome 91, same engine as the system WebView on that image).

## Phase 5, slice 1a: onboarding (checkpoint for Ved, 24 Oct 2026)

Scope: 18 one-question steps (`/onboarding/personal|fitness|nutrition?q=`), consent, generating, plan reveal. Old forms removed. Copy list: `copy/slice-1.md`.

| Rubric item | Measurement | Result |
|---|---|---|
| 1. Core-job taps (J4 onboarding) | 33 taps from sign-up to Today (was 24 + 7 typed fields), with auto-advance on 6 single-choice screens | **fail vs the approved <= 24**: one question per screen (Q5) costs a Continue tap per screen; conflict between two signed decisions, Ved to choose |
| 1. Core-job seconds | not measured: needs people or the real API (Phase 6 script) | open |
| 2. States captured | web 390 + 360: 90 captures (`screens/slice-1/`), every step empty + filled, long name, error, offline, consent, generating, reveal, reveal empty, reveal error; iOS simulator (Safari, iOS 26.5, iPhone 16 Pro): 23 (`ios/`); Android 15 emulator (Chrome 124): 20 (`android/`) | pass for web; iOS and Android cover every step's default state, not every error/offline state |
| 3. WCAG AA / 44 pt | axe serious/critical 0 of 90; tap targets under 44 px: 0; one orange action per screen: 90/90 | pass |
| 4. Frame-diffed transitions | 6 transitions recorded frame by frame (CDP screencast), 0 pops (`transitions/report.json`); two real pops found and fixed (no exit animation; CTA jumped 56 px because the slide widened the page) | pass (pop rule refined: a jump must be isolated to one frame; multi-frame colour changes count as motion; Ved to confirm) |
| 5. 60 fps on low-end Android | Android 11 / Chrome 91 numbers withdrawn: Tailwind 4 needs Chrome 111+, the page was unstyled. On Android 15 / Chrome 124 (2 cores, 2 GB) transitions drop 6-18 frames, **but the plain-CSS tab-bar prototype that passed before also drops 26-64 per run on this image**, and idle frames are clean; the JS profile is 88% idle | **blocked**: the emulator on this Mac cannot judge 60 fps; needs a real low-end phone |
| 6. Blind critic | 9 runs over 3 rounds, FIQR ranked 1st of 5 in 9/9, scores 6.5-7.0 (`screens/slice-1/critic.md`) | **stalled below 8/10** after three honest attempts |
| 7. Copy approved | `copy/slice-1.md` | waiting for Ved |
| 8. lint / type-check / tests | 0 errors (26 pre-existing warnings, one fewer than before) / pass / 441 passed, 1 skipped | pass |

Found while grading (not caused by the redesign):
- Tailwind CSS 4 needs Chrome 111+ / Safari 16.4+ (tailwindcss.com/docs/compatibility). Android phones whose System WebView is older render the whole app unstyled. Needs a minimum-WebView check or an update prompt.
- Android app build fails on the Health plugin (`kotlin()` in `@flomentumsolutions/capacitor-health-extended`), so captures use Chrome on the emulator, same engine as the WebView.

## Slice 1a feel pass (24 Oct 2026, after Ved's "feel is missing")

What changed, all transform/opacity only:
- Every step: the old question exits in 160 ms, then the question, why-line and body rise in 40 ms apart (`.rise`). No overlap (seen and fixed in the walkthrough frames).
- Options and number cells: press scale (0.97 / 0.94), the radio dot and check pop in, the selected card gets a 2 px ink outline and a soft lift. Options stagger in.
- Orange CTA: press scale 0.97.
- Date of birth: native date field replaced by month, day and year wheels (scroll-snap, haptic tick per row, keyboard arrows), as in Cal AI.
- Ruler: picker-style haptic tick (`selectionChanged`) and a glide onto the nearest tick when a fling settles.
- Reflection: a weight path chart draws in from today's weight to the target date (moving chart, Q13).
- Chips pop in; consent cards rise; the generating list shimmers until the real work returns; the reveal staggers the calories, macro tiles (bars grow) and training days.

| Check | Result |
|---|---|
| Walkthrough video (taps, wheels and ruler scrolls, mocked API) | `screens/slice-1/walkthrough.mp4`; 29 taps, 41 s scripted with 650 ms pauses (`walkthrough.json`) |
| Captures, axe / small targets / orange | 90 web captures: 0 / 0 / at most one orange action on 90 of 90 (0 where the CTA is disabled) |
| Frame-diffed transitions | 6 of 6 smooth, 0 pops |
| iOS simulator (Safari, real WebKit) | 23 captures redone (`ios/`); wheels driven in Safari save the right date (1992-07-01) |
| lint / type-check / tests | 0 errors (26 pre-existing warnings) / pass / 443 passed, 1 skipped (2 new wheel tests) |
| 60 fps | still blocked on a real low-end phone |

## Phase 5, slice 1b: welcome and sign-in (checkpoint for Ved, 24 Oct 2026)

Scope: new `/welcome` (4 slides, live mini-components: calorie ring and macro bars fill, rest timer rolls its digits, chat question then typing then reply, weight line draws, workouts meter fills), `/` now opens it; `/login`, `/signup`, `/forgot-password` (new "Check your email" state), `/reset-password` moved onto the one-question shell (round back, big title, fixed CTA, inline errors, shake on a failed sign-in, Show/Hide on passwords, live 8-character tick). Route changes in slice 1 now fade through cream (`src/lib/page-transition.ts`) instead of cutting. Copy list: `copy/slice-1b.md`.

| Rubric item | Measurement | Result |
|---|---|---|
| 1. Core-job taps | Sign-up path: welcome adds 0 required taps ("Get started" is one tap whether you swipe or not; swiping replaces Continue). Sign-up form unchanged: 3 fields + 1 tap | pass (no added taps beyond the welcome's single Get started, agreed in Q20) |
| 2. States captured | web 390 + 360: 42 captures (welcome 1-4 + offline, login empty/filled/invalid/API error/offline, sign-up empty/filled/invalid/API error, forgot empty/invalid/sent, reset expired/valid/invalid/API error); iOS simulator Safari: 9; Android 15 emulator Chrome 124: 9 | pass for web; devices cover each screen's default state |
| 3. WCAG AA / 44 pt / orange | axe serious/critical 0; small targets 0; orange actions per screen at most 1 on 42/42 (0 on welcome 1-3 by design, ink Continue) | pass |
| 4. Frame-diffed transitions | 5 transitions (welcome Continue, welcome to last slide, welcome to sign-in, failed sign-in, forgot sent) plus slice 1a's 6 re-run: 11 of 11 smooth. Fixed on the way: route hard cut (now fade-through), CTA jumping 48 px when a secondary action appears (slot now grows), Geo card growing mid-sequence, timer digits swapping in one frame (now roll). The late-change check now applies E3 (one-frame only) | pass |
| 5. 60 fps low-end Android | not measured | blocked, same as 1a (needs a real phone) |
| 6. Blind critic | 9 runs over 3 rounds vs Bevel IMG_6856-6859 (`screens/slice-1b/critic.md`): ranks 4/2/3, 1/3/1, 3/2/1; scores 6.5-8.0 | rank bar pass (top 3 in runs 4-9); **score bar stalled below 8/10** after three honest attempts |
| 7. Copy approved | `copy/slice-1b.md` | waiting for Ved |
| 8. lint / type-check / tests | 0 errors (25 pre-existing warnings) / pass / 445 passed, 1 skipped (new: auth form tests, wheel tests) | pass |

Device notes: iOS Safari's toolbar leaves about 660 px; the welcome got a compact layout under 740 px tall (also covers iPhone SE). The Android emulator showed system ANR dialogs (Messages, System UI) from load; Messages was disabled on the emulator and the dialog dismissed. Not FIQR.

Not changed (Q6, no behaviour changes): the confirm-password field stays. Option for Ved: drop it, since Show/Hide now covers typos.
