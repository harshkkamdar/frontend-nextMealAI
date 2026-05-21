# Round 06 — /cso Security Audit (FE)

**Date:** 2026-05-22
**Branch:** feat/round-06
**Auditor:** Claude (CSO mode, subagent)
**Diff scope:** 63 files, +5,062/-182 lines, 25 commits

## Verdict
**pass-with-followups** — no P0s. Two P1s recommended for the Round 06.5 patch (CheckInCard `crypto.randomUUID()` inside JSX, signed-URL `javascript:` defense-in-depth on `<img src>`). Several P2 and notes for hardening.

## Findings table
| #  | Severity | Surface | File:line | Description | Fix path |
|----|----------|---------|-----------|-------------|----------|
| 1  | P1 | XSS hardening | `src/components/chat/chat-bubble.tsx:112-118`, `src/components/admin/UserDetailSheet.tsx:590-596` | `<img src={signed_url}>` is rendered without a scheme check. React does NOT block `javascript:` in `src` (only in `href`). A compromised/malicious BE could return `javascript:alert(1)` and on certain browsers (older Safari, some embed contexts) this can fire. Defense-in-depth recommended. | Add a small guard: `const safeUrl = (u) => /^https?:\/\//i.test(u ?? '') ? u : null;` and pass `src={safeUrl(att.signed_url)}` (also drop the `<img>` entirely when null). |
| 2  | P1 | Render stability + side effect | `src/components/dashboard/check-in-card.tsx:87` | `href={\`/chat/${crypto.randomUUID()}?prefill=${PREFILL}\`}` is computed at render time. Every re-render generates a new UUID. Aside from the UX issue (link changes under the user's mouse), it bloats the chat-sessions table with orphan IDs and breaks Next.js prefetching. Not a vuln by itself but it's a cheap DoS amplifier on the BE chat-session table. | Compute the UUID inside a `useMemo`, or generate at click-time inside an `onClick={() => router.push(...)}`. |
| 3  | P2 | Admin allow-list — fail-open analysis | `src/hooks/useIsAdmin.ts:25-39` | `probe()` catches ALL errors → `cachedResult = false`. This is fail-closed for admin (good). But the module-level `cachedResult` singleton means a transient network blip on first probe permanently denies admin until full page reload. Not a security risk; UX/operations risk. | Optional: re-probe on 401/network errors instead of caching false forever. Or cache only `true` and re-probe on `null`/`false`. |
| 4  | P2 | Token in cookie via JS | `src/lib/api/client.ts:37` | The Supabase access token is set as a non-HttpOnly cookie (`document.cookie = nextmealai-token=...`) AND in localStorage (via Zustand persist). Both surfaces are reachable from any XSS. Since no XSS sinks were found in this diff, this is residual risk only. | Migrate token cookie to server-set HttpOnly + Secure + SameSite=Lax via a Next.js Route Handler after refresh. Tracked separately from this round. |
| 5  | P2 | CSV-export bypasses unified client | `src/lib/api/admin.api.ts:25-45` | `exportActiveUsersCsv` uses bare `fetch` to `/api/v1/admin/...` (Next.js rewrite-proxied). Auth header is attached correctly; the token is in the header (not in the URL); no 401-refresh path though, so a token expiring mid-export shows a generic error instead of refreshing. | Acceptable for v1. Followup: factor a `apiFetchBlob` helper and route both JSON and CSV through it for shared 401-refresh behavior. |
| 6  | P2 | Plan/Workout/Profile data rendered as text only — confirm BE doesn't return URLs in name fields | `src/components/admin/UserDetailSheet.tsx:316, 339` | `meal.name`, `workout.name`, `profile.dietary_style`, etc. render through JSX `{value}` (React escapes). Safe. Note only: the chip rows under Equipment/Injuries/Allergies (line 638-645) also use `{item}` — safe. | None — confirmation only. |
| 7  | Note | Composer blob URL lifecycle | `src/stores/composer.store.ts:127-138` | `clearDraft` intentionally does NOT call `URL.revokeObjectURL` because the optimistic ChatBubble in chat history still references the blob URL until the next refetch. Comment explains it. Net effect: blob URLs leak per attached image until tab close. Memory impact is small (single-digit MB) but worth noting. | Optional: revoke after 5min idle, or track refs on the message side and revoke when ChatBubble unmounts. |
| 8  | Note | Markdown renderer is HTML-safe | `src/components/chat/chat-bubble.tsx:7-83` | `renderInline` + `GeoMessageContent` use only string slicing → React text children. No raw HTML pass-through; no `dangerouslySetInnerHTML` anywhere in the diff (or repo). If Geo returns `<script>` or `<img onerror=...>` text, React renders it as escaped text. ✅ | None. |
| 9  | Note | FoodEstimate render is escaped | `src/components/logs/food-log-form.tsx:43-53, 178-203` | `est.items.map(i => i.name).join(', ')` → `setFoodName` → `<Input value=...>` and the chip text are all React-escaped. No raw HTML or markdown injection. `coverage_notes` is not currently rendered. | None. |
| 10 | Note | Dashboard check-in null-handled | `src/app/(app)/dashboard/page.tsx:241-258, 417` | `getDashboardCheckIn().catch(() => ({ check_in: null }))` and `{checkIn && <CheckInCard />}` guards. Graceful when BE is down or pre-7-day. | None. |
| 11 | Note | No new deps this round | `package.json` (unchanged main → feat/round-06) | `recharts ^3.8.0` and `lucide-react ^0.577.0` already shipped in `main`. No supply-chain delta this round. | None. |
| 12 | Note | No secrets in diff | grep for `sk_`, `sb_secret`, `service_role`, `OPENROUTER`, `OPENAI_API`, `eyJ`, `SUPABASE_SERVICE` across `src/` and `_stub.ts` | All clean. The admin stub fixture uses `alice@stub.local`, `bob@stub.local`, `carol@stub.local` — not real user data, no real IDs. | None. |

## Per-surface evidence

### A. Admin allow-list (FE consumer)

**Checked:**
- `src/hooks/useIsAdmin.ts` — module-level singleton cache + probe pattern
- `src/app/admin/page.tsx` — denied/error/ok states
- `src/app/(app)/settings/page.tsx:83, 170` — admin link gating
- `src/lib/api/admin.api.ts` — `getAdminMetrics` uses `apiFetch` (auth header automatic)
- `src/types/api.types.ts` — `ApiException` carries `statusCode`

**Findings:**
- `probe()` lines 25-39: `try { await getAdminMetrics(); cachedResult = true } catch { cachedResult = false }` — fail-closed for admin access. A network blip on FIRST probe permanently caches `false` for the session (P2 #3). Subsequent callers read `cachedResult` directly so the in-flight singleton race is correctly handled (`if (inflight) return inflight`).
- `useIsAdmin` returns `null` while loading; `useEffect` only sets state when `cancelled === false` → no leaked admin shell render between mount and probe completion.
- `settings/page.tsx:170` — `{isAdmin && <SettingsSection title="Admin">…}` — strict equality on truthy (loading `null` does NOT render). ✅
- `admin/page.tsx:44-52` — `if (err instanceof ApiException && err.statusCode === 403)` → 'denied' surface. Other errors → 'error' (not 'ok'). No admin shell shown on either. ✅
- No localStorage flag, no URL toggle, no debug bypass found. `grep` for `is_admin`, `isAdmin`, `ADMIN_EMAILS` in client-readable surfaces: only `useIsAdmin.ts` + the two consumers.

**Verdict:** pass (one P2 followup — see #3).

### B. Admin user-summary FE render

**Checked:**
- `src/components/admin/UserDetailSheet.tsx` — all 703 lines reviewed
- `src/types/admin.types.ts:52-153` — `AdminUserSummary` shape

**Findings:**
- All user-derived fields (`user.email`, `user.display_name`, `profile.dietary_style`, equipment/injuries/allergies arrays, log payloads, chat message content) are rendered as `{value}` JSX children → React escapes HTML.
- `m.content` in chat history (line 556) uses `whitespace-pre-wrap break-words` — text-only, no HTML pass-through. Even if a user submitted `<script>alert(1)</script>` as their chat content, it would render as visible text in admin view.
- Photo render (line 590-602): `<img src={a.signed_url}>` — same `javascript:` concern as ChatBubble (P1 #1). Recommend the same scheme guard.
- Schema does NOT include password hashes, raw access tokens, or refresh tokens — `AdminUserSummary.user` exposes only id/email/display_name/created_at/last_active/timezone. ✅
- `renderLogSummary` (line 678-703): extracts numeric fields from payload via narrow casts. No HTML interpolation. ✅

**Verdict:** pass-with-followup (P1 #1 applies here too).

### C. message_attachments signed-URL render

**Checked:**
- `src/components/chat/chat-bubble.tsx:99-127` — render path
- `src/lib/api/chat.api.ts:12-19` — `uploadChatAttachment` (FormData, no MIME check on FE — BE is source of truth)
- `src/components/chat/chat-input.tsx:270-277` — file picker `accept="image/*"`
- `src/stores/composer.store.ts` — blob URL ownership rules

**Findings:**
- No `dangerouslySetInnerHTML` anywhere in the diff (verified by grep across `src/`).
- `<img src={att.signed_url}>` is the only render. React does not auto-block `javascript:` schemes in `src` attributes (it only blocks them in `href` from React 16.9+). This is the P1 #1 concern. In practice the BE generates Supabase Storage signed URLs (`https://*.supabase.co/...`) so this is defense-in-depth, not an active exploit.
- `chat-input.tsx:273` — `accept="image/*"` set on the file input. UX guard only; not a security boundary. BE enforces MIME check.
- Composer blob URLs: `URL.createObjectURL` at line 125, revoked on upload error (133), on attachment removal (207, store store.ts:90), and on unmount for local-mode (74-83). Store-mode intentionally does not revoke on `clearDraft` — see note #7.
- `<img>` is a plain HTML tag, not Next/Image — so no domain whitelist enforcement (would otherwise be `images.remotePatterns` in `next.config.js`). For chat content this is correct; consider adding a CSP `img-src` directive at the platform level for defense-in-depth.

**Verdict:** pass-with-followup (P1 #1).

### D. food_estimates + dashboard_check_in_cache consumers

**Checked:**
- `src/lib/api/foods.api.ts:5-42` — `FoodEstimate` type + `estimateFoodFromPhoto` + `logFromEstimate`
- `src/lib/api/dashboard.api.ts` — `getDashboardCheckIn` with null-friendly shape
- `src/components/logs/food-log-form.tsx:37-68, 75-136` — populateFromEstimate + handleSave
- `src/components/dashboard/check-in-card.tsx` — narrative + metrics render
- `src/app/(app)/dashboard/page.tsx:241-258, 417` — fetch + gating

**Findings:**
- `estimateFoodFromPhoto` and `logFromEstimate` errors are surfaced via `toast.error(err instanceof Error ? err.message : '...')`. A BE 410 (food_estimates row expired) would produce a `ApiException` with `error` set to BE's response body — recommend confirming the BE never returns raw stack-traces in `error`. Code path: line 62-64 — `err.message` for `Error`, fallback string otherwise. Not a leak in itself; depends on BE.
- `populateFromEstimate` (line 37-53): aggregates `est.items` and `est.totals` numerically; `est.items.map(i => i.name).join(', ')` → `setFoodName(names)` → eventually `<Input value=...>` (React escapes). No HTML/markdown interpolation. ✅
- `coverage_notes` is in the type but NOT rendered anywhere — verified with grep. If/when rendered, it must be text-only.
- The confidence chip (line 178-203) renders `Math.round(estimateConfidence * 100)` — pure number, no injection surface. ✅
- Dashboard `getDashboardCheckIn().catch(() => ({ check_in: null }))` (line 250) → `{checkIn && <CheckInCard …>}` (line 417). Null-safe. ✅
- `CheckInCard` renders `narrative` as plain JSX text (line 59): `{narrative}`. No markdown rendering, no HTML pass-through. ✅
- See P1 #2 for the `crypto.randomUUID()`-in-render bug in CheckInCard.

**Verdict:** pass-with-followup (P1 #2).

### E. Secrets archaeology

**Checked:**
- Grep across `src/` for: `sk_`, `sb_secret`, `service_role`, `OPENROUTER`, `OPENAI_API`, `eyJ`, `SUPABASE_SERVICE`
- `.env.local.example` content vs main (no changes this round)
- `src/components/admin/__tests__/_stub.ts` fixture

**Findings:**
- Zero matches across `src/`.
- `_stub.ts` uses `alice@stub.local`, `bob@stub.local`, `carol@stub.local` and `user_id: 'stub-user-N'` — clearly synthetic, no real PII or IDs.
- `.env.local.example` still references `sb_publishable_...` (truncated placeholder) as the publishable key. Correct convention.

**Verdict:** pass.

### F. Dependency supply chain

**Checked:**
- `git diff main..feat/round-06 -- package.json pnpm-lock.yaml`
- `package.json` content on both branches

**Findings:**
- `package.json` is **byte-identical** between main and feat/round-06. No deps added, removed, or version-bumped this round.
- `recharts ^3.8.0` and `lucide-react ^0.577.0` were already present in main and are being used by the new admin charts.
- No `pnpm-lock.yaml` change either (no diff hunks reported).
- No `postinstall` / `preinstall` scripts on this project.

**Verdict:** pass (no supply-chain delta).

### G. XSS / injection on FE render surfaces

**Checked:**
- Custom markdown renderer in `chat-bubble.tsx` (lines 7-83)
- All `<img>` usage in the diff (chat-bubble, UserDetailSheet)
- Admin email rendering in `ActiveUsersTable.tsx` and `UserDetailSheet.tsx`
- Food log item-name rendering
- All `href=` interpolations

**Findings:**
- Markdown renderer: regex-based slicing only. Bold/italic/code → `<strong>`/`<em>`/`<code>` elements with `{textChild}`. Headings/bullets/numbered → `<p>`/`<li>` with `{renderInline(text)}`. No `dangerouslySetInnerHTML`, no HTML entity decoding. Mental test: input `<img src=x onerror=alert(1)>` → React renders as escaped text. ✅
- ActiveUsersTable line 108: `<span>{label}</span>` where `label = u.email || \`${u.user_id.slice(0, 8)}…\``. JSX-escaped. ✅
- `crypto.randomUUID()` in `href` interpolation (check-in-card.tsx:87, dashboard:426): values are random UUIDs and a static `PREFILL` constant URL-encoded. Safe but see P1 #2 for the re-render bug.
- `window.location.href = '/login'` (client.ts:133): static string, no user input. ✅
- `window.location.hash.substring(1)` (reset-password/page.tsx:58): not part of this diff but flagged — confirms it's parsing Supabase recovery params from the hash. Out of scope for this round.

**Verdict:** pass-with-followup (P1 #1 covers `<img src>` defense-in-depth).

### H. OWASP-relevant FE checks

- **A01 Broken Access Control**: Admin link gating verified (Surface A). Direct nav to `/admin` shows `kind: 'denied'` surface on 403; no admin shell rendered. ✅
- **A02 Cryptographic Failures**: N/A on FE; tokens are stored in localStorage + cookie. P2 #4 tracks the HttpOnly migration.
- **A03 Injection (XSS)**: No `dangerouslySetInnerHTML`. No `eval`/`Function`/`document.write`. Custom markdown renderer is HTML-safe. P1 #1 is the one open defense-in-depth item for `<img src>`.
- **A04 Insecure Design**: `useIsAdmin` is a client-side probe — final gate is BE enforcement (403 on `/v1/admin/metrics`). Settings link gating is UI affordance only. ✅
- **A05 Security Misconfiguration**: Raw `<img>` (not Next/Image) is intentional for chat content. Recommend CSP `img-src https://*.supabase.co data:` at the platform level. No `next.config.js` change this round to evaluate.
- **A07 Identification & Auth**: Token-refresh path (`tryRefreshToken` in `client.ts:19-46`) correctly serializes via in-flight promise. On refresh failure → `handleAuthFailure` clears session + cookie + redirects to `/login`. ✅. Cookie is set with `samesite=lax` and `max-age=7 days`. P2 #4 covers HttpOnly upgrade.
- **A08 Software & Data Integrity Failures**: No new deps; no postinstall scripts; lockfile unchanged. ✅
- **A09 Logging & Monitoring**: FE-only audit. Out of scope.
- **A10 SSRF**: FE only; all fetches go through `/api{path}` Next.js rewrite. ✅

## Round 06.5 followups

1. **P1 — Add `javascript:`-scheme guard on `<img src={signed_url}>`** in `chat-bubble.tsx:114` and `UserDetailSheet.tsx:592`. Cheap, ~5 lines:
   ```ts
   const safeImgUrl = (u: string | null | undefined): string | null =>
     typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null
   ```
2. **P1 — Memoize the chat URL in `check-in-card.tsx:87`** so every render doesn't generate a new UUID. Either:
   ```tsx
   const chatId = useMemo(() => crypto.randomUUID(), [])
   <Link href={`/chat/${chatId}?prefill=${PREFILL}`} … />
   ```
   or move the UUID generation into an `onClick={() => router.push(...)}`.
3. **P2 — Re-probe admin status on transient failures** in `useIsAdmin.ts` (don't cache `false` forever).
4. **P2 — Factor `apiFetchBlob` helper** so CSV export shares 401-refresh behavior with the JSON path.
5. **P2 (cross-cutting, not blocking)** — migrate auth token to HttpOnly cookie. Tracked separately.
