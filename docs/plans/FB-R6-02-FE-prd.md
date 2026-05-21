# FB-R6-02 FE · Chat image attachments — two-step upload + persisted render

**Status:** draft · Round 06 · Wave 2 (foundational) · FE-only
**Owner:** Ved + Claude · 2026-05-21
**Source:** George (via Harsh): *"Images disappear in chat after clicking out of it."*
**BE companion:** PR #22 shipped 2026-05-21 on `feat/round-06` (`de82989`). New `chat-attachments` private Supabase Storage bucket, `message_attachments` table, two-step upload endpoint, signed-URL render on history load.
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-02 FE
**Files in scope:**
- `src/lib/api/chat.api.ts` — add `uploadChatAttachment`; change `sendMessage` payload
- `src/lib/api/client.ts` — support FormData bodies (don't JSON.stringify a Blob)
- `src/types/chat.types.ts` — add `Attachment` type; widen `ChatMessage` + `SendMessageInput`
- `src/components/chat/chat-input.tsx` — replace base64 logic with upload-then-attach
- `src/components/chat/chat-bubble.tsx` — render `attachments[]` (signed URLs) in addition to legacy `image`
- `src/app/(app)/chat/[sessionId]/page.tsx` — handleSend signature; keep FB-15 program extraction working
- `src/components/geo/geo-companion-sheet.tsx` — handleSend signature (mirrors the chat page)

**Foundational:** this PRD unlocks R6-03 (multi-image cap 5), FE-C (Cmd+V paste image), FE-D (lifted composer state), and the FE side of R6-13 (food-log photo estimate).

---

## Story 01: Attached photos still in chat tomorrow

**As an** end user who attached a photo to Geo today and revisits the conversation tomorrow
**I want** to see the photo right where I sent it
**so that** I have a record of what I logged and can re-reference the photo without re-uploading.

### INVEST check
- [x] Independent — BE contract already shipped (`de82989`); no other FE story depends on this; this story is a prerequisite for several downstream stories but does not require any of them to land first
- [x] Negotiable — describes user-visible persistence; does not prescribe the upload implementation (signed URL TTL, retry behavior, optimistic UI shape are all open)
- [x] Valuable — fixes the highest-frequency observable defect George flagged this round; restores chat-as-record mental model
- [x] Estimable — substantial: 7 files, new API method, FormData support, type extensions, two consumer pages
- [x] Small — fits in a day; no schema or auth changes
- [x] Testable — both upload + render are mechanically verifiable (file-input event, signed-URL `<img src>` assertion)

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-02-AC01** — Given the user attaches a JPEG/PNG/HEIC ≤ 10MB to the chat composer, when the file is selected, then the file is uploaded to the backend and a thumbnail preview is shown next to the composer. The composer remains enabled.
- [ ] **FE-R6-02-AC02** — Given AC01 succeeded, when the user submits the message, then the send request carries `image_paths: [storage_path]` (no base64 inline) and the message is persisted with the attachment server-side.
- [ ] **FE-R6-02-AC03** — Given the user reloads the chat session or returns to it later, when the chat history loads, then each historical user message that had an attachment shows the image inline at the same position in the conversation — rendered from the server-returned `signed_url`, not a local data URL.

**Edge cases**
- [ ] **FE-R6-02-AC04** (empty state): Given the user submits a message with no attachment, when the send fires, then the request carries no `image_paths` field (or an empty array) and the BE persists a text-only message — no breakage.
- [ ] **FE-R6-02-AC05** (upload error): Given the upload fails (network, 413 oversize, 415 wrong type, 500), when the failure is received, then the user is informed the attach did not succeed, the file is NOT attached to the composer, and the composer stays usable (text already typed is preserved).
- [ ] **FE-R6-02-AC06** (permission denied): N/A — both the upload endpoint and the chat send are auth-gated upstream by the same Supabase JWT; nothing new to assert at FE layer.
- [ ] **FE-R6-02-AC07** (concurrent action): Given the user attaches an image and starts a second attach action before the first upload completes, when the second action fires, then the second action is blocked or queued — the composer never enters a state where two pending uploads can race.
- [ ] **FE-R6-02-AC08** (boundary values):
  - Given a 1KB JPEG, when uploaded, then the upload succeeds and the storage_path round-trips.
  - Given an exactly 10MB JPEG, when uploaded, then the upload succeeds (BE cap is `≤ 10MB`).
  - Given a > 10MB file, when uploaded, then the BE returns 413 and the user is informed.
  - Given an image of MIME `image/gif`, when uploaded, then the BE returns 415 and the user is informed (animated GIFs are excluded per BE plan).
- [ ] **FE-R6-02-AC09** (network failure): Given the upload request is in-flight and the network drops, when the request errors, then no attachment is added to the composer; the user can retry by re-selecting the file.
- [ ] **FE-R6-02-AC10** (invalid input): Given the user picks a non-image MIME (e.g. `application/pdf`), when the file input accepts it (browser may bypass `accept="image/*"` on some platforms), then the BE returns 415 and the user is informed; no attachment is shown.
- [ ] **FE-R6-02-AC11** (race condition): Given the user submits a message in the same tick that an upload is still completing, when send fires, then send is blocked until the upload settles — message either includes the attachment (success) or does not (failure with informed user); never sends a half-attached message.
- [ ] **FE-R6-02-AC12** (signed URL expiry): Given a chat session is open for longer than the signed_url TTL (≥ 1h), when the page re-fetches messages, then the next GET returns fresh signed URLs so the image continues to render. (We do not need a client-side refresh loop for this round — re-render on next fetch is acceptable.)
- [ ] **FE-R6-02-AC13** (FB-15 regression): Given a user attaches an image and types a workout-program-like message, when the message is submitted, then `extractWorkoutProgram` still runs and may surface the program preview card — FB-15 path continues to work despite the upload contract change.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01, AC05, AC07, AC10 | `src/components/chat/__tests__/chat-input.test.tsx` (extend) | upload-flow tests | Phase 6 |
| AC02 | `src/lib/api/__tests__/chat.api.test.ts` (new) | `sendMessage` carries `image_paths` not `image` | Phase 6 |
| AC03 | `src/components/chat/__tests__/chat-bubble.test.tsx` (new) | renders `attachments[].signed_url` | Phase 6 |
| AC04 | chat.api test | empty image_paths case | Phase 6 |
| AC08 (BE-side) | exercised via live UAT | curl 10MB + GIF + 1KB | Phase 9 |
| AC11 | chat-input test | upload-in-flight + submit | Phase 6 |
| AC13 | manual UAT (FB-15 has its own integration) | — | Phase 9 |

### Notes

**API client changes.** `apiFetch` currently `JSON.stringify`s every body. Detect `FormData` inputs and pass them through with no `Content-Type` header (browser sets the multipart boundary). This is a 2-line patch in `client.ts`.

**ChatInput state shape.** Replace the single `imageBase64: string | null` with:
```ts
interface AttachedImage {
  storage_path: string   // returned by BE upload
  preview_url: string    // browser blob URL for local thumbnail
  file: File             // kept for any later use (e.g. FB-15 base64 conversion)
}
```
This shape makes R6-03 multi-image trivial (array of `AttachedImage`).

**ChatMessage type.** Add `attachments?: Attachment[]` alongside the existing `image?: string`. Server-persisted messages carry `attachments`; the temp local message we synth right after pressing send still uses the blob `preview_url` in `image` field. Once the page re-fetches messages, the server's `attachments` replaces the local-only `image`.

**FB-15 program extraction.** Today reads `image` (base64) directly. After this PRD: the chat page handler converts `attachedImage.file → base64` on demand only when FB-15 fires (already a rare branch). Vision API contract unchanged — keeps the failure surface tight.

**Onsend signature.** Today: `onSend(message: string, image?: string)`. After: `onSend(message: string, attachments?: AttachedImage[])`. Both consumers (`chat/[sessionId]/page.tsx`, `geo-companion-sheet.tsx`) update in lockstep.

**Send block during in-flight upload.** Disable the send button (and intercept Cmd+Enter from FE-B) while any attached image has not yet finished uploading. The PRD's AC11 enforces this.

**Out of scope this PRD (covered in later items):**
- Multi-image picker UX (R6-03)
- Cmd+V paste image (FE-C)
- Lifted composer state across compact ↔ full chat (FE-D)
- Photo-estimate button on food-log (R6-13)

The shape of `AttachedImage[]` and the new `image_paths` API surface are designed so all four can layer on top without contract churn.
