# Client Feedback — Round 06 (Frontend Tracker)

**Date opened:** 2026-05-21
**Source:** George (the client) via Harsh (intermediary). Two WhatsApp dumps consolidated 2026-05-12 → 2026-05-15, plus 4 new items surfaced by BE UAT 2026-05-21.
**Companion repo:** [`backend-nextMealAI`](https://github.com/harshkkamdar/backend-nextMealAI) — Round 06 plan + BE tracker live there.
**BE plan:** `backend-nextMealAI/docs/feedback/2026-05-20-round-06-plan.md`
**BE tracker:** `backend-nextMealAI/docs/feedback/2026-05-20-round-06-tracker.md`
**BE UAT:** `backend-nextMealAI/docs/feedback/2026-05-21-round-06-uat.md`
**BE handoff prompt (authoritative FE scope):** `backend-nextMealAI/docs/feedback/2026-05-21-round-06-frontend-handoff-prompt.md`
**Branch:** `feat/round-06` cut from `main` 2026-05-21 (`7228c71` Merge PR #6 of R5).
**Dev-flow tier:** LARGE (approved by Ved 2026-05-21).

Status legend: ☐ not started · ◐ in progress · ✅ done · ⊘ blocked / open question

---

## Per-item status board (13 items)

| ID | Epic | Sev | Pri | Repo | Wave | ETA | Refined | PRD | Plan | Test Red | Impl | QA | UAT | Reviewed | Shipped | Notes |
|----|------|-----|-----|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|------|
| FB-R6-FE-A | E10 | bug | P1 | FE | 1 | 2026-05-21 | ✅ | ✅ | inline | ✅ | ✅ | self | ✅ Ved 2026-05-21 | self | ✅ | Commit b69dd44. 3 vitest tests (AC01 RED→GREEN reproduced the bug exactly; AC02, AC07 regression locks). State widened to `number \| ''`. Live UAT ✅ "all green" Ved 2026-05-21. |
| FB-R6-FE-B | E10 | bug | P1 | FE | 1 | 2026-05-21 | ✅ | ✅ | inline | ✅ | ✅ | self | ✅ Ved 2026-05-21 | self | ✅ | Commit 1366533. 7 vitest tests cover plain Enter no-send, Cmd+Enter macOS, Ctrl+Enter Win/Linux, empty/whitespace/disabled no-send, preventDefault on send. Live UAT ✅. |
| FB-R6-11 FE | E9 | feat | P2 | FE | 1 | 2026-05-21 | ✅ | ✅ | inline | ✅ | ✅ | self | ✅ Ved 2026-05-21 | self | ✅ | Commit e9c1e11. 28 user-facing strings swept across 14 files. New grep-style test `src/__tests__/copy/nutrition-plan-rename.test.ts` walks src/ for literal `meal plan` (space-separated) — 0 occurrences after sweep. File identifiers + DB enum unchanged. Live UAT ✅. |
| FB-R6-16+17 FE | E5 | bug | P1 | FE | 1 | 2026-05-21 | ✅ | ✅ | inline | ✅ | ✅ | self | ✅ Ved 2026-05-21 | self | ✅ | Commit 4aaa0bb. New `deriveWorkoutEntryLabel` helper in lib/workout-session.ts + 6 vitest tests. Wired into activity/page.tsx — Start button label flips Start↔Resume; resume banner now only shows when in_progress matches today (was showing for any in_progress before). Live UAT ✅. |
| FB-R6-02 FE | E6 | bug | **P0** | FE | 2 | 2026-05-21 | ✅ Q2 resolved | ✅ | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Wave 2 code complete 2026-05-21.** Replaced base64-in-JSON with two-step upload. New `uploadChatAttachment(file)` API; chat-input uploads on file pick, send carries `image_paths[]`; chat-bubble renders persisted `attachments[]` (signed URLs) and falls back to local blob preview for the optimistic temp bubble; FB-15 program extraction still works via on-demand base64 conversion. apiFetch patched to support FormData bodies. 16 chat-input tests passing (6 new for upload flow). 222/222 full suite, tsc clean. |
| FB-R6-03 FE | E6 | bug | **P0** | FE | 3 | 2026-05-21 | ☐ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** Multi-image cap 5. Composer state now array-shaped, file input gets `multiple`, thumbnail strip renders all attached + in-flight slots, helper text shows `N/5 · max reached`, camera button disables at cap. Shares the FB-R6-02 upload pipeline. 4 new tests. |
| FB-R6-FE-C | E6 | bug | P1 | FE | 3 | 2026-05-21 | ☐ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** Cmd+V paste images. Composer textarea gets `onPaste` handler that pulls image files out of clipboardData.files (not items — files is the canonical multi-image entry) and routes them through the same upload pipeline as the file picker. Text-only pastes fall through to default. Cap enforced. 4 new tests. |
| FB-R6-FE-D | E6 | bug | P1 | FE | 3 | 2026-05-21 | ☐ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** New `src/stores/composer.store.ts` Zustand singleton keyed by sessionId. ChatInput accepts optional `sessionId` prop — when set, draft (text + attachments + uploadingCount) syncs to the store; when absent, falls back to local state. Both `geo-companion-sheet.tsx` and `chat/[sessionId]/page.tsx` pass sessionId. Draft cleared on send. Store owns blob URLs so they survive component unmount during widget→full navigation. 4 FE-D integration tests added. |
| FB-R6-08 FE | E5 | bug | P1 | FE | 4 | 2026-05-21 | ✅ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** Event-bus pattern: both chat consumers (chat/[sessionId]/page + geo-companion-sheet) dispatch `workout:plan-deactivated` when `deactivate_active_plan` appears in `tools_used`. Activity + Dashboard listen and refetch their data. ~30 lines total across 4 files. No new tests — existing chat tests don't exercise tool dispatch; UAT is the gate. |
| FB-R6-10 FE | E4 | feat | P1 | FE | 4 | 2026-05-21 | ✅ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** New `src/lib/api/dashboard.api.ts` (`getDashboardCheckIn`), new `src/components/dashboard/check-in-card.tsx`. Dashboard fetches in parallel with existing data; when BE returns non-null, CheckInCard leads the dashboard above the nudge stack. Null gracefully falls through. Drill-down link prefills Geo chat with "walk me through my trends." 6 component tests covering metric formatting, null fallbacks, +/- weight delta, drill-down prefill. |
| FB-R6-13 FE | E6 | feat | P1 | FE | 4 | 2026-05-21 | ✅ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** New "Photo estimate" CTA (dashed-border accent button) at top of FoodLogForm. Hidden file input → estimate-from-photo upload → populates form fields with aggregated totals + joined item names. Confidence chip with X to clear. Save routes through log-from-estimate (with edits merged) when estimate_id present, else original createLog path. New API methods `estimateFoodFromPhoto` + `logFromEstimate` in foods.api.ts. 7 component tests covering button presence, populate, confidence chip, log-from-estimate vs createLog routing, clear, no_food_identified toast, upload error. |
| FB-R6-15 | E5 | bug | P1 | FE | 3 | 2026-05-21 | ✅ | inline | inline | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | **Code complete 2026-05-21.** Cursor-aware date mapping (Ved-approved direction after FB-R6-12 BE shipped). New pure helper `computeSelectedPlanDayIndex(plan, selectedDateIso, todayIso)` in lib/workout-session.ts — anchors on `plan.current_position` for today, adds day-delta for other dates, wraps via positive modulo. Wired into activity/page.tsx replacing the stale `new Date()` anchor. 10 new unit tests including Ved's exact 6-day-PPL repro. |
| FB-R6-12 FE | E5 | feat | P1 | FE | 5 | TBD | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⊘ BE | Train another day. Workout-start uses `current_position` when no `plan_day_index`; chat routes through `advance_to_workout` tool. BLOCKED on BE FB-R6-12 (still in flight per BE tracker). |
| FB-R6-S2-v2 | E11 | feat | P1 | BE+FE | 2b | 2026-05-21 | ✅ | ✅ | inline in PRD | ✅ | ✅ | self | ☐ Ved | self | ☐ UAT | Commit db2ae35. New `/admin` page + 6 components + admin.api + admin.types + useIsAdmin hook + conditional "Admin Dashboard" link in /settings. 25 RTL tests passing; full suite 202/202; tsc clean. Design-system extracted from src/components/dashboard/ — 1-paragraph comment lives atop AdminMetricsCards.tsx. 5 FE UAT rows added to shared BE UAT log (BE commit 39b8fb1). |

**Counts:** 14 FE items (Wave 1 closed; +1 S2-v2 added 2026-05-21) · 2 P0 (R6-02, R6-03) · 11 P1 · 1 P2 (R6-11) · 1 BE-blocked (R6-12) · 1 direction-pending (R6-15).

---

## Wave schedule (revised 2026-05-21 for 13 items)

```
Wave 1 — 2026-05-21 (parallel via subagents — all pure FE, no BE dep, small)
  FB-R6-FE-A + FB-R6-FE-B + FB-R6-11 FE + FB-R6-16+17 FE

Wave 2 — 2026-05-22 (foundational, sequential)
  FB-R6-02 FE (two-step upload) — unlocks all of Wave 3

Wave 3 — 2026-05-23 (parallel after Wave 2; all consume FB-R6-02 contract)
  FB-R6-03 FE + FB-R6-FE-C + FB-R6-FE-D

Wave 4 — 2026-05-24 (parallel via subagents — independent surfaces)
  FB-R6-08 FE + FB-R6-10 FE + FB-R6-13 FE

Wave 5 — schedule depends on direction + BE
  FB-R6-15 (calendar mapping) — Wave 1 if option (a), Wave 5 if option (b)
  FB-R6-12 FE (train another day) — waits for BE FB-R6-12

Wave 6 — close
  /cso + /review + /codex review (R6-02 FE, R6-12 FE)
  PR feat/round-06 → main
  /canary 30 min on prod
```

---

## BE-FE contract reference (locked from BE feat/round-06)

| FE item | BE endpoint(s) | Request | Response |
|---------|----------------|---------|----------|
| FB-R6-02 FE | `POST /v1/chat/attachments/upload` | multipart `file`, 10MB cap, MIME whitelist (image/jpeg, image/png, image/heic) | `{ storage_path: string, expires_in_seconds: 3600 }` |
| FB-R6-02 FE | `POST /v1/chat` | add `image_paths: string[]` (replaces inline base64) | message persisted with `message_attachments` rows |
| FB-R6-02 FE | `GET /v1/chat/sessions/:id` | — | each message includes `attachments: [{ id, signed_url, mime_type, width, height }]`; signed_url TTL 1h |
| FB-R6-03 FE | `POST /v1/chat` | `image_paths.length` 1–5 | 400 with `"max 5 images per message"` when >5 |
| FB-R6-08 FE | chat tool `deactivate_active_plan` | LLM-driven | `{ success, deactivated, superseded_plan_id, abandoned_session_ids[], message }` |
| FB-R6-10 FE | `GET /v1/dashboard/check-in` | — | `{ check_in: { narrative: string, metrics: { macro_adherence_pct, weight_delta_kg, workout_count_7d, data_days }, generated_at: string } \| null }` |
| FB-R6-12 FE | Plan model | — | `current_position: number` (0-indexed cursor) **— BE not yet shipped** |
| FB-R6-12 FE | Chat tool `advance_to_workout` | LLM-driven; FE no direct call | bumps cursor only; plan content untouched |
| FB-R6-13 FE | `POST /v1/foods/estimate-from-photo` | multipart `image` | `{ estimate_id, items[], totals, confidence, expires_at }` (1h TTL) |
| FB-R6-13 FE | `POST /v1/foods/log-from-estimate` | `{ estimate_id }` | food log row · 410 Gone if reused |
| FB-R6-16+17 FE | `POST /v1/workout-sessions` | unchanged | **200** with existing session when in_progress session exists for same (user, plan, plan_day_index); **201** with new when none exists |

---

## Open questions

- **Q1 / FB-R6-15 direction:** option (a) date-arithmetic `(selected_date - plan.start_date).days % plan.content.days.length` vs option (b) defer to BE FB-R6-12 `current_position`. Affects scheduling (Wave 1 vs Wave 5). **Awaiting Ved 2026-05-21.**
- **Q2 / FB-R6-02 FE:** ~~confirm storage_path field name~~ → ✅ resolved 2026-05-21: `{ storage_path, expires_in_seconds: 3600 }` per BE handoff prompt.
- **Q3 / FB-R6-12 FE:** BE FB-R6-12 (plan cursor + `advance_to_workout` tool) status — still in flight per BE tracker.
- **Q4 / FB-R6-11 FE:** keep filenames (`meal-plan-builder.tsx`) as identifiers vs rename them too. Recommend: keep, limit blast radius this round.

---

## Cross-repo guardrail

If we discover an FE need that requires a BE contract change, pause, log under "Open questions" with a `BE-FE contract change` tag, and ask Ved to take it back to the BE session. No silent divergence.

---

## Change log

- **2026-05-21** — Round 06 FE tracker opened. `feat/round-06` cut from `main` (`7228c71`). 9 FE items inventoried. Wave 1 (parallel via subagents): FE-A, FE-B, R6-11 copy sweep starting.
- **2026-05-21** — Tracker updated: 4 new items added from BE UAT 2026-05-21 (FE-C paste image, FE-D lift composer state, R6-15 calendar mapping) + R6-16+17 FE (BE shipped `0f5365a`). Total now 13 items. Q2 (storage_path naming) resolved. Wave plan revised.
- **2026-05-21** — **FB-R6-S2-v2 added to scope (between Waves 2 and 3).** Harsh asked for a real admin dashboard, not "go run SQL in Studio." BE shipped spec + stub endpoint (`backend-nextMealAI/docs/spec/fb-r6-s2v2-admin-dashboard-contract.md`). FE builds in parallel against stub. Direction confirmed Ved 2026-05-21: Recharts only (Tremor rescinded), shadcn/ui + Lucide + `app-color.md` tokens, design-system extraction from `src/components/dashboard/` required. ADMIN_EMAILS = eng@oximy.com + Harsh + George (BE env config only). PRD landed at `docs/plans/FB-R6-S2-v2-FE-prd.md`. Slotting as Wave 2b (parallel to R6-02 FE which is paused).
- **2026-05-21** — **Wave 1 code complete, UAT pending.** 4 commits landed on `feat/round-06`:
  - `b69dd44` fix(FB-R6-FE-A): allow workout-frequency field to be cleared (3 tests)
  - `1366533` fix(FB-R6-FE-B): Slack-style keybinding in chat composer (7 tests)
  - `e9c1e11` feat(FB-R6-11 FE): meal plan → nutrition plan copy sweep (28 strings, 14 files, 1 sweep test)
  - `4aaa0bb` fix(FB-R6-16+17 FE): Resume label + state on Start Workout (6 unit tests + activity page wiring)
  
  Full test suite green (177/177 across 24 files). tsc clean. FE UAT script opened at `docs/feedback/2026-05-21-round-06-uat-fe.md` with one row per AC across the 4 items — awaiting Ved live sign-off in browser at http://localhost:3010 ↔ BE :4010.
