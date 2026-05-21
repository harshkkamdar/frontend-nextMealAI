# FB-R6-16+17 FE · Resume label + resume state on Start Workout

**Status:** approved direction · Round 06 · Wave 1 · FE-only
**Owner:** Ved + Claude · 2026-05-21
**BE shipped:** 2026-05-21 (`0f5365a` idempotent startSession in `feat/round-06`)
**Source:** Surfaced during BE UAT 2026-05-21 — pressing Start twice created duplicate "0/5 exercises" history rows. BE made startSession idempotent; FE must consume it.
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-16+17 FE
**Files in scope:** `src/lib/api/workout-sessions.api.ts:4-6`, dashboard/activity Start Workout entrypoints (TBD in Phase 2), workout history list.

---

## Story 01: Resume an in-progress workout instead of starting a duplicate

**As an** end user who pressed Start, walked away, and came back
**I want** the workout entrypoint to recognize my in-progress session and resume it
**so that** I land back in my workout with my set state intact, instead of starting a fresh duplicate that pollutes my history with "0/5 exercises" rows.

### INVEST check
- [x] Independent — BE already shipped; no other FE story depends on this
- [x] Negotiable — describes resume outcome, not whether we use status code, prior `getInProgressSession()` query, or a cache check
- [x] Valuable — eliminates the "duplicate 0/5 rows" pollution George flagged; saves users from losing set state
- [x] Estimable — ~45 min including tests + label state derivation
- [x] Small — 2 files plus tests
- [x] Testable — label state and request count are mechanically observable

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-16+17-AC01** — Given the user has an in-progress workout session for today's plan_day_index, when the workout entrypoint is rendered, then the action label reads "Resume Workout" (not "Start Workout").
- [ ] **FE-R6-16+17-AC02** — Given the conditions of AC01, when the user activates the workout entrypoint, then the existing in-progress session is loaded with its prior set state — no new session row is created.
- [ ] **FE-R6-16+17-AC03** — Given the user has NO in-progress session for today's plan_day_index, when the workout entrypoint is rendered, then the action label reads "Start Workout".
- [ ] **FE-R6-16+17-AC04** — Given the conditions of AC03, when the user activates the entrypoint, then a new session is created (BE returns 201) and the user lands in a fresh workout view.

**Edge cases**
- [ ] **FE-R6-16+17-AC05** (empty state): Given no active plan, when the dashboard is rendered, then the workout entrypoint shows the existing "No workout plan yet" empty state (unchanged from today).
- [ ] **FE-R6-16+17-AC06** (error state): Given the in-progress lookup fails (network/500), when the entrypoint is rendered, then the label defaults to "Start Workout" and activating it proceeds with the BE call (whose idempotent behavior is the source of truth).
- [ ] **FE-R6-16+17-AC07** (permission denied): N/A — entrypoint is auth-gated upstream.
- [ ] **FE-R6-16+17-AC08** (concurrent action): Given two tabs both press the entrypoint in rapid succession with no prior in-progress session, when both requests reach BE, then both responses load the same session (BE returns 200 for the second) — no duplicate row appears in history.
- [ ] **FE-R6-16+17-AC09** (boundary values): Given today's plan_day_index lands on a rest day, when the entrypoint is rendered, then the rest-day card is shown (no Start/Resume label) — unchanged.
- [ ] **FE-R6-16+17-AC10** (network failure): Given the entrypoint is activated while offline, when the request fails, then the user is informed the request did not complete; no session is opened.
- [ ] **FE-R6-16+17-AC11** (invalid input): N/A — entrypoint takes no user-supplied input.
- [ ] **FE-R6-16+17-AC12** (race condition): Given the user double-taps the entrypoint, when the second tap fires before the first response, then exactly one session is opened (the same one for both taps); the workout history list shows that one row, never two.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01–AC12 | `src/components/dashboard/__tests__/workout-card.test.tsx` (new) + workout-sessions.api spec extension | one per AC | Phase 6 |

### Notes
- BE contract: `POST /v1/workout-sessions` returns 200 with existing session when one is in_progress for same (user, plan, plan_day_index); 201 with new session otherwise.
- Implementation shape (negotiable):
  - **Preferred:** call `getInProgressSession()` (already at `workout-sessions.api.ts:34`) on workout entrypoint render; derive label from result.
  - Alternative: extend `apiFetch` to surface status code on startSession; branch on 200 vs 201 inside the wrapper.
- Phase 2 research must locate the actual Start Workout button — `workout-card.tsx` is a `<Link href="/activity">`. Likely on `/activity` or `/activity/workout/[sessionId]`.
