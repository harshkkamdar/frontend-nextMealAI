# Redesign progress

Brief: `docs/redesign/BRIEF.md`. Branch `redesign/fiqr-v2` (from `phase2/fiqr` at 832302c).

## Current

Phase 5, slice 1a (onboarding) at its checkpoint: built and graded, see "Phase 5, slice 1a" below. Two rubric items need Ved (tap target vs one-question-per-screen; copy), one is blocked (60 fps needs a real low-end phone), one stalled (critic 6.5-7.0 vs 8).

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
