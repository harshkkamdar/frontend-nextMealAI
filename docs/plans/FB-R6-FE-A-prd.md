# FB-R6-FE-A · Signup workout-frequency leading-zero

**Status:** approved direction · Round 06 · Wave 1 · FE-only
**Owner:** Ved + Claude · 2026-05-21
**Source:** George (via Harsh): *"Trouble with removing the zero from the workout frequency field, one of the first pages after sign up."*
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-FE-A
**Files in scope:** `src/components/onboarding/fitness-form.tsx:57, 212-221`

---

## Story 01: Type any workout-frequency without fighting a sticky zero

**As an** end user completing the onboarding fitness step
**I want** to clear and re-type the workout-frequency field freely
**so that** I'm not forced to backspace through a value the form reasserts.

### INVEST check
- [x] Independent — purely local component state; no other story depends on it
- [x] Negotiable — describes what (clear + retype), not how (text vs number input)
- [x] Valuable — onboarding completion lift; today the field is functionally broken for new users
- [x] Estimable — ~30 min including tests
- [x] Small — single-file change + tests
- [x] Testable — every AC is strict Given/When/Then on observable DOM state

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-FE-A-AC01** — Given the user is on the onboarding fitness step with workout-frequency displaying `3`, when they clear the entry to no value, then the field is empty (displays empty, not `0`).
- [ ] **FE-R6-FE-A-AC02** — Given the field is empty, when the user types `5`, then the field displays `5` and submission carries `workout_frequency: 5`.

**Edge cases**
- [ ] **FE-R6-FE-A-AC03** (empty state): Given the field is empty, when the user attempts to submit, then submission is prevented and the user is informed the value is required.
- [ ] **FE-R6-FE-A-AC04** (error state): Given submission fails with a backend error, when the response is received, then the field retains the user-entered value (no silent reset to `3`).
- [ ] **FE-R6-FE-A-AC05** (permission denied): N/A — reason: onboarding is auth-gated upstream; the form itself has no role logic.
- [ ] **FE-R6-FE-A-AC06** (concurrent action): N/A — reason: single-user single-form interaction.
- [ ] **FE-R6-FE-A-AC07** (boundary values): Given input below `0` or above `7`, when entered, then the field rejects the value at submit and the user is informed the allowed range is 0–7. Given input `0` (rest week), the field accepts and submits `0`.
- [ ] **FE-R6-FE-A-AC08** (network failure): Given submission fires while offline, when the request fails, then the field value is preserved and the user is informed the save did not complete.
- [ ] **FE-R6-FE-A-AC09** (invalid input): Given non-numeric characters typed, when entered, then the field either rejects them at input or rejects them at submit (consistent behavior, never silently coerces to `0`).
- [ ] **FE-R6-FE-A-AC10** (race condition): N/A — reason: form is submit-once; sonner already debounces toasts.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01–AC10 | `src/components/onboarding/__tests__/fitness-form.test.tsx` (new) | one per AC | Phase 6 |

### Notes
- Root cause: `useState<number>(3)` + `onChange={(e) => setWorkoutFrequency(Number(e.target.value))}` — `Number('')` returns `0`, which the controlled input then re-renders as `"0"`.
- Implementation shape (negotiable): widen state to `number | ''`; submit-side validation still asserts integer 0–7.
- Reusable components: `<Input>` (`src/components/ui/input.tsx`).
