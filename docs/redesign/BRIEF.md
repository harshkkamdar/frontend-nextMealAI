# FIQR redesign brief

Goal: redesign the FIQR app end to end (all 33 routes, every component and state) so that the core jobs are measurably faster and the app reads as hand-crafted, Apple-native-feeling work, verified by real users and frame-level evidence, not by the agent's own opinion.

## Read first

AGENTS.md (design and architecture rules are binding), SOUL.md, docs/phase2/SOW.md, docs/phase2/design-decisions-2026-09-17.md, docs/phase2/D2-LEDGER.md, CLIENT_FEEDBACK_PLAN.md, scripts/d2-capture.mjs and scripts/d2-compare.mjs (reuse them). The app is a Next.js static export in Capacitor (iOS + Android WebView), so native Liquid Glass must be approximated in CSS and must stay fast on low-end Android.

## Phase 0 - Raw material (no design yet)

Checkpoint: Ved reviews docs/redesign/.

1. Capture current FIQR on the iOS simulator and an Android emulator: every route x every state (empty, loading, error, offline, long text, first run, returning user). Build a screen/state matrix in docs/redesign/inventory.md.
2. Measure the core jobs today: log a meal, read today's calories and macros, talk to Geo, finish onboarding. Record taps and seconds per job as the baseline in docs/redesign/baseline.md.
3. Tear down the references in "/Users/veddsavla/Downloads/inspiration for FIQR" (BEVEL: glass materials, tab/menu bar, cards, hierarchy; CAL AI: onboarding flow and pacing). Read every image. For each, write what it does, why it works, and whether FIQR should adopt, adapt or reject it, in docs/redesign/teardown.md. If Ved provides screen recordings, dump frames with ffmpeg and extract real durations and easing.
4. Read primary sources: Apple HIG (Materials, Liquid Glass), WWDC25 "Meet Liquid Glass", and the full Lenny article "How to turn your AI into a world-class designer" (all 8 techniques). Verify skill repos (emilkowalski/skills apple-design, impeccable, ui-ux-pro-max, frontend-design, uncodixify, no-ai-slop, hairline) exist and read them before installing; report which are real in docs/redesign/sources.md.

## Phase 1 - Grill Ved

Use /mattpocock-skills:grill-me, in rounds, each question with a recommended answer, using the inventory and teardown as evidence. Must resolve: which conflicts between Bevel/Cal AI and AGENTS.md we accept (translucent tints of brand colours only? Archivo only? one orange action?), what we cut, what is out of scope, and the one-sentence goal. Stop when Ved confirms it.

## Phase 2 - Agree in writing

Objective, metrics, reference examples of "great", and the grading rubric below. List decisions that are costly to reverse (navigation model, tab bar, glass material, onboarding flow) and get Ved's yes on each. Record in docs/redesign/decisions.md.

## Phase 3 - Directions

Use seed strings to generate 2-3 genuinely different directions inside our palette and font. Render the home screen, the log flow and one onboarding step for each. Ved picks one.

## Phase 4 - Design system before pages

Tailwind 4 tokens (spacing, Archivo type scale, radius, elevation), a glass material spec using only alpha tints of #111C35 / #E8622A / #FDF6EC / #FFFFFF, and a motion spec (framer-motion springs with stated values). Prototype the glass tab bar first and measure its frame timing on Android before going further.

## Phase 5 - Build in slices

Order: onboarding, today/home, logging, Geo chat, diary, plans, check-in, settings, admin last. Each slice: build, capture, run the critic loop, fix, then checkpoint with Ved.

Critic loop: a fresh subagent sees only screenshots of our screen next to the reference screenshots, never code. It ranks them on the fixed rubric and penalises AI tells (generic gradients, glows, needless containers, over-explaining copy). Use the same critic prompt every run.

Rewrite all copy to hand-written standard; cut any element that does not earn its place. Commit per slice; never edit CHANGELOG.md.

## Grading rubric (all must pass per slice)

- Core-job taps and seconds at or below baseline, with a target Ved approves in Phase 2.
- Every state in the inventory rendered and captured.
- WCAG AA contrast computed, tap targets at least 44pt.
- Transitions recorded on the simulator, frames dumped, zero visible pops or hitches in the frame diff; 60fps on the low-end Android device.
- Critic ranks our screen at or above the references for polish, three runs in a row with the same prompt.
- Lint, type-check and tests pass; AGENTS.md rules hold (no next/image, no dark mode, no new colours, one orange action).

## Phase 6 - Proof outside the agent and Ved

Write a 5-person timed task script (old build vs new) for Ved to run, and a before/after capture sheet for the client. Report what passed, what failed and where progress stalled; never claim done without the evidence.

## Progress log

Keep docs/redesign/PROGRESS.md current: phase, slice, last measurement, open checkpoint.

## Additions agreed in Phase 1 (24 Oct 2026)

Binding in addition to the phases above; full list in `decisions.md`.

- **Health data on Home.** Steps, weight and sleep tiles read from Apple Health on iOS and Health Connect on Android through the existing sync (`src/lib/platform/health.ts`, SOW D11). Water stays a manual log. Each tile has connected, not-connected (one tap to connect) and no-data-today states, and the sync is verified on the iOS simulator with seeded Health data and on the Android emulator with Health Connect.
- **Welcome carousel** before sign-up (4 slides, live mini-components), added to the inventory as a new route and slice.
- **Performance targets** (Q21 and round 4) are part of the rubric for every slice.
