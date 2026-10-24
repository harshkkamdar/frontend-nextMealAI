# Redesign progress

Brief: `docs/redesign/BRIEF.md`. Branch `redesign/fiqr-v2` (from `phase2/fiqr` at 832302c).

## Current

Phase 5, slice 1 (first run: welcome carousel, auth, onboarding steps, consent, generating, plan reveal). Phase 4 done: `design-system.md` (tokens, type, glass, motion), tokens in `globals.css`, `src/lib/motion.ts`, `src/lib/platform/glass.ts` (+ test). Tab bar prototype measured on `fiqr_lowend`: glass on fails (150-200 ms freezes in 3/3 runs), opaque fallback passes; low-end auto-detects to opaque.

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
