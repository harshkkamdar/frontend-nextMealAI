# NextMealAI Frontend — Phase 1-3 Design Spec

> Date: 2026-03-11
> Scope: Phase 1 (Foundation) + Phase 2 (Onboarding) + Phase 3 (Core App Shell)
> Stack: Next.js 14+ App Router · TypeScript strict · Tailwind CSS · shadcn/ui · React Query v5 · Zustand · React Hook Form + Zod · Supabase JS (auth only) · Framer Motion

---

## Context

Building the frontend for NextMealAI — a mobile-first web app powered by "Geo," an AI fitness and nutrition coach. The backend is a fully implemented 3-service Node.js/Express/TypeScript monorepo (Core API on port 3002, Realtime stub on 3001, Vision stub on 3003). The frontend is a new repo being built from scratch.

This design covers Phases 1-3 of a 6-phase build plan. The goal is a working, shippable product: auth, onboarding, dashboard, chat, and settings.

---

## Key Design Decisions (confirmed with owner)

| Decision | Choice | Reason |
|----------|--------|--------|
| Architecture | Pure client-side, React Query | Fully auth-gated app, highly interactive, React Native reuse goal |
| Landing page | Redirect `/` → `/login` | No marketing page for MVP |
| Chat | REST-only (`POST /v1/chat`) | WebSocket service is a stub — upgrade later |
| CORS | Next.js rewrites proxy | No backend changes needed |
| Onboarding UI | 3 pages matching API modules | Matches actual backend endpoints |
| Height in onboarding | Collected in personal step, sent via PATCH /v1/profile | Height not in any onboarding module endpoint |
| Auth | Email + password only | Google OAuth deferred to post-MVP |
| PWA | Not for MVP | Can add later |
| Deployment | Standard Next.js | No platform-specific optimizations yet |
| Visual | Color tokens + Trainerize inspiration | No Figma/design assets |
| Layout | Mobile-first, max-w-md, phone-width on desktop | App feels like a native mobile app |

---

## Backend API — Confirmed Facts (from source code)

- **Core API port**: `3002` (from `USER_SERVICE_PORT=3002` in backend `.env`)
- **Auth routes**: `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/reset-password` (NO `/v1/` prefix)
- **All other routes**: `/v1/profile/*`, `/v1/logs/*`, `/v1/plans/*`, `/v1/settings`, `/v1/memories/*`, `/v1/suggestions/*`, `/v1/chat/*`, `/v1/vision/*`
- **CORS**: NOT configured on backend — frontend must proxy
- **Chat response shape**: `{ session_id, response: { content, role, tokens_used, ... }, tools_used, actions_taken }`
- **Suggestions action endpoint**: `POST /v1/suggestions/:id/action { action: 'approve'|'reject'|'dismiss', feedback?: string }` — NOT separate `/approve` and `/reject` endpoints
- **Logs**: Can be created, read, updated, and deleted via API (`PUT/PATCH /v1/logs/:id` exists and works)
- **Chat sessions**: Full session management — `GET /v1/chat/sessions`, `GET /v1/chat/sessions/:sessionId`, `DELETE /v1/chat/sessions/:sessionId`
- **Supabase URL**: `https://utvipyhgbaoenoxmoisk.supabase.co`

---

## Section 1: Project Foundation

### CORS Proxy (next.config.ts)
```typescript
rewrites: async () => [
  {
    source: '/api/vision/:path*',
    destination: `${process.env.NEXT_PUBLIC_VISION_API_URL}/v1/vision/:path*`
  },
  {
    source: '/api/:path*',
    destination: `${process.env.NEXT_PUBLIC_CORE_API_URL}/:path*`
  }
]
```
All API calls use `/api/` prefix → Next.js forwards to `localhost:3002`. No CORS headers needed. No backend changes.

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://utvipyhgbaoenoxmoisk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
NEXT_PUBLIC_CORE_API_URL=http://localhost:3002
NEXT_PUBLIC_REALTIME_URL=ws://localhost:3001
NEXT_PUBLIC_VISION_API_URL=http://localhost:3003
```

### API Client Base (`src/lib/api/client.ts`)
Single `apiFetch(path, options)` function:
1. Reads `accessToken` from Zustand auth store
2. Prefixes all paths with `/api`
3. Injects `Authorization: Bearer <token>` header
4. Throws typed `ApiError` on non-2xx responses (with `error`, `code`, `message` fields)

All API functions in `lib/api/*.api.ts` use this — never raw `fetch` in components.

### React Query Setup
- Provider wraps root layout
- `queryClient` with default staleTime: 60s, retry: 1
- All queries use centralized key factory from `lib/query-keys.ts`
- Errors surface via `useQuery`/`useMutation` error states

### Zustand Stores
```typescript
// auth.store.ts
{ user: User | null, accessToken: string | null, isLoading: boolean, setSession(), clearSession() }

// ui.store.ts
{ activeSheet: string | null, openSheet(name), closeSheet() }
```

### Tailwind Config
Color tokens from `app-color.md` mapped via CSS variables in globals.css (Tailwind v4):
```css
--color-brand: #FF6A1A;
--color-bg-primary: #0F2A44;
--color-bg-secondary: #173A5E;
--color-bg-deep: #0A1F33;
--color-success: #34C759;
--color-warning: #FF8C42;
```

---

## Section 2: Auth Layer

### Route Group: `(auth)`
- Centered layout, no nav, navy background
- Geo avatar mark at top

### Pages
- `/login` — email/password form, link to /signup
- `/signup` — email/password form, link to /login
- No `/forgot-password` for MVP (backend supports it if added later)

### Auth Flow
```
POST /auth/signup → { user, session: { access_token, refresh_token, expires_at } }
POST /auth/login  → { user, session: { access_token, refresh_token, expires_at } }
```
On success:
1. Store `access_token` in Zustand `auth.store`
2. Write `access_token` to cookie `nextmealai-token` (max-age: 7 days)
3. Redirect to `/dashboard` (login) or `/onboarding/personal` (signup)

### Middleware (`src/proxy.ts`) — Next.js 16 convention
```
Request to any (app) route:
  1. Read JWT from cookie `nextmealai-token`
  2. No JWT → redirect /login
  3. Check GET /v1/profile/onboarding (cached in cookie `nextmealai-onboarded` for 5 min)
     - can_use_app = false → redirect /onboarding/personal
     - can_use_app = true → allow through

Request to /onboarding/* routes:
  - No JWT → redirect /login
  - onboarding already complete → redirect /dashboard
```

**Note:** Next.js 16 uses `proxy.ts` (not `middleware.ts`) with `export async function proxy(...)`.

### Validation (React Hook Form + Zod)
- Email: valid format
- Password: minimum 8 characters
- Client-side validation runs before any API call
- Server errors (duplicate email, wrong password) surfaced as form-level errors

---

## Section 3: Onboarding Flow

### Route Group: `onboarding` (own layout, no bottom nav)

### Layout
- Mobile: Geo commentary card stacked above form
- Progress indicator: 3 numbered steps with connecting line, active = brand orange

### Step 1: Personal (`/onboarding/personal`)
**Fields:** Full name, Date of birth, Sex (chip: Male/Female/Other), Height in cm

**On submit (in sequence):**
1. `POST /api/v1/profile/onboarding/personal` → `{ name, dob, sex }` (dob formatted as YYYY-MM-DD)
2. `PATCH /api/v1/profile` → `{ height_cm }`
3. Navigate to `/onboarding/fitness`

### Step 2: Fitness (`/onboarding/fitness`)
**Fields:** Equipment (multi-select chips), Injuries (multi-select optional), Activity level (4 option cards), Workout frequency (stepper 1–7), Primary goal (4 option cards)

**On submit:** `POST /api/v1/profile/onboarding/fitness`
Navigate to `/onboarding/nutrition`

### Step 3: Nutrition (`/onboarding/nutrition`)
**Fields:** Allergies (required, include "None"), Dietary style, Disliked foods (tag input), Cuisine preferences, Meals per day (stepper), Current weight kg, Target weight kg

**On submit:** `POST /api/v1/profile/onboarding/nutrition`
Navigate to `/onboarding/generating`

### Generating Screen (`/onboarding/generating`)
- Geo avatar with animated pulse + cycling messages
- `POST /v1/chat { message: "Generate my initial 7-day meal and workout plan based on my profile.", session_id: <new uuid> }`
- On success → redirect `/dashboard`

---

## Section 4: Core App Shell

### Route Group: `(app)` — auth-guarded, bottom nav

### Bottom Navigation
```
[🏠 Dashboard] [💬 Chat] [📅 Plans] [📋 Logs] [⚙️ Settings]
```
- Plans and Logs: show "Coming soon" toast on tap (grayed out)
- Active tab = brand orange
- Min 44px touch targets

---

## Section 5: Dashboard Page (`/dashboard`)

### Data Sources
- `GET /api/v1/logs/summary?period=day` → today's calorie/macro totals
- `GET /api/v1/plans?active_only=true` → active meal + workout plans
- `GET /api/v1/suggestions` → pending suggestions

### Layout
1. Header: "Good [morning/afternoon/evening], [name]" + date
2. MacroRing: circular SVG progress ring (calories) + 3 horizontal bars (protein/carbs/fat)
3. TodayPlanCard: today's meals + workout name from active plans
4. SuggestionCard (conditional): approve/reject/dismiss with cache invalidation + exit animation

---

## Section 6: Chat Page (`/chat`)

### Session Management
- List sessions via `GET /v1/chat/sessions`
- Mobile: collapsible sidebar drawer. Desktop: fixed 280px panel.
- New Chat: generate UUID as session_id
- Delete: swipe-to-delete (mobile) / hover button (desktop) → `DELETE /v1/chat/sessions/:sessionId`

### Send Flow
```
User types → tap Send
  → Optimistic user message added immediately
  → Typing indicator shown (3 animated dots)
  → POST /v1/chat { message, session_id }
  → On success: show Geo response (response.content)
  → If actions_taken contains plan_created/plan_updated: invalidate plans cache + toast
  → On error: remove optimistic message + error toast with retry
```

---

## Section 7: Settings Pages

### Main Settings (`/settings`)
- **Geo Personality:** tone/verbosity/emoji chips — auto-save on change via PATCH /v1/settings
- **Auto-apply edits:** toggle
- **Daily evaluation time:** time picker (onBlur to avoid PATCH spam)
- **Notifications:** 4 toggles

### Profile Edit (`/settings/profile`)
- Edit: weight_kg, target_weight_kg, height_cm, equipment, injuries, primary_goal, activity_level, dietary_style
- Explicit Save button → `PATCH /v1/profile` → toast "Profile updated"

---

## Implementation Notes

### Key Technical Decisions Made During Build
- **Next.js 16 installed** (not 14 as originally specified — 16 is latest stable)
- **Tailwind v4** uses CSS-based config (`@theme inline` in globals.css) — no `tailwind.config.ts`
- **Sonner** used instead of deprecated shadcn toast
- **proxy.ts** is the Next.js 16 middleware convention (PROXY_FILENAME = 'proxy')
- **Zod v4** works fine with `@hookform/resolvers` v5
- **MultiChip** extracted to `src/components/onboarding/multi-chip.tsx` to avoid duplication
- **Cookie auth:** `nextmealai-token` (7-day max-age), `nextmealai-onboarded` (24-hour cache)

### File Structure
```
src/
├── app/
│   ├── (auth)/layout.tsx, login/page.tsx, signup/page.tsx
│   ├── (app)/layout.tsx, dashboard/page.tsx, chat/page.tsx
│   │   plans/page.tsx, logs/page.tsx
│   │   settings/page.tsx, settings/profile/page.tsx
│   ├── onboarding/layout.tsx, personal/, fitness/, nutrition/, generating/
│   ├── layout.tsx (root), page.tsx (→ /login), not-found.tsx
├── components/
│   ├── auth/ (login-form, signup-form)
│   ├── chat/ (chat-window, chat-message, chat-input, typing-indicator, session-list)
│   ├── dashboard/ (macro-ring, today-plan-card, suggestion-card)
│   ├── layout/ (bottom-nav, page-wrapper)
│   ├── onboarding/ (step-indicator, geo-commentary, personal-form, fitness-form, nutrition-form, multi-chip)
│   ├── shared/ (geo-avatar, empty-state, loading-skeleton, confidence-badge)
│   └── providers.tsx
├── lib/
│   ├── api/ (client.ts, auth.api.ts, profile.api.ts, logs.api.ts, plans.api.ts, chat.api.ts, settings.api.ts, suggestions.api.ts)
│   ├── supabase.ts, query-keys.ts, utils.ts
├── stores/ (auth.store.ts, ui.store.ts)
├── types/ (api.types.ts, profile.types.ts, logs.types.ts, plans.types.ts, chat.types.ts, settings.types.ts, suggestions.types.ts)
└── proxy.ts (Next.js 16 middleware)
```

### Verification Checklist
- [ ] New user signup → onboarding flow → dashboard
- [ ] Returning user login → skips onboarding → dashboard
- [ ] Expired/missing token → redirects to /login
- [ ] Dashboard: macro rings show data, empty state when no logs
- [ ] Suggestion card: approve/reject/dismiss works, card animates out
- [ ] Chat: send message, typing indicator, Geo response renders
- [ ] Chat: new session, session switching, delete session
- [ ] Settings: Geo personality changes save immediately
- [ ] Settings/profile: save updates profile, shows toast
- [ ] Bottom nav: active tab highlighted, Plans/Logs show "Coming soon"
- [ ] Mobile: all touch targets ≥ 44px
