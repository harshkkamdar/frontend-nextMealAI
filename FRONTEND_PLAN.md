# NextMeal AI — Frontend Plan

> Last updated: 2026-03-11
> Stack: Next.js 14+ (App Router) · shadcn/ui · Tailwind CSS · React Query · Zustand · Socket.io
> Platform: Mobile-first web (React Native / Expo planned later)

---

## 1. Repository Decision

**Separate repo from the backend — confirmed correct.**

| Reason | Detail |
|--------|--------|
| Clean CI/CD | Frontend deploys to Vercel independently; backend deploys separately |
| No shared code yet | Frontend consumes a standard REST + WebSocket API |
| Different concerns | Next.js/React vs Node/Express monorepo — nothing to share |
| Team clarity | Frontend devs get their own clean repo |
| Native app later | React Native/Expo will be a third repo when the time comes |
| Backend is complete | It has its own turborepo/pnpm workspaces — frontend would be a foreign body inside it |

**Repo name suggestion:** `nextmealai-web`

---

## 2. Tech Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 14+ App Router | SSR, file-based routing, edge middleware for auth |
| Language | TypeScript (strict) | Matches backend conventions |
| Styling | Tailwind CSS | Utility-first, pairs with shadcn |
| Components | shadcn/ui + Radix UI | Accessible, unstyled base, copy-paste pattern |
| Server state | TanStack React Query v5 | Caching, background sync, all API calls |
| Client state | Zustand | Auth session, chat streaming buffer, UI state |
| WebSocket | Socket.io client | Streaming chat, push notifications from Realtime service |
| Forms | React Hook Form + Zod | Onboarding forms, log entry forms |
| Auth | Supabase JS client (auth only) | JWT management, session refresh |
| Animations | Framer Motion | Page transitions, skeleton loaders, micro-interactions |

---

## 3. Design System — Color Tokens

> Source: `app-color.md`

```css
/* tailwind.config.ts — extend these */

/* Brand */
--color-brand:         #FF6A1A   /* Primary buttons, progress rings, active states */
--color-brand-start:   #FF7A1F   /* Header gradient start */
--color-brand-end:     #FF5A00   /* Header gradient end */

/* Backgrounds */
--color-bg-primary:    #0F2A44   /* Main app background (navy) */
--color-bg-secondary:  #173A5E   /* Cards, coach panels, widgets */
--color-bg-deep:       #0A1F33   /* Depth layers, dark gradients */

/* UI Surfaces */
--color-white:         #FFFFFF   /* Main cards, content containers */
--color-surface-grey:  #F3F5F7   /* Input fields, secondary surfaces */
--color-border:        #E1E5EA   /* Dividers, subtle borders */

/* Text */
--color-text-primary:  #1C1C1E   /* Main readable text */
--color-text-secondary:#6B7280   /* Secondary labels, descriptions */
--color-text-disabled: #9CA3AF   /* Inactive states */

/* Accents */
--color-success:       #34C759   /* Completed actions, confirmations */
--color-warning:       #FF8C42   /* Alerts, macro warnings */

/* Navigation */
--color-nav-bg:        #FFFFFF   /* Bottom navigation background */
--color-nav-active:    #FF6A1A   /* Selected nav icon */
--color-nav-inactive:  #9CA3AF   /* Unselected nav icons */

/* Progress Rings */
--color-ring-fill:     #FF6A1A   /* Calories/macros fill */
--color-ring-empty:    #E5E7EB   /* Remainder */
--color-ring-bg:       #F3F4F6   /* Background track */

/* Shadows */
--shadow-soft:   rgba(0,0,0,0.06)  /* Light elevation */
--shadow-medium: rgba(0,0,0,0.10)  /* Card elevation */
```

**Visual direction:** Dark navy app shell (like a fitness/health app feel) with vibrant orange brand accent. Cards appear white/light on the dark background. Clean, data-forward. Think: Whoop / MyFitnessPal dark mode x Trainerize's structured coaching layout.

---

## 4. App Pages & Routes

### Route Groups

```
(auth)     — No nav, clean centered layout → /login, /signup, /forgot-password
(app)      — Auth-guarded, bottom nav → all main app screens
onboarding — Own layout, no nav, Geo commentary sidebar
```

### Full Route Map

| Route | Page | Notes |
|-------|------|-------|
| `/` | Landing page | Pre-auth marketing/intro |
| `/login` | Login | Email+password, Google OAuth |
| `/signup` | Signup | Email+password, Google OAuth |
| `/forgot-password` | Password reset | Triggers Supabase email |
| `/onboarding/personal` | Personal module | Name, DOB, sex |
| `/onboarding/fitness` | Fitness module | Equipment, injuries, activity |
| `/onboarding/nutrition` | Nutrition module | Allergies, diet style, cuisines |
| `/onboarding/generating` | Plan generation | Loading screen, Geo commentary |
| `/dashboard` | Dashboard | Macro rings, today's plan, suggestions |
| `/chat` | Chat with Geo | Streaming, history |
| `/plans` | Plans list | Active meal + workout plans |
| `/plans/[id]` | Plan detail | Day-by-day view |
| `/logs` | Activity history | All logs, filters |
| `/scan` | Menu scanner | Camera upload + results |
| `/settings` | Settings | Notifications, Geo personality |
| `/settings/profile` | Profile edit | Weight, equipment, etc. |

---

## 5. File Structure

```
nextmealai-web/
├── public/
│   └── icons/
│
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── (auth)/                        # No nav, centered layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (app)/                         # Auth-guarded, has bottom nav
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   └── page.tsx
│   │   │   ├── plans/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── logs/
│   │   │   │   └── page.tsx
│   │   │   ├── scan/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx                 # Auth guard + bottom nav shell
│   │   │
│   │   ├── onboarding/                    # Own layout, no nav
│   │   │   ├── personal/
│   │   │   │   └── page.tsx
│   │   │   ├── fitness/
│   │   │   │   └── page.tsx
│   │   │   ├── nutrition/
│   │   │   │   └── page.tsx
│   │   │   ├── generating/
│   │   │   │   └── page.tsx              # Plan gen loading + Geo message
│   │   │   └── layout.tsx
│   │   │
│   │   ├── layout.tsx                     # Root layout (fonts, providers)
│   │   ├── page.tsx                       # Landing /
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui — NEVER manually edit
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── sheet.tsx                  # Bottom sheets (mobile-first)
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── bottom-nav.tsx             # Mobile bottom navigation
│   │   │   ├── header.tsx                 # Page-level header
│   │   │   └── page-wrapper.tsx           # Consistent padding/max-width
│   │   │
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   ├── personal-form.tsx
│   │   │   ├── fitness-form.tsx           # Equipment multi-select, injuries
│   │   │   ├── nutrition-form.tsx         # Allergies (safety-critical), diet style
│   │   │   ├── stage-indicator.tsx        # Progress dots (3 modules)
│   │   │   └── geo-commentary.tsx         # Geo's onboarding messages
│   │   │
│   │   ├── dashboard/
│   │   │   ├── macro-ring.tsx             # Circular progress for calories/macros
│   │   │   ├── today-plan-card.tsx        # Today's meals + workouts snapshot
│   │   │   ├── quick-log-button.tsx       # FAB or sticky button to log
│   │   │   └── suggestion-card.tsx        # AI suggestion with approve/reject
│   │   │
│   │   ├── chat/
│   │   │   ├── chat-window.tsx            # Scrollable message list
│   │   │   ├── chat-message.tsx           # User vs Geo message bubble
│   │   │   ├── chat-input.tsx             # Text input + send
│   │   │   └── typing-indicator.tsx       # Streaming dots animation
│   │   │
│   │   ├── plans/
│   │   │   ├── meal-plan-day.tsx          # Meals for a single day
│   │   │   ├── workout-plan-day.tsx       # Exercises for a single day
│   │   │   └── plan-version-badge.tsx     # "v3" badge on plan cards
│   │   │
│   │   ├── logs/
│   │   │   ├── log-food-sheet.tsx         # Bottom sheet: log a meal
│   │   │   ├── log-workout-sheet.tsx      # Bottom sheet: log workout
│   │   │   ├── log-sleep-sheet.tsx        # Bottom sheet: log sleep/energy
│   │   │   └── log-list.tsx               # Timeline of log entries
│   │   │
│   │   ├── scan/
│   │   │   ├── camera-capture.tsx         # Camera / file upload UI
│   │   │   ├── scan-results.tsx           # List of detected dishes
│   │   │   └── dish-card.tsx              # Individual dish with macros + log CTA
│   │   │
│   │   └── shared/
│   │       ├── macro-bar.tsx              # Horizontal protein/carbs/fat bar
│   │       ├── confidence-badge.tsx       # AI confidence % indicator
│   │       ├── geo-avatar.tsx             # Geo's avatar/icon
│   │       ├── empty-state.tsx            # When no data exists
│   │       └── loading-skeleton.tsx       # Shimmer skeletons
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                    # Auth state, login, logout, session
│   │   ├── use-socket.ts                  # Socket.io connection + event listeners
│   │   ├── use-onboarding.ts              # Multi-step form state + localStorage
│   │   ├── use-chat.ts                    # Send message, handle streaming tokens
│   │   ├── use-logs.ts                    # Log CRUD + optimistic updates
│   │   └── use-plans.ts                   # Active plan fetch + day navigation
│   │
│   ├── lib/
│   │   ├── api/                           # ALL API calls live here — never in components
│   │   │   ├── client.ts                  # Base fetch config, auth header injection
│   │   │   ├── auth.api.ts                # login, signup, logout, refresh
│   │   │   ├── profile.api.ts             # getProfile, updateProfile, onboarding modules
│   │   │   ├── logs.api.ts                # createLog, getLogs, getSummary
│   │   │   ├── plans.api.ts               # getPlans, getPlan, getPlanVersions
│   │   │   ├── chat.api.ts                # sendMessage (non-streaming fallback)
│   │   │   ├── settings.api.ts            # getSettings, updateSettings
│   │   │   ├── suggestions.api.ts         # getSuggestions, approve, reject
│   │   │   └── vision.api.ts              # scanMenu, getScanHistory
│   │   │
│   │   ├── socket.ts                      # Socket.io client singleton
│   │   ├── supabase.ts                    # Supabase JS client (auth + session only)
│   │   ├── query-keys.ts                  # React Query key factory (centralised)
│   │   └── utils.ts                       # cn(), formatMacros(), formatDate(), etc.
│   │
│   ├── stores/
│   │   ├── auth.store.ts                  # Zustand: user, session, JWT tokens
│   │   ├── chat.store.ts                  # Zustand: messages array, streaming buffer
│   │   └── ui.store.ts                    # Zustand: which sheets/modals are open
│   │
│   ├── types/
│   │   ├── api.types.ts                   # Shared API response shapes
│   │   ├── profile.types.ts
│   │   ├── logs.types.ts
│   │   ├── plans.types.ts
│   │   ├── chat.types.ts
│   │   └── settings.types.ts
│   │
│   └── middleware.ts                      # Next.js edge middleware — auth redirect guard
│
├── .env.local.example
├── components.json                        # shadcn/ui configuration
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## 6. Key Architectural Decisions

### Route groups for layout separation
- `(auth)` — centered, no navigation, clean
- `(app)` — the `layout.tsx` handles: check auth → if not logged in redirect to /login, check onboarding status → if incomplete redirect to /onboarding, render bottom nav
- `onboarding` — clean layout, Geo commentary on the side (desktop) or above (mobile), progress indicator

### Onboarding gate logic (middleware.ts)
```
Request to /dashboard (or any (app) route)
  → Check JWT in cookie
  → If no JWT → redirect /login
  → If JWT valid → check profile.onboarding_personal_complete
  → If false → redirect /onboarding/personal
  → Allow through
```
Feature-level gates (workouts, meals) handled in the (app) layout or individual pages — matches the backend's modular design.

### API layer pattern
Every API call is a typed function in `lib/api/*.api.ts`. Components never call fetch directly. React Query wraps these functions. When building React Native later, this entire layer is reusable as-is.

### WebSocket / Streaming chat
```
lib/socket.ts          — createClient(), connect with JWT, singleton
hooks/use-socket.ts    — connect on mount, handle events, cleanup on unmount
stores/chat.store.ts   — messages[], streamingBuffer (token accumulation)
components/chat/       — reads from store, renders incrementally
```
Socket events mapped from backend spec:
- `chat:message` → emit
- `chat:stream` → append token to buffer
- `chat:complete` → finalize message
- `suggestion:new` → trigger dashboard update
- `plan:updated` → invalidate React Query plan cache

### Forms — React Hook Form + Zod
Onboarding forms use the same Zod schemas as the backend validators (manually mirrored in `types/`). Validation happens client-side before any API call. This matches the `IMPLEMENTATION_PLAN.md` edge cases (age 13-120, weight 30-300, etc.).

### React Query key factory (query-keys.ts)
```typescript
export const queryKeys = {
  profile: () => ['profile'],
  onboardingStatus: () => ['profile', 'onboarding'],
  logs: (filters?) => ['logs', filters],
  logsSummary: (period) => ['logs', 'summary', period],
  plans: (type?) => ['plans', type],
  plan: (id) => ['plans', id],
  suggestions: (status?) => ['suggestions', status],
  settings: () => ['settings'],
  scans: () => ['scans'],
}
```

---

## 7. Backend Services Connection

| Frontend | Backend endpoint | Protocol |
|----------|-----------------|----------|
| Auth | `POST /auth/signup`, `/auth/login` etc. | REST |
| Profile + Onboarding | `GET/POST/PATCH /v1/profile/*` | REST |
| Logs | `GET/POST /v1/logs` | REST |
| Plans | `GET /v1/plans` | REST |
| Settings | `GET/PATCH /v1/settings` | REST |
| Suggestions | `GET/POST /v1/suggestions/:id/approve` | REST |
| Chat (non-streaming) | `POST /v1/chat` | REST (fallback) |
| Chat (streaming) | `chat:message` / `chat:stream` events | WebSocket (Port 3001) |
| Menu scanning | `POST /v1/vision/scan` | REST (Port 3003) |
| Push notifications | `suggestion:new`, `plan:updated` events | WebSocket (Port 3001) |

---

## 8. Mobile-First Patterns

- **Bottom navigation** (not sidebar) — 5 tabs max: Dashboard, Chat, Plans, Logs, Settings
- **Bottom sheets** (shadcn Sheet) for all quick-entry flows (log food, log workout)
- **Full-screen pages** for focus tasks (chat, menu scanner, onboarding steps)
- **Touch targets** minimum 44px height on all interactive elements
- **Safe area insets** handled via Tailwind's `pb-safe` / `pt-safe` with CSS env vars
- **Max width container**: `max-w-md mx-auto` — keeps it phone-width on desktop too (like a PWA shell)

---

## 9. Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend services
NEXT_PUBLIC_CORE_API_URL=http://localhost:3002
NEXT_PUBLIC_REALTIME_URL=ws://localhost:3001
NEXT_PUBLIC_VISION_API_URL=http://localhost:3003
```

---

## 10. Build Order (Implementation Phases)

### Phase 1 — Foundation
- [ ] Init Next.js repo with TypeScript + Tailwind + shadcn/ui
- [ ] Configure `tailwind.config.ts` with color tokens from `app-color.md`
- [ ] Set up Supabase client
- [ ] Set up React Query provider + Zustand stores
- [ ] Implement `middleware.ts` auth guard
- [ ] Build `(auth)` layout + login/signup pages

### Phase 2 — Onboarding
- [ ] Build 3-module onboarding forms (personal, fitness, nutrition)
- [ ] Stage indicator + Geo commentary component
- [ ] Plan generation loading screen
- [ ] Redirect logic after each module

### Phase 3 — Core App Shell
- [ ] Bottom navigation
- [ ] Dashboard page (macro rings, today's plan, suggestion card)
- [ ] Settings + profile edit pages

### Phase 4 — Chat
- [ ] Socket.io client + auth
- [ ] Streaming chat UI
- [ ] Non-streaming fallback (REST)

### Phase 5 — Logging & Plans
- [ ] Log food / workout / sleep sheets
- [ ] Plans list + day view
- [ ] AI suggestion approve/reject flow

### Phase 6 — Menu Scanner
- [ ] Camera capture component
- [ ] Scan results + dish cards
- [ ] Log from scan flow

---

## 11. Design Reference

**Trainerize** — Used as UI/UX inspiration for:
- Structured coaching card layouts
- Workout day-by-day views
- Clean data presentation for fitness metrics

**App aesthetic:** Dark navy shell (#0F2A44) with vibrant orange accent (#FF6A1A) on white/light cards. Data-forward but approachable. Geo's messages feel calm and analytical, not loud.

---

## 12. What's Pending

- [ ] **Design list from owner** — Visual references, specific UI decisions, landing page direction. Collect before Phase 1 starts.
- [ ] Decide on landing page scope (full marketing page or simple redirect-to-login)
- [ ] Confirm Vercel as deployment target
- [ ] Decide if PWA manifest needed (offline support, installable)
