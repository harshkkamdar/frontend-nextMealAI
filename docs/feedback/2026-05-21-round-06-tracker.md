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
| FB-R6-FE-A | E10 | bug | P1 | FE | 1 | 2026-05-21 | ✅ | ◐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Workout-frequency leading-zero. fitness-form.tsx:212-221. `Number('')` coerces to 0. Pure FE, no BE dep. |
| FB-R6-FE-B | E10 | bug | P1 | FE | 1 | 2026-05-21 | ✅ | ◐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Slack-style keybinding (Ved-confirmed 2026-05-21): Enter = newline, Cmd/Ctrl+Enter = send. chat-input.tsx:55-60. |
| FB-R6-11 FE | E9 | feat | P2 | FE | 1 | 2026-05-21 | ✅ | ◐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Copy sweep: 'meal plan' → 'nutrition plan' in user-facing strings only. Skip code identifiers + DB enum. ~14 files matched. |
| FB-R6-16+17 FE | E5 | bug | P1 | FE | 1 | 2026-05-21 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Resume label + state on "Start Workout". BE shipped today (`0f5365a` idempotent startSession). FE: inspect 200 vs 201, "Resume Workout" label when in-progress session exists for today's plan_day_index, no duplicate history rows. |
| FB-R6-02 FE | E6 | bug | **P0** | FE | 2 | 2026-05-22 | ✅ Q2 resolved | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Two-step upload. BE contract confirmed: `POST /v1/chat/attachments/upload` → `{ storage_path, expires_in_seconds: 3600 }`; chat send takes `image_paths: string[]` (1–5); history `attachments[]` carries `signed_url` (1h TTL). Replace base64 path in chat-input.tsx + chat.api.ts + chat-bubble.tsx. Foundational — unlocks 03, FE-C, FE-D, 13 (and reuses for FE-D shared store). |
| FB-R6-03 FE | E6 | bug | **P0** | FE | 3 | 2026-05-23 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Multi-image picker, cap 5. `multiple` on file input; thumbnail strip; >5 disabled w/ helper text. Depends on FB-R6-02 FE. |
| FB-R6-FE-C | E6 | bug | P1 | FE | 3 | 2026-05-23 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **NEW from UAT 2026-05-21.** Cmd+V paste images into chat composer. Intercept `paste` event; when `e.clipboardData.items` contains image, build File from blob, feed into FB-R6-02 upload flow. Mixed clipboard handles both. Depends on FB-R6-02. |
| FB-R6-FE-D | E6 | bug | P1 | FE | 3 | 2026-05-23 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **NEW from UAT 2026-05-21.** Persist composer attachments across compact-widget ↔ full chat view. Lift composer state (text + storage_paths) into shared Zustand store. Both views read/write same store. Depends on FB-R6-02. |
| FB-R6-08 FE | E5 | bug | P1 | FE | 4 | 2026-05-24 | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | One-tap cancel via chat. BE contract: `deactivate_active_plan` returns `{ success, deactivated, superseded_plan_id, abandoned_session_ids[], message }`. FE: after Geo's reply, refetch both active-plan and in-progress-session cards. Observable: "Today's Workout" flips to "No workout plan yet" within ~1s. |
| FB-R6-10 FE | E4 | feat | P1 | FE | 4 | 2026-05-24 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Dashboard check-in card. `GET /v1/dashboard/check-in` → render when non-null; else fall back to existing onboarding cards. Trends drill-down linked from card. |
| FB-R6-13 FE | E6 | feat | P1 | FE | 4 | 2026-05-24 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | "Photo estimate" button on food-log screen. Two-step: estimate-from-photo → editable preview → log-from-estimate. |
| FB-R6-15 | E5 | bug | P1 | FE | 5 | TBD | ☐ direction Q | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **NEW from UAT 2026-05-21.** Calendar date → plan_day_index always returns 0. Direction options: (a) date-arithmetic `(selected_date - plan.start_date).days % plan.content.days.length`; (b) defer to BE FB-R6-12 cursor (calendar becomes status, not selector). **Open question — see below.** |
| FB-R6-12 FE | E5 | feat | P1 | FE | 5 | TBD | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⊘ BE | Train another day. Workout-start uses `current_position` when no `plan_day_index`; chat routes through `advance_to_workout` tool. BLOCKED on BE FB-R6-12 (still in flight per BE tracker). |

**Counts:** 13 FE items · 2 P0 (R6-02, R6-03) · 10 P1 · 1 P2 (R6-11) · 1 BE-blocked (R6-12) · 1 direction-pending (R6-15).

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
