# PRD: FB-05 follow-up — Rest timer bugfixes

**Tracker item:** FB-05 follow-up (P1, E5 — Workout Tracker & Programs)
**Created:** 2026-04-15
**Phase:** dev-flow Phase 3 (Story)
**Tier:** SMALL
**Status:** Approved

## Background

During human UAT of the already-built FB-05 rest timer work (round-02 shipped the component, `rest_seconds` plumbing, and previous-set hydration), three bugs surfaced in a live session against local dev:

1. **Session elapsed timer shows "10051:10"** — roughly 10,051 minutes (~7 days). Actual work time in the session was under a minute. This is a resumed-stale-session: the `in_progress` session was created days ago, never completed, and the elapsed counter blindly computes `Date.now() − started_at`.
2. **Tick-ahead loophole** — user can tick off more sets while the rest timer is running. The timer does not reset, react, or block the tick. User phrasing: "this is dumb logic.. loop hole, edge case."
3. **Last set of every exercise never triggers a rest timer** — even when there are more exercises to come, no rest is shown after the last set of an exercise. Current code early-returns before the `setShowRestTimer(true)` line whenever an exercise becomes fully complete.

All three are in `src/app/(app)/activity/workout/[sessionId]/page.tsx` and `src/components/workout/rest-timer.tsx`.

## Confirmed design decisions

- **Bug 1 fix strategy:** Cap the displayed elapsed at 6 hours. If computed elapsed > 6h when the page mounts, treat as a stale resumed session: PATCH the session's `started_at` server-side to "now" (best-effort, non-blocking) and reset the local display to 0. The lost work time is already unrecoverable; the user expectation is "timer shows my current work session."
- **Bug 2 fix strategy:** Force the RestTimer countdown to reset on every single set completion, even when `duration` doesn't change. Implemented by bumping a `restKey` state counter alongside `showRestTimer`/`restSeconds` on every `completeSet`, and making the RestTimer effect depend on that key via a `resetToken` prop. This means ticking set 2 within the same exercise restarts the countdown from full — the user cannot cheese through a workout by stacking ticks. No hard block on the tick (user might legitimately be correcting a misclick); the timer restart is the guardrail.
- **Bug 3 fix strategy:** Remove the early-return skip. When an exercise is fully complete, still fire the rest timer UNLESS this is also the last exercise in the session (in which case the workout is over and rest would be noise). Use `exIndex < exercises.length - 1` as the guard.
- **No backend change for bug 1.** A proper server-side fix (store total active seconds, pause on app blur, resume correctly) is a larger follow-up. The 6-hour cap is a pragmatic guardrail that fixes the visible bug without touching the session API.

## Why one story

All three bugs are in the same component family, discovered in the same UAT pass. Splitting is ceremony. They share a test file and a single PR.

---

## Story 01: Rest timer behaves correctly across all set-completion cases

**As an** end_user mid-workout
**I want** the rest timer to reset every time I tick a new set, appear after every exercise's last set (not just the first two), and not display a 10,000-minute elapsed counter when I resume an old session
**so that** I can trust the workout tracker to reflect what I'm actually doing

### INVEST check

- [x] Independent — frontend-only; no schema or backend changes
- [x] Negotiable — describes the behaviors, not the state shape
- [x] Valuable — user-reported in UAT, blocks trust in the workout tracker
- [x] Estimable — one page component + one timer component + three small changes
- [x] Small — <half day
- [x] Testable — every AC below is unit-testable with RTL and fake timers

### Acceptance Criteria

**Bug 1 — Elapsed counter runaway**

- [ ] **AC01.1** — Given a workout session whose `started_at` is more than 6 hours before `Date.now()`, when the page mounts, then the displayed elapsed time reads 0:00 initially (not the raw wall-clock delta) and a best-effort PATCH is sent to the session endpoint resetting `started_at` to the current time.
- [ ] **AC01.2** — Given a workout session whose `started_at` is within 6 hours of `Date.now()`, when the page mounts, then the displayed elapsed time reads the real wall-clock delta and no PATCH is sent.
- [ ] **AC01.3** — Given the PATCH to reset `started_at` fails (network error), when the page continues, then the timer display is still 0:00 and the user can complete the workout; the failure is logged but not user-facing.

**Bug 2 — Tick-ahead loophole**

- [ ] **AC01.4** — Given an active rest timer (from completing set 1 of Exercise A), when the user completes set 2 of the same exercise 5 seconds later, then the countdown resets to the full `rest_seconds` duration (not continues from the previous remaining time).
- [ ] **AC01.5** — Given an active rest timer (from completing set 1 of Exercise A, rest=90s), when the user completes set 1 of Exercise B (rest=60s), then the countdown switches to 60s full.
- [ ] **AC01.6** — Given an active rest timer, when the user UNCHECKS a previously-completed set (mistake correction), then the rest timer is unaffected (no reset, no hide — existing behavior).

**Bug 3 — Last set skips timer**

- [ ] **AC01.7** — Given an exercise with 3 sets where sets 1–2 are already completed, when the user completes set 3 and this is NOT the last exercise in the session, then a rest timer fires with the exercise's `rest_seconds` and the exercise status is marked `completed`.
- [ ] **AC01.8** — Given the user completes the last set of the LAST exercise in the session, when the handler runs, then no rest timer is shown (the workout is over) and the exercise status is marked `completed`.
- [ ] **AC01.9** — Given an exercise has only one set and it gets completed, when this is not the last exercise, then a rest timer fires before the user moves to the next exercise.

**Edge cases (8 categories)**

- [ ] **AC01.10** (empty state) — Given a session has zero exercises (edge guard), when the page mounts, then no crash, no rest timer, the handler returns early.
- [ ] **AC01.11** (error state) — Covered by AC01.3.
- [ ] **AC01.12** (permission denied) — Not applicable at this layer.
- [ ] **AC01.13** (concurrent action) — Given the user taps two set checkboxes rapidly, when both completeSet calls fire, then each bumps `restKey` and the timer ends up reflecting the second completion's rest_seconds.
- [ ] **AC01.14** (boundary values) — Given `rest_seconds` is 0 on an exercise, when completion fires, then no rest timer is shown (skip entirely rather than flashing a 0:00 countdown).
- [ ] **AC01.15** (network failure) — Covered by AC01.3 (PATCH failure tolerated).
- [ ] **AC01.16** (invalid input) — Not applicable (no user free-form input at this layer).
- [ ] **AC01.17** (race condition) — Covered by AC01.13.

### Test traceability

| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01.1 | src/components/workout/__tests__/workout-session-page.test.tsx | resets elapsed and PATCHes started_at when session is stale | _(Phase 6)_ |
| AC01.2 | src/components/workout/__tests__/workout-session-page.test.tsx | keeps elapsed when session is fresh | _(Phase 6)_ |
| AC01.3 | src/components/workout/__tests__/workout-session-page.test.tsx | tolerates PATCH failure on stale session | _(Phase 6)_ |
| AC01.4 | src/components/workout/__tests__/rest-timer.test.tsx | resets countdown on restKey change even with same duration | _(Phase 6)_ |
| AC01.5 | src/components/workout/__tests__/rest-timer.test.tsx | switches duration when moving between exercises | _(Phase 6)_ |
| AC01.6 | src/components/workout/__tests__/workout-session-page.test.tsx | uncheck does not reset rest timer | _(Phase 6)_ |
| AC01.7 | src/components/workout/__tests__/workout-session-page.test.tsx | last set of non-final exercise fires rest timer | _(Phase 6)_ |
| AC01.8 | src/components/workout/__tests__/workout-session-page.test.tsx | last set of final exercise does not fire rest timer | _(Phase 6)_ |
| AC01.9 | src/components/workout/__tests__/workout-session-page.test.tsx | single-set exercise fires rest timer on completion | _(Phase 6)_ |
| AC01.10 | _(edge guard, not unit-tested)_ | | N/A |
| AC01.13 | _(covered by AC01.4)_ | | N/A |
| AC01.14 | src/components/workout/__tests__/workout-session-page.test.tsx | zero rest_seconds skips timer | _(Phase 6)_ |
| AC01.15 | _(covered by AC01.3)_ | | N/A |

### Notes

- **Touch points:**
  - `src/app/(app)/activity/workout/[sessionId]/page.tsx:27-30, 59-70, 91-122, 192-198` — state, elapsed effect, completeSet, RestTimer render
  - `src/components/workout/rest-timer.tsx:6-43` — new `resetToken?: number` prop and effect dep
  - `src/lib/api/workout-sessions.api.ts` — reuse existing `updateWorkoutSession` PATCH (best-effort for started_at reset)
- **Reused:**
  - Existing RestTimer layout + countdown (no visual changes)
  - Existing `updateWorkoutSession` API
- **Out of scope:**
  - Server-side accurate total-active-time tracking (bigger follow-up)
  - Pause/resume on app background
  - Rest timer per-exercise customization UI
  - Animation on reset

## Summary

**1 story · 17 acceptance criteria · 5 categories N/A · 0 INVEST warnings**
