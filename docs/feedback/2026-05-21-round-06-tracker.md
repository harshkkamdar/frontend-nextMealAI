# Client Feedback — Round 06 (Frontend Tracker)

**Date opened:** 2026-05-21
**Source:** George (the client) via Harsh (intermediary). Two WhatsApp dumps consolidated 2026-05-12 → 2026-05-15.
**Companion repo:** [`backend-nextMealAI`](https://github.com/harshkkamdar/backend-nextMealAI) — Round 06 plan + BE tracker live there.
**BE plan:** `backend-nextMealAI/docs/feedback/2026-05-20-round-06-plan.md`
**BE tracker:** `backend-nextMealAI/docs/feedback/2026-05-20-round-06-tracker.md`
**BE UAT:** `backend-nextMealAI/docs/feedback/2026-05-21-round-06-uat.md`
**Branch:** `feat/round-06` cut from `main` 2026-05-21 (`7228c71` Merge PR #6 of R5).
**Dev-flow tier:** LARGE (approved by Ved 2026-05-21).

Status legend: ☐ not started · ◐ in progress · ✅ done · ⊘ blocked / open question

---

## Per-item status board

| ID | Epic | Sev | Pri | Repo | Wave | ETA | Refined | PRD | Plan | Test Red | Impl | QA | UAT | Reviewed | Shipped | Notes |
|----|------|-----|-----|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|------|
| FB-R6-FE-A | E10 | bug | P1 | FE | 1 | 2026-05-21 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Workout-frequency leading-zero. fitness-form.tsx:212-221. `Number('')` coerces to 0. Pure FE, no BE dep. |
| FB-R6-FE-B | E10 | bug | P1 | FE | 1 | 2026-05-21 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Slack-style keybinding (Ved-confirmed 2026-05-21): Enter = newline, Cmd/Ctrl+Enter = send. chat-input.tsx:55-60. |
| FB-R6-11 FE | E9 | feat | P2 | FE | 1 | 2026-05-21 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Copy sweep: 'meal plan' → 'nutrition plan' in user-facing strings only. Skip code identifiers + DB enum. ~14 files matched. |
| FB-R6-02 FE | E6 | bug | **P0** | FE | 2 | 2026-05-22 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Two-step upload. BE contract: `POST /v1/chat/attachments/upload` → `{ storage_path, expires_in_seconds }`; chat send takes `image_paths: string[]`; history `attachments[]` carry `signed_url`. Replace base64 path in chat-input.tsx + chat.api.ts + chat-bubble.tsx. Foundational — unlocks 03, 13. |
| FB-R6-03 FE | E6 | bug | **P0** | FE | 3 | 2026-05-23 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Multi-image picker, cap 5. `multiple` on file input; thumbnail strip; >5 disabled w/ helper text. Depends on FB-R6-02 FE. |
| FB-R6-08 FE | E5 | bug | P1 | FE | 4 | 2026-05-24 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | One-tap cancel. Consume `{ session_status, plan_status, abandoned_session_ids[] }`; optimistic UI + refetch on success. |
| FB-R6-10 FE | E4 | feat | P1 | FE | 4 | 2026-05-24 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Dashboard check-in card. `GET /v1/dashboard/check-in` → render card when non-null; else fall back to existing onboarding cards. Trends drill-down view linked from card. |
| FB-R6-13 FE | E6 | feat | P1 | FE | 4 | 2026-05-24 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | "Photo estimate" button on food-log screen. Two-step: estimate-from-photo → editable preview → log-from-estimate. |
| FB-R6-12 FE | E5 | feat | P1 | FE | 5 | TBD | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⊘ BE | Train another day. Workout-start uses `current_position` when no explicit `plan_day_index`; chat routes through `advance_to_workout` tool. BLOCKED on BE FB-R6-12. |

**Counts:** 9 FE items · 2 P0 (02, 03) · 6 P1 · 1 P2 · 1 BE-blocked (12)

---

## Wave schedule

```
Wave 1 — 2026-05-21 (parallel via subagents — all isolated, no BE dep)
  FB-R6-FE-A + FB-R6-FE-B + FB-R6-11 FE

Wave 2 — 2026-05-22 (foundational, sequential)
  FB-R6-02 FE (two-step upload)

Wave 3 — 2026-05-23 (depends on 02)
  FB-R6-03 FE (multi-image picker)

Wave 4 — 2026-05-24 (parallel via subagents)
  FB-R6-08 FE + FB-R6-10 FE + FB-R6-13 FE

Wave 5 — when BE FB-R6-12 lands
  FB-R6-12 FE (advance-to-workout flow)

Wave 6 — close
  /cso + /review + /codex review (R6-02 FE, R6-12 FE)
  PR feat/round-06 → main
  /canary 30 min on prod
```

---

## BE-FE contract reference (locked from BE plan)

These contracts are stable on BE `feat/round-06`. If the FE side wants to diverge, pause and write a note here under "Open questions" — do NOT silently mutate.

| FE item | BE endpoint(s) | Request | Response |
|---------|----------------|---------|----------|
| FB-R6-02 FE | `POST /v1/chat/attachments/upload` | multipart `file`, 10MB cap, MIME whitelist (image/jpeg, image/png, image/heic) | `{ storage_path: string, expires_in_seconds: number }` |
| FB-R6-02 FE | `POST /v1/chat` | add `image_paths: string[]` (replaces inline base64) | message persisted with `message_attachments` rows |
| FB-R6-02 FE | `GET /v1/chat/sessions/:id` | — | each message includes `attachments: [{ id, signed_url, mime_type, width, height }]`; URL TTL ≥ 1h |
| FB-R6-03 FE | `POST /v1/chat` | `image_paths.length` 1–5 | 400 with `"max 5 images per message"` when >5 |
| FB-R6-08 FE | `POST /v1/workout-sessions/:id/cancel` | — | `{ session_status: 'abandoned', plan_status: 'superseded' \| 'unchanged', abandoned_session_ids: string[] }` |
| FB-R6-08 FE | Chat tool `deactivate_active_plan` | — | same shape as above (cascade) |
| FB-R6-10 FE | `GET /v1/dashboard/check-in` | — | `{ check_in: { narrative: string, metrics: { macro_adherence_pct, weight_delta_kg, workout_count_7d, data_days }, generated_at: string } \| null }` |
| FB-R6-12 FE | Plan model | — | adds `current_position: number` (0-indexed cursor) |
| FB-R6-12 FE | Chat tool `advance_to_workout` | LLM-driven; FE no direct call | bumps cursor only; plan content untouched |
| FB-R6-13 FE | `POST /v1/foods/estimate-from-photo` | multipart `image` | `{ estimate_id, items[], totals, confidence, expires_at }` (1h TTL) |
| FB-R6-13 FE | `POST /v1/foods/log-from-estimate` | `{ estimate_id }` | food log row · 410 Gone if reused |

---

## Discipline gates (LARGE tier per `.flow.yaml` dev-flow protocol)

Per item, in order:
1. **Phase 1 Understand** — clarify intent via `superpowers:brainstorming` if creative.
2. **Phase 2 Research** — read current code, BE contract; confirm root cause for bugs (`superpowers:systematic-debugging`).
3. **Phase 3 Story** — `user-story` PRD with AC IDs `FE-R6-<ID>-AC0N`. Save under `docs/plans/FE-R6-<ID>-prd.md`.
4. **Phase 4 Plan** — `superpowers:writing-plans` per item. Save under `docs/plans/FE-R6-<ID>-plan.md`.
5. **Phase 5 Checkpoint** — Ved reviews PRD + plan before code.
6. **Phase 6 Test Red** — Vitest failing tests, one per AC ID, in `src/**/__tests__/`.
7. **Phase 7 Implement Green** — minimum to pass, `frontend-design` for any visual surface, `react-best-practices` checks on every TSX.
8. **Phase 7.5 Simplify** — refactor pass with tests green.
9. **Phase 8 QA** — `/qa` (or `/browse`) on http://localhost:3010 against BE on http://localhost:4010. UI items also get `/design-review`.
10. **Phase 8.5 Security** — `/cso` + `/review` (focus: R6-02 FE upload path, R6-13 FE photo upload).
11. **Phase 9 UAT** — live-app row signed off in `docs/feedback/2026-05-21-round-06-uat-fe.md` (to be created during Wave 1).
12. **Phase 10 Review** — `superpowers:verification-before-completion` + `/review` + `/codex review` (R6-02, R6-12).
13. **Phase 11 Ship** — per-item branch → squash to `feat/round-06`. End-of-round single PR `feat/round-06 → main`.
14. **Phase 11.5 Docs** — `/document-release` at round close.
15. **Phase 12 Learn** — `/wrap` + Obsidian session log + memory updates.

**Hard rule:** every item closes ONLY after its UAT row is signed off live.

---

## Open questions

- **Q1 / FB-R6-12 FE:** Status of BE FB-R6-12 (plan cursor + `advance_to_workout` tool) — confirm BE has landed before Wave 5 starts. Last BE tracker check (2026-05-20 close) shows FB-R6-12 still in flight; verify before scheduling.
- **Q2 / FB-R6-02 FE:** BE PR #22 merged today on `feat/round-06`. Confirm the exact JSON field name `storage_path` (vs `path`) and TTL default on `signed_url` before coding the FE consumer.

---

## Cross-repo guardrail

If we discover an FE need that requires a BE contract change, pause, log under "Open questions" with a `BE-FE contract change` tag, and ask Ved to take it back to the BE session. No silent divergence.

---

## Change log

- **2026-05-21** — Round 06 FE tracker opened. `feat/round-06` cut from `main` (`7228c71`). 9 FE items inventoried. Wave 1 (parallel via subagents): FE-A, FE-B, R6-11 copy sweep starting.
