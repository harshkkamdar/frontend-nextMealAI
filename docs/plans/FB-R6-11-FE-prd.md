# FB-R6-11 FE · "meal plan" → "nutrition plan" copy sweep

**Status:** approved direction · Round 06 · Wave 1 · FE-only
**Owner:** Ved + Claude · 2026-05-21
**Source:** George (via Harsh): *"'Meal plan' can be confusing… better suited to change it to 'nutrition plan' instead."*
**BE companion:** PR #13 (BE FB-R6-11) shipped 2026-05-20 — Geo's prompts now use "nutrition plan."
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-11 FE
**Files in scope:** 14 candidates from grep; user-facing strings only. Code identifiers, route segments, DB enums, var names unchanged. File renames out of scope this round (Q4 keep).

---

## Story 01: See consistent "nutrition plan" wording end-to-end

**As an** end user reading the app
**I want** every user-visible surface to say "nutrition plan" instead of "meal plan"
**so that** I understand the feature sets macro targets rather than composing meals — matching what Geo now says in chat.

### INVEST check
- [x] Independent — cosmetic; no downstream FE work depends on it
- [x] Negotiable — describes the wording outcome, not which files
- [x] Valuable — clarity of contract; aligns FE with BE-shipped Geo prompts so chat replies and UI don't disagree
- [x] Estimable — ~40 min including grep audit + tests
- [x] Small — string-only changes, repo-wide grep verifies completeness
- [x] Testable — a grep assertion plus targeted render tests can mechanically verify

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-11-FE-AC01** — Given the app is rendered in English, when any user-visible surface that previously read "meal plan" is shown, then it reads "nutrition plan" (matching capitalization preserved: `Meal plan` → `Nutrition plan`, `meal plan` → `nutrition plan`).
- [ ] **FE-R6-11-FE-AC02** — Given a repo-wide grep for `/[Mm]eal [Pp]lan/` against `src/**`, when the grep is run, then the only remaining matches are inside non-user-facing contexts (route segments, var/file/type identifiers, DB enum lookups, allowlisted test fixtures).

**Edge cases**
- [ ] **FE-R6-11-FE-AC03** (empty state): Given a surface displaying "No meal plan yet" before the change, when rendered, then it reads "No nutrition plan yet."
- [ ] **FE-R6-11-FE-AC04** (error state): Given any error/toast message containing "meal plan" before the change, when displayed, then it reads "nutrition plan."
- [ ] **FE-R6-11-FE-AC05** (permission denied): N/A — reason: copy sweep; auth gating unaffected.
- [ ] **FE-R6-11-FE-AC06** (concurrent action): N/A — reason: string-only.
- [ ] **FE-R6-11-FE-AC07** (boundary values): N/A — reason: no numeric/length input.
- [ ] **FE-R6-11-FE-AC08** (network failure): N/A — reason: string-only.
- [ ] **FE-R6-11-FE-AC09** (invalid input): Given a string genuinely about a food meal (e.g. "log meal", "this meal"), when the audit is run, then it remains untouched. The sweep targets the exact phrase "meal plan", not standalone "meal".
- [ ] **FE-R6-11-FE-AC10** (race condition): N/A — reason: string-only.
- [ ] **FE-R6-11-FE-AC11** (regression of FE-only "Meal Plan" feature label): Given the user navigates to the plans area and the feature label was "Meal Plan", when rendered, then it reads "Nutrition Plan."

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| FE-R6-11-FE-AC01–AC02 | new copy test `src/__tests__/copy/nutrition-plan-rename.test.ts` | grep-style sweep | Phase 6 |
| FE-R6-11-FE-AC03–AC04 | targeted render tests where applicable | one per AC | Phase 6 |
| FE-R6-11-FE-AC11 | navigation/plans screen test | label assertion | Phase 6 |

### Notes
- Allowlist for AC02 (paths/contexts that may still match without violating the sweep): existing test fixtures asserting old behavior, type-name internals like `MealPlanType`, route segment `/plans` (neutral), file names like `meal-plan-builder.tsx` (identifier, out of scope this round per Q4).
- Files matched by grep (14 from initial scan): see tracker.
