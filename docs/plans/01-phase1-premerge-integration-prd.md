# PRD: Phase 1 Pre-Merge Integration (FB-08 ↔ FB-15)

## Story 01: Plan name displayed on detail views

**As a** end_user
**I want** to see the name I gave my workout or meal plan when viewing its details
**so that** I can distinguish between multiple plans without relying on dates alone

### INVEST check
- [x] Independent — touches only type definitions + detail components; no dependency on prefill or rebase
- [x] Negotiable — describes what (show name), not how
- [x] Valuable — user sees their chosen plan name in the header
- [x] Estimable — ~2 hours: 2 type fields + 2 component conditionals + 2 tests
- [x] Small — well under 1 day
- [x] Testable — all AC are strict Given/When/Then

### Acceptance Criteria

**Happy path**
- [ ] **AC01.1** — Given a workout plan with `content.name = "Push Pull Legs"`, when the user views the plan detail, then the header displays "Push Pull Legs" instead of "Workout Plan"
- [ ] **AC01.2** — Given a meal plan with `content.name = "Cut Phase"`, when the user views the plan detail, then the header displays "Cut Phase" instead of "Meal Plan"

**Fallback**
- [ ] **AC01.3** — Given a workout plan with no `content.name` field (undefined), when the user views the plan detail, then the header displays the default "Workout Plan"
- [ ] **AC01.4** — Given a meal plan with `content.name` set to an empty string, when the user views the plan detail, then the header displays the default "Meal Plan"

**Edge cases (8 categories)**
- [ ] **AC01.5** (empty state): Covered by AC01.3/AC01.4 — absence of name field falls back to default title
- [ ] **AC01.6** (error state): N/A — name is a read-only field from existing JSONB; no fetch involved beyond the plan load that already has error handling
- [ ] **AC01.7** (permission denied): N/A — plan detail access control is unchanged; this story only changes display
- [ ] **AC01.8** (concurrent action): N/A — read-only rendering; no mutation
- [ ] **AC01.9** (boundary values): Given a plan with `content.name` = a 200-character string, when the user views the plan detail, then the full name renders without layout breakage (text truncation via CSS is acceptable)
- [ ] **AC01.10** (network failure): N/A — name comes from the already-loaded plan object
- [ ] **AC01.11** (invalid input): N/A — name is persisted server-side via JSONB passthrough; no client-side write in this story
- [ ] **AC01.12** (race condition): N/A — read-only rendering

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01.1 | _(Phase 6)_ | | |
| AC01.2 | _(Phase 6)_ | | |
| AC01.3 | _(Phase 6)_ | | |
| AC01.4 | _(Phase 6)_ | | |

### Notes
- Types: `src/types/plans.types.ts` — add `name?: string` to both content shapes
- Components: `workout-plan-detail.tsx` line 77, `meal-plan-detail.tsx` line 43 — conditional render
- Reusable: `fromInitial` in workout-plan-builder already reads `content.name` via cast — the type fix makes that cast unnecessary

---

## Story 02: Builder pre-populated from workout screenshot preview

**As a** end_user
**I want** to edit a workout program extracted from a screenshot by having it pre-fill the plan builder
**so that** I can adjust the AI-generated program before saving, rather than rebuilding from scratch

### INVEST check
- [x] Independent — depends on FB-08 builder + FB-15 preview card existing (both impl-complete); no dependency on Story 01
- [x] Negotiable — describes outcome (pre-filled builder), not mechanism
- [x] Valuable — saves user from re-entering an entire workout program manually
- [x] Estimable — ~3 hours: useSearchParams effect + decode + 2 test cases
- [x] Small — under 1 day
- [x] Testable — all AC are strict Given/When/Then

### Acceptance Criteria

**Happy path**
- [ ] **AC02.1** — Given the user navigates to the workout builder with a `prefill` query parameter containing a valid base64-encoded JSON payload (days array with exercises), when the builder mounts, then the builder state is seeded with the decoded days and exercises
- [ ] **AC02.2** — Given the builder is pre-filled from a screenshot preview, when the user modifies an exercise (e.g. changes reps), then the modification is preserved and the plan saves with the edited values

**Fallback / decode failures**
- [ ] **AC02.3** — Given the user navigates to the workout builder with a `prefill` parameter containing malformed base64, when the builder mounts, then the builder renders in empty/default state with no error shown to the user
- [ ] **AC02.4** — Given the user navigates to the workout builder with a `prefill` parameter containing valid base64 but invalid JSON structure (missing `days` array), when the builder mounts, then the builder renders in empty/default state with no error shown

**No prefill**
- [ ] **AC02.5** — Given the user navigates to the workout builder with no `prefill` query parameter, when the builder mounts, then the builder renders in the existing default empty state (no regression)

**Edge cases (8 categories)**
- [ ] **AC02.6** (empty state): Covered by AC02.5 — no prefill param = existing empty builder behavior
- [ ] **AC02.7** (error state): Covered by AC02.3/AC02.4 — decode failures silently fall back
- [ ] **AC02.8** (permission denied): N/A — builder access is unchanged; prefill is client-side decode only
- [ ] **AC02.9** (concurrent action): N/A — single-user client-side state initialization
- [ ] **AC02.10** (boundary values): Given a `prefill` payload with 14 days and 20 exercises per day, when the builder mounts, then all days and exercises render without data loss
- [ ] **AC02.11** (network failure): N/A — prefill is a query-param decode, no network call
- [ ] **AC02.12** (invalid input): Covered by AC02.3/AC02.4
- [ ] **AC02.13** (race condition): N/A — `useEffect` runs once on mount; no repeated triggers

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC02.1 | _(Phase 6)_ | | |
| AC02.3 | _(Phase 6)_ | | |
| AC02.5 | _(Phase 6)_ | | |

### Notes
- Wire point: `src/components/plans/workout-plan-builder.tsx` — add `useSearchParams` import, `useEffect` after state init
- FB-15 preview card routes to `/plans/new/workout?prefill=<b64>` — the shape is the same as `WorkoutPlan['content']` (days array)
- `fromInitial` already knows how to parse content into builder state — reuse its logic for the decoded prefill

---

## Story 03: FB-15 frontend rebased onto FB-08 (conflict resolution)

**As a** end_user
**I want** the screenshot-to-workout-program feature to use the same typed plan API as manual plan creation
**so that** both features share a single, type-safe `createPlan` function and don't ship duplicate code

### INVEST check
- [x] Independent — git operation only; no code changes beyond conflict resolution
- [x] Negotiable — outcome is "one createPlan, shared," not "rebase command X"
- [x] Valuable — prevents a runtime bug where two `createPlan` definitions could shadow each other, and user gets consistent plan creation behavior
- [x] Estimable — ~30 min: rebase + conflict resolution + test run
- [x] Small — well under 1 day
- [x] Testable — all AC are strict Given/When/Then

### Acceptance Criteria

- [ ] **AC03.1** — Given the `feat/fb-15-screenshot-program-frontend` branch is rebased onto `feat/fb-08-manual-plans`, when `src/lib/api/plans.api.ts` is inspected, then it contains exactly one `createPlan` export — FB-08's fully-typed discriminated-union version
- [ ] **AC03.2** — Given the rebased branch, when the full test suite runs, then all tests pass (FB-08's 97 + FB-15's 13 = expected ~110, accounting for shared baseline)
- [ ] **AC03.3** — Given the rebased branch, when `tsc --noEmit` runs, then it exits with zero errors

**Edge cases (8 categories)**
- AC03.4–AC03.11: N/A for all 8 categories — this is a git integration task with no runtime behavior change; the AC above verify the merge is clean.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC03.1 | manual inspection | `plans.api.ts` has one `createPlan` | |
| AC03.2 | full suite | `pnpm exec vitest run` | |
| AC03.3 | type check | `pnpm exec tsc --noEmit` | |
