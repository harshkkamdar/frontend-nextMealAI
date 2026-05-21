# FB-R6-FE-B · Chat composer: Enter = newline, Cmd/Ctrl+Enter = send

**Status:** approved direction · Round 06 · Wave 1 · FE-only
**Owner:** Ved + Claude · 2026-05-21
**Source:** George (via Harsh): *"Clicking enter sends a message to Geo instead of creating a new line."*
**Direction confirmed:** Ved 2026-05-21 — Slack-style (Enter = newline, Cmd/Ctrl+Enter = send).
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-FE-B
**Files in scope:** `src/components/chat/chat-input.tsx:55-60` · existing test `src/components/chat/__tests__/chat-input.test.tsx`

---

## Story 01: Compose multi-line messages without accidentally sending

**As an** end user composing a message to Geo
**I want** Enter to add a newline and Cmd/Ctrl+Enter to send
**so that** I can write multi-line context (workouts, food lists, questions) without prematurely sending mid-thought.

### INVEST check
- [x] Independent — single-component keybinding change, no other story depends on it
- [x] Negotiable — describes the binding outcome, not how the handler is structured
- [x] Valuable — eliminates a daily friction George flagged; aligns with how George writes long messages
- [x] Estimable — ~20 min including tests
- [x] Small — keydown handler + ~2 tests added, ~1 test updated
- [x] Testable — keyboard events are mechanically observable via React Testing Library

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-FE-B-AC01** — Given a non-empty composer with cursor at the end, when the user presses `Enter` without a modifier, then a newline is inserted into the composer value and no send is initiated.
- [ ] **FE-R6-FE-B-AC02** — Given a non-empty composer, when the user presses `Cmd+Enter` (macOS) or `Ctrl+Enter` (Windows/Linux), then the message is sent and the composer is cleared.

**Edge cases**
- [ ] **FE-R6-FE-B-AC03** (empty state): Given the composer is empty and no image is attached, when the user presses `Cmd/Ctrl+Enter`, then no send is initiated.
- [ ] **FE-R6-FE-B-AC04** (error state): N/A — reason: this AC set covers input behavior; send-error rendering is owned by chat session/bubble, unchanged here.
- [ ] **FE-R6-FE-B-AC05** (permission denied): N/A — reason: composer is auth-gated upstream.
- [ ] **FE-R6-FE-B-AC06** (concurrent action): N/A — reason: single-user interaction.
- [ ] **FE-R6-FE-B-AC07** (boundary values): Given a composer with only whitespace, when the user presses `Cmd/Ctrl+Enter`, then no send is initiated (matches current trim guard).
- [ ] **FE-R6-FE-B-AC08** (network failure): N/A — reason: failure handling is downstream of send.
- [ ] **FE-R6-FE-B-AC09** (invalid input): Given the user pastes a multi-line block, when the paste completes and then the user presses `Enter`, then a newline is added (the paste does not auto-send).
- [ ] **FE-R6-FE-B-AC10** (race condition): Given the user holds `Cmd+Enter` so the OS repeats the keydown, when multiple keydowns fire in rapid succession, then only the first one with non-empty content sends; subsequent ones see an empty composer and are no-ops.
- [ ] **FE-R6-FE-B-AC11** (disabled state): Given the composer is `disabled` (send in flight), when the user presses `Cmd/Ctrl+Enter`, then no send is initiated.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01–AC11 | `src/components/chat/__tests__/chat-input.test.tsx` (extend) | one per AC | Phase 6 |

### Notes
- Cross-platform: detect `metaKey || ctrlKey` (handles macOS Cmd + Win/Linux Ctrl in one branch).
- Today: `e.key === 'Enter' && !e.shiftKey` sends; `Shift+Enter` is the only newline path. After: plain `Enter` (no modifier) becomes the newline path.
- Reusable components: `<textarea>` already auto-resizes via `adjustHeight()` — no UI rework needed.
