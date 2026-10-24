# Redesign progress

Brief: `docs/redesign/BRIEF.md`. Branch `redesign/fiqr-v2` (from `phase2/fiqr` at 832302c).

## Current

Phase 3 (directions). Phase 2 signed by Ved 24 Oct 2026 ("yes to all": C1-C8, metrics, rubric). Open checkpoint after this phase: Ved picks one direction.

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
