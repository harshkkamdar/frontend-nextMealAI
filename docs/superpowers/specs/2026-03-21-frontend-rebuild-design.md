# NextMealAI Frontend Rebuild - Design Specification

## Overview

Complete rebuild of the NextMealAI frontend. Nuke `src/` and rebuild from scratch using the approved design system, proper information architecture, and all backend API capabilities.

**Goal**: Mobile-first MVP web app that surfaces 100% of backend capabilities through a polished, icon-driven UI with Geo AI chat as the core feature and manual logging as a first-class citizen.

**Stack**: Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 (`@theme inline`), Zustand, react-hook-form + Zod, shadcn/ui, Lucide React, Framer Motion, Sonner.

---

## Design System (Approved)

### Color Tokens
```
--bg: #FFFFFF
--surface: #F9F7F4
--surface-hover: #F3F0EB
--border: #E8E4DF
--accent: #E8663C
--accent-hover: #D45A32
--accent-light: #FDF0EB
--text-primary: #1A1A1A
--text-secondary: #6B6560
--text-tertiary: #A39E99
--success: #34C759
--info: #3B82F6
--warning: #FF9F0A
--purple: #A855F7
--destructive: #FF3B30
```

### Gradients
- **Hero gradient**: `linear-gradient(135deg, #FDF0EB 0%, #FEE8DE 50%, #FDF0EB 100%)` - Next Up card
- **Page fade**: `linear-gradient(180deg, #FDF0EB 0%, #FFFFFF 100%)` - top of home screen
- **Accent gradient**: `linear-gradient(135deg, #E8663C, #D45A32)` - buttons, FAB, user chat bubbles
- **Progress bar fills**: per-macro gradients (orange/blue/amber/purple)
- No success/green gradients

### Typography
- Font: Inter (400, 500, 600, 700)
- Heading: 22px/600/-0.02em
- Card title: 16-17px/600
- Body: 14px/400
- Secondary: 13px/500
- Mono data: 12px/500/tabular-nums
- Label: 10px/600/uppercase/0.08em tracking

### Border Radius
- sm: 8px, md: 12px, lg: 16px, xl: 20px, full: 9999px

### Icons
- **Always icons, never emojis**
- Library: Lucide React
- Nav: Home, MessageCircle, Plus (FAB), CalendarDays, MoreHorizontal
- Logs: UtensilsCrossed (food), Dumbbell (workout), Droplets (water), Scale (weight), SmilePlus (mood), Moon (sleep), Zap (energy), Camera (scan)
- States: Check, CircleCheck, Circle, ArrowLeft, X, ArrowUp

### Geo Avatar (DiceBear bottts-neutral)
Base URL: `https://api.dicebear.com/9.x/bottts-neutral/svg?backgroundColor=f4511e&eyes=frame2&seed={SEED}`

| State    | Seed   | Description      |
|----------|--------|------------------|
| Default  | Sadie  | Neutral/blank    |
| Happy    | Vivian | Smiley           |
| Thinking | Jack   | Vertical lines   |
| Suggest  | Robert | Neutral          |
| Coach    | Caleb  | Neutral          |

---

## Information Architecture

### Navigation (Bottom Tab Bar)
4 tabs + centered FAB:
1. **Home** (Home icon) - Dashboard overview
2. **Chat** (MessageCircle icon) - Geo AI conversations
3. **FAB** (+) - Quick Log bottom sheet
4. **Plans** (CalendarDays icon) - Meal & workout plans
5. **More** (MoreHorizontal icon) - Settings, profile, activity log

### Screen Inventory

#### Public (no auth)
- `/login` - Email/password login
- `/signup` - Email/password signup

#### Onboarding (auth required, sequential)
- `/onboarding/personal` - Name, DOB, sex
- `/onboarding/fitness` - Equipment, injuries, activity level, workout frequency, primary goal
- `/onboarding/nutrition` - Allergies, dietary style, dislikes, cuisines, meals/day, weight, target weight
- `/onboarding/generating` - Plan generation loading state

#### App (auth + onboarding complete)
- `/dashboard` - Home screen (greeting, next up, progress, quick stats, workout, suggestion)
- `/chat` - Chat session list
- `/chat/[sessionId]` - Active chat conversation (bottom bar hidden)
- `/plans` - Plans overview (active meal + workout plans)
- `/plans/[id]` - Plan detail view
- `/logs` - Activity log history (filterable by type)
- `/logs/new/[type]` - Manual log form (food, workout, water, weight, mood, sleep, energy)
- `/settings` - Settings hub (profile, notifications, Geo personality, theme, etc.)
- `/settings/profile` - Edit profile details

#### Overlays/Modals
- Quick Log bottom sheet (FAB tap) - 8 log type options
- Food log form (full-screen modal from quick log)

---

## Screen Details

### Home (`/dashboard`)
Top-down hierarchy:
1. **Greeting row** - "Good morning, {name}" + date + user avatar initial
2. **Next Up hero card** (warm gradient) - next planned meal with macros, "Log it" + "Swap" buttons
3. **Today's Progress card** - headline calorie count (accent, right-aligned) + 4 gradient progress bars (calories %, protein g, carbs g, fat g)
4. **Quick Stats row** - 4 mini stat boxes: Water (Droplets/blue), Mood (Smile/amber), Sleep (Moon/purple), Energy (Zap/accent)
5. **Today's Workout card** - workout name + exercise list with CircleCheck (done/green) and Circle (todo/gray) icons
6. **Geo Suggestion card** - Geo avatar (Suggest/Robert) + suggestion text + "Yes, update" / "Not now" buttons

No "Recent Activity" section (moved to `/logs`).

### Chat List (`/chat`)
- Title "Chats" + "New Chat" accent button (top-right)
- List of chat sessions: Geo avatar (Default/Sadie) + session title + preview text + timestamp
- Bottom nav visible

### Active Chat (`/chat/[sessionId]`)
- **Bottom nav hidden completely**
- Chat header: back arrow + Geo avatar (Default) + "Geo" + green "Online" status dot
- Message thread: Geo bubbles (surface bg, left-aligned with small avatar) + User bubbles (accent gradient, right-aligned)
- Geo responses can include inline action buttons ("Log this meal", "Swap it")
- Confirmation messages show green CircleCheck + "Logged" badge
- Input bar: rounded pill input + accent send button (ArrowUp icon)

### Quick Log (FAB bottom sheet)
- Sheet overlay with handle bar
- "Quick Log" title
- 4x2 grid of log types with colored Lucide icons:
  - Food (UtensilsCrossed/accent), Workout (Dumbbell/green), Water (Droplets/blue), Weight (Scale/purple)
  - Mood (SmilePlus/amber), Sleep (Moon/indigo), Energy (Zap/accent), Scan Menu (Camera/gray)

### Food Log Form (`/logs/new/food`)
- Close (X) button + "Log Food" title
- Meal type chip row: Breakfast, Lunch, Dinner, Snack
- Form fields: Food name, Quantity (g), Calories, Protein, Carbs, Fat (2x2 grid)
- "Don't know macros? Ask Geo to estimate" link (MessageCircle icon, accent color)
- Save button (full-width accent gradient)

### Other Log Forms (`/logs/new/[type]`)
- **Workout**: Exercise name, sets, reps, weight (kg), duration (min), difficulty (1-10 slider), notes
- **Water**: Glasses counter (tap to increment) or liters input
- **Weight**: Weight (kg) input with trend indicator
- **Mood**: Rating 1-10 (visual scale) + notes
- **Sleep**: Hours + quality rating 1-10 + notes
- **Energy**: Rating 1-10 + time of day + notes

### Plans (`/plans`)
- Two sections: Active Meal Plan + Active Workout Plan
- Each shows plan summary, date range, status
- Tap to view full plan detail

### Plan Detail (`/plans/[id]`)
- Meal plan: day-by-day view with meals, macros per meal, daily totals
- Workout plan: day-by-day view with exercises, sets/reps/weight
- Version history accessible

### Activity Log (`/logs`)
- Filterable by type (all, food, workout, water, weight, mood, sleep, energy)
- Chronological feed with colored dots per type
- Each entry shows type icon, name/description, key metric, timestamp

### Settings (`/settings`)
- Profile link (name, email)
- Notifications toggle + time picker + notification types
- Geo Personality selector (Nurturing, Drill Sergeant, Balanced, Data-Driven)
- Theme (Light/Dark/System)
- Auto-apply suggestions toggle + threshold slider
- Language
- Share progress toggle
- Analytics toggle
- Reset settings
- Logout

### Profile (`/settings/profile`)
- Measurements: weight, target weight, height
- Primary goal selector
- Activity level selector
- Dietary style chips
- Equipment multi-select chips
- Injuries list
- Allergies list
- Disliked foods
- Preferred cuisines

---

## Backend API Coverage

### Endpoints the frontend MUST call:

| Feature | Endpoints |
|---------|-----------|
| Auth | POST /auth/login, /signup, /logout, /refresh |
| Profile | GET/PUT /v1/profile, GET/POST onboarding/* |
| Logs | GET/POST/DELETE /v1/logs, GET /v1/logs/summary |
| Chat | POST /v1/chat, GET /v1/chat/sessions, GET/DELETE /v1/chat/sessions/:id |
| Plans | GET /v1/plans, GET /v1/plans/:id, POST /v1/plans/:id/activate |
| Suggestions | GET /v1/suggestions, POST /v1/suggestions/:id/action |
| Settings | GET/PATCH /v1/settings |
| Memories | GET /v1/memories (read-only display, Geo manages via tools) |
| Vision | POST /v1/vision/scan, GET /v1/vision/scans (future) |

---

## Architecture Decisions

### What to preserve from existing codebase
1. **API client pattern** (`apiFetch()` with auth headers)
2. **Auth store** (Zustand + localStorage persist + cookie sync)
3. **Middleware** (auth guard + onboarding check + cookie caching)
4. **Next.js rewrites** (API proxy config)
5. **TypeScript types** (all type definitions, updated for completeness)
6. **shadcn/ui setup** (but reinstall fresh components)

### What to rebuild from scratch
1. All page components
2. All feature components (dashboard, chat, plans, logs, settings)
3. Layout components (bottom nav, page wrapper)
4. Shared components (geo avatar, empty state, loading states)
5. globals.css (updated design tokens)
6. All form components with new Zod schemas

### New capabilities to add
1. Manual log forms for ALL 7 log types (not just through chat)
2. Chat session list with history
3. Active chat with hidden bottom bar
4. Plan detail views
5. Activity log with type filtering
6. Full settings page with all backend options
7. Geo personality selector
8. Proper empty states for every section

---

## Component Inventory

### Layout
- `RootLayout` - HTML, font, metadata, Providers, Toaster
- `AppLayout` - Auth guard + onboarding check + BottomNav
- `AuthLayout` - Centered card for login/signup
- `OnboardingLayout` - Step indicator wrapper
- `PageWrapper` - max-w-md container with padding
- `BottomNav` - 4 tabs + FAB (hides on chat routes)

### Shared
- `GeoAvatar` - DiceBear avatar with state prop (default/happy/thinking/suggest/coach)
- `EmptyState` - Icon + title + description + optional CTA
- `CardSkeleton` - Loading skeleton
- `QuickLogSheet` - Bottom sheet with 8 log types (Framer Motion)

### Dashboard
- `NextUpCard` - Hero meal card with gradient
- `ProgressCard` - Calorie headline + 4 macro progress bars
- `QuickStats` - 4 mini stat boxes (water/mood/sleep/energy)
- `WorkoutCard` - Today's workout with exercise checklist
- `SuggestionCard` - Geo suggestion with action buttons

### Chat
- `SessionList` - Chat history list
- `ChatHeader` - Back + avatar + name + status
- `ChatThread` - Message list
- `ChatBubble` - User or Geo message bubble
- `ChatInput` - Input bar with send button

### Forms
- `FoodLogForm` - Meal type + food name + quantity + macros
- `WorkoutLogForm` - Exercise + sets/reps/weight + duration
- `WaterLogForm` - Glasses counter
- `WeightLogForm` - Weight input
- `MoodLogForm` - Rating scale + notes
- `SleepLogForm` - Hours + quality + notes
- `EnergyLogForm` - Rating + time of day + notes

### Plans
- `PlanOverview` - Summary card for active plans
- `MealPlanDetail` - Day-by-day meal view
- `WorkoutPlanDetail` - Day-by-day workout view

### Settings
- `SettingsPage` - Full settings with all options
- `ProfileForm` - Editable profile fields

### Auth
- `LoginForm` - Email/password with Zod validation
- `SignupForm` - Email/password with Zod validation

### Onboarding
- `PersonalForm` - Name, DOB, sex
- `FitnessForm` - Equipment, injuries, activity, goals
- `NutritionForm` - Allergies, diet, dislikes, weight
- `StepIndicator` - Progress dots
- `MultiChip` - Multi-select chip input
- `GeoCommentary` - Geo message bubble in onboarding

---

## Data Flow

### Auth Flow
1. Login/Signup -> API returns user + tokens
2. Store in Zustand (persisted to localStorage)
3. Set `nextmealai-token` cookie for middleware
4. Middleware checks cookie on every route
5. `apiFetch()` reads token from store for API calls
6. Token refresh on 401

### Dashboard Data
- Parallel fetch on mount: `getLogsSummary('day')`, `getPlans({active_only: true})`, `getSuggestions({status: 'pending'})`
- Derive: today's meals from active meal plan, macro progress from log summary, workout from active workout plan

### Chat Flow
1. `/chat` loads session list via `getChatSessions()`
2. Tap session -> navigate to `/chat/[sessionId]`
3. Load messages via `getChatSession(sessionId)`
4. Send message via `sendMessage({message, session_id})`
5. New chat -> omit session_id, API creates new session
6. Response includes tools_used, actions_taken for UI feedback

### Log Flow
1. FAB tap -> Quick Log sheet
2. Select type -> navigate to `/logs/new/[type]`
3. Fill form -> `createLog({type, payload, source: 'manual'})`
4. Success toast + navigate back
5. "Ask Geo" link -> navigate to `/chat` with prefilled message

---

## Visual Prototype

Approved design HTML at `/tmp/nextmealai-design.html` (served via `python3 -m http.server 8888`).
