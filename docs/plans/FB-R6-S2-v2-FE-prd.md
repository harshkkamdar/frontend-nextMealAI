# FB-R6-S2-v2 FE · Admin Dashboard page

**Status:** draft · Round 06 · MEDIUM tier · FE-only
**Owner:** Ved + Claude · 2026-05-21
**Source:** Harsh (via Ved): *"How would I get access to see who's using and how?"* — Phase 2 of FB-R6-S2. Phase 1 (5 SQL views in Supabase) shipped in BE PR #14. Phase 2 is the actual web admin dashboard.
**BE companion:** `backend-nextMealAI/docs/spec/fb-r6-s2v2-admin-dashboard-contract.md` (SPEC LOCKED). Stub mode of `GET /v1/admin/metrics` ships day 0 — FE can build against deterministic stub data immediately.
**Tracker row:** `docs/feedback/2026-05-21-round-06-tracker.md` → FB-R6-S2-v2 (to be added)
**Files in scope:**
- `src/app/admin/page.tsx` (new) — admin route; client component (auth + fetch + render).
- `src/app/admin/access-denied.tsx` (new, or inline) — 403 path.
- `src/components/admin/AdminMetricsCards.tsx` (new) — 4 KPI tiles.
- `src/components/admin/DauLineChart.tsx` (new) — Recharts LineChart.
- `src/components/admin/SignupsBarChart.tsx` (new) — Recharts BarChart.
- `src/components/admin/TopToolsChart.tsx` (new) — Recharts horizontal BarChart.
- `src/components/admin/ActiveUsersTable.tsx` (new) — sortable native `<table>` in Card chrome.
- `src/components/admin/CsvExportButton.tsx` (new) — auth-fetched blob → trigger download.
- `src/lib/api/admin.api.ts` (new) — `getAdminMetrics`, `exportActiveUsersCsv`.
- `src/types/admin.types.ts` (new) — `AdminMetricsResponse` + nested types from spec § 2.
- nav surfacing: read existing nav component, add Admin link gated on a successful probe of `/v1/admin/metrics`.

---

## Design-system extraction (Phase 2 deliverable per prompt § 4)

Extracted by reading `src/components/dashboard/{progress-card, next-up-card, quick-stats, weight-chart}.tsx` + `src/app/globals.css`:

| Token | Class | Hex (light) / token |
|---|---|---|
| Card surface | `bg-surface` | `#F9F7F4` |
| Card border | `border border-border` | `#E8E4DF` |
| Card radius | `rounded-2xl` | 16px |
| Card padding (compact) | `p-4` | 16px |
| Card padding (hero) | `p-5` | 20px |
| Section uppercase label | `text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary` | — |
| KPI number (big) | `text-xl font-semibold tabular-nums text-text-primary` | — |
| KPI number (hero / accent) | `text-[22px] font-semibold tabular-nums text-accent` | — |
| Muted secondary | `text-xs text-text-secondary` | — |
| Inter-card gap (grid) | `gap-3` | 12px |
| Inter-card gap (vertical) | `space-y-3` or `space-y-4` | 12 / 16px |
| Lucide icon size | `w-4 h-4` (small) / `w-5 h-5` (regular) / `w-[18px] h-[18px]` (stat box) | — |
| Recharts container | `h-40` div + `<ResponsiveContainer width="100%" height="100%">` | 160px |
| Recharts tick style | `tick={{ fontSize: 10, fill: 'currentColor' }}` (use `text-text-tertiary` on parent) | — |
| Recharts axis chrome | `axisLine={false} tickLine={false}` | — |
| Active scale (tap) | `active:scale-[0.97] transition-transform` | — |

The 1-paragraph comment that lives atop `AdminMetricsCards.tsx`:
> Visual contract extracted 2026-05-21 from `src/components/dashboard/` (progress-card, next-up-card, quick-stats, weight-chart). Cards: `bg-surface border border-border rounded-2xl p-4`. Uppercase section label: `text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary`. KPI number: `text-xl font-semibold tabular-nums text-text-primary` (or `text-accent` for the hero metric). Muted secondary: `text-xs text-text-secondary`. Lucide icons at `w-4 h-4`. Grid gap 12px. Tokens are CSS-var driven (see `globals.css`) — never hardcode hex; use `bg-surface`, `text-accent`, etc.

---

## Story 01: See who is using nextMealAI and how, on one page

**As an** admin (founder/operator on the `ADMIN_EMAILS` allow-list)
**I want** a single dashboard that shows KPIs, daily trends, tool usage, and the top active users
**so that** I can answer "is the product getting traction?" without writing SQL — and export the active-users list if I want to follow up.

### INVEST check
- [x] Independent — BE stub ships day 0; FE can build immediately; no other FE story depends on this
- [x] Negotiable — describes operational outcomes (KPIs, trends, drilldown, export), not chart types (Recharts is locked by spec) or table sort UI shape
- [x] Valuable — gives Harsh + George the visibility they asked for; replaces "go run SQL in Studio" with a click
- [x] Estimable — single page, 6 small components, frozen data contract; ~MEDIUM tier
- [x] Small — fits a day's work; no schema, no auth model changes
- [x] Testable — every AC is observable via RTL or `/gstack`

### Acceptance Criteria

**Happy path**
- [ ] **FE-R6-S2-v2-AC01** — Given an admin (`ADMIN_EMAILS` member) opens `/admin`, when the page loads, then 4 KPI tiles render with the values from `summary` (users_total, dau_today, wau_this_week, new_signups_7d) using the dashboard card visual language (no Tremor/Material widgets, no inline hex).
- [ ] **FE-R6-S2-v2-AC02** — Given the same load, when the DAU section renders, then a line chart shows the most recent 30 days from `dau[]`, ordered oldest→newest, with `day` on the x-axis and `active_users` on the y-axis.
- [ ] **FE-R6-S2-v2-AC03** — Given the same load, when the Signups section renders, then a bar chart shows the last 30 days from `signups[]`.
- [ ] **FE-R6-S2-v2-AC04** — Given the same load, when the Top Tools section renders, then a horizontal bar chart shows up to 20 entries from `tool_calls_7d[]`, ordered DESC by `call_count`.
- [ ] **FE-R6-S2-v2-AC05** — Given the same load, when the Active Users section renders, then a table lists `active_users_30d[]` with columns `user_id`, `last_active`, `food_log_count`, `workout_session_count`, `chat_turn_count`, and is sortable by every numeric column.
- [ ] **FE-R6-S2-v2-AC06** — Given an admin clicks the **Export CSV** action, when the request succeeds, then the browser downloads a file named `active-users-YYYY-MM-DD.csv` containing the active-users rows (header + data).

**Edge cases**
- [ ] **FE-R6-S2-v2-AC07** (empty state): Given the BE returns empty arrays (no usage yet), when the page renders, then each section shows a one-line empty-state message ("No DAU yet", "No signups in the last 30 days", "No tool usage", "No active users in the last 30 days") inside the Card chrome — the page never shows a blank chart or a console error.
- [ ] **FE-R6-S2-v2-AC08** (error state): Given `/v1/admin/metrics` returns a non-2xx that is not 403, when the failure is received, then the page shows a single "Couldn't load admin metrics — try again" message with a retry action; charts/tiles are not partially rendered.
- [ ] **FE-R6-S2-v2-AC09** (permission denied — direct nav): Given a non-admin (or unauthenticated user) navigates directly to `/admin`, when the page tries to fetch metrics and receives 403, then the user is informed they are not authorized — either redirected to `/dashboard` or shown an inline "Access denied" surface (recommended: inline surface so it's clear what just happened).
- [ ] **FE-R6-S2-v2-AC10** (permission denied — nav surfacing): Given a non-admin loads any authenticated page, when the nav renders, then the **Admin** link is not present. (Implementation: on app load, probe `/v1/admin/metrics` once; 200 → show link; 403 → hide.)
- [ ] **FE-R6-S2-v2-AC11** (concurrent action): N/A — single-user dashboard reads; no concurrent writes.
- [ ] **FE-R6-S2-v2-AC12** (boundary values): Given the BE returns the longest-allowed shape (e.g. `dau[]` with 365 entries), when the page renders, then the line chart clips to "last 30" with no overflow; given a single-entry `dau[]`, the chart still renders a single data point rather than erroring.
- [ ] **FE-R6-S2-v2-AC13** (network failure): Given the user is offline, when `/v1/admin/metrics` fails, then the page shows the AC08 error surface (no half-load, no console crash).
- [ ] **FE-R6-S2-v2-AC14** (invalid input — CSV): Given the CSV export fails (network, 500), when the failure is received, then the user is informed the download didn't complete; the dashboard page itself stays usable.
- [ ] **FE-R6-S2-v2-AC15** (race condition): Given the user clicks Export CSV twice in rapid succession, when the second click fires while the first is in-flight, then only one download is initiated (button disables on first click, re-enables on success or failure).
- [ ] **FE-R6-S2-v2-AC16** (auth refresh): Given the user's access token has expired when they open `/admin`, when `apiFetch` runs its refresh path, then the metrics fetch completes successfully on the retry (this AC inherits behavior from the existing `client.ts`; we assert by mocking 401 → 200 sequence).
- [ ] **FE-R6-S2-v2-AC17** (visual contract): Given the rendered `/admin` page is screenshot-compared against the dashboard cards, then the card chrome (border, radius, padding, label style, KPI number style) matches `src/components/dashboard/` patterns — no novel chrome, no inline hex.

### Test traceability
| AC ID | Test file | Test name | Status |
|-------|-----------|-----------|--------|
| AC01 | `src/components/admin/__tests__/AdminMetricsCards.test.tsx` (new) | "renders 4 KPI tiles with stub numbers (47/12/28/5)" | Phase 6 |
| AC02 | `src/components/admin/__tests__/DauLineChart.test.tsx` (new) | "renders one line with the stub 7 data points" | Phase 6 |
| AC03 | `src/components/admin/__tests__/SignupsBarChart.test.tsx` (new) | "renders bars for each day in stub" | Phase 6 |
| AC04 | `src/components/admin/__tests__/TopToolsChart.test.tsx` (new) | "renders create_log as the longest bar (84)" | Phase 6 |
| AC05 | `src/components/admin/__tests__/ActiveUsersTable.test.tsx` (new) | "sorts ascending/descending by food_log_count" | Phase 6 |
| AC06 | `src/components/admin/__tests__/CsvExportButton.test.tsx` (new) | "triggers a download with content-disposition filename" | Phase 6 |
| AC07 | each component test | "renders empty-state when array is empty" | Phase 6 |
| AC08, AC13 | page-level test (or skip RTL, lean on /gstack) | "shows error surface on fetch failure" | Phase 6 |
| AC09 | page test | "shows access-denied on 403" | Phase 6 |
| AC10 | nav test (only if we land the gated link in this round) | "hides admin link when probe returns 403" | Phase 6 |
| AC15 | CsvExportButton test | "disables while in-flight" | Phase 6 |
| AC17 | Phase 8 `/design-review` | visual regression vs dashboard | Phase 8 |

### Notes

**Stub-driven dev.** I'll build against the spec's STUB constant (§ 2). The BE swap from stub→real is a server-side change with zero FE impact; the contract is the contract. If the BE endpoint is not yet live when I start RED tests, I'll wire the FE to call the endpoint anyway — tests use a mocked `getAdminMetrics` that returns the STUB. Live UAT happens against the real BE stub endpoint on `localhost:4010`.

**Page is a client component.** Even though shadcn defaults to RSC, the admin page needs Zustand auth state + fetch + interactive table sort + CSV download — all client-side. Marking the page `'use client'` keeps the surface coherent. (Could be split later if we want to RSC-fetch on the server.)

**Nav gating.** The simplest implementation: a small `useIsAdmin()` hook that probes `/v1/admin/metrics` on mount and caches the result for the session. The Admin nav link renders only when `useIsAdmin()` returns `true`. Probing the metrics endpoint as the admin check avoids needing a separate `/v1/me/roles` route. Cost: 1 small request per session for every authenticated user. Acceptable for Phase 2; we can move to a `profiles.is_admin` column later if it scales.

**Admin emails for BE env var (Ved-confirmed 2026-05-21):** `eng@oximy.com` + Harsh's email + George's email. Exact addresses for Harsh and George needed from Ved — I'll add a `TODO(Ved)` comment in the PRD checkpoint discussion. **FE never hardcodes these** — they live in BE env `ADMIN_EMAILS` only.

**Cross-repo deliverable:** UAT rows go in the shared BE UAT log at `backend-nextMealAI/docs/feedback/2026-05-21-round-06-uat.md` under a new `FB-R6-S2-v2` section. I'll append the section + 5 rows + sign off after `/gstack` UAT passes.

**Recharts color sourcing.** Recharts takes literal color values for stroke/fill, not Tailwind classes. To stay token-driven, I'll use `var(--color-accent)` etc. in inline styles — the CSS vars are already defined in `globals.css`. This satisfies "no inline hex" while keeping Recharts happy.

**Out of scope this PRD (for Phase 3+):**
- Retention cohorts / per-user drilldown (spec § 7.3 — explicit OUT)
- Re-auth confirmation step before showing the page (spec § 7.2 default: no)
- Real-time refresh (server caches 60s; FE re-fetches on tab visibility change at most)
- Dark-mode polish — Recharts will inherit; visual check during /gstack UAT
