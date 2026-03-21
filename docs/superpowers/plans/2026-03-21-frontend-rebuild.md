# NextMealAI Frontend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire NextMealAI frontend from scratch with an approved design system, proper information architecture, and 100% backend API coverage.

**Architecture:** Nuke `src/` and rebuild using Next.js 16 App Router with route groups `(auth)`, `(app)`, and `onboarding`. Preserve `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`. Every component uses Lucide icons (never emojis), the approved warm color palette with subtle gradients, and Inter typography.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 (inline theme), Zustand 5, react-hook-form 7 + Zod 4, shadcn/ui 4, Lucide React, Framer Motion 12, Sonner 2.

**Spec:** `docs/superpowers/specs/2026-03-21-frontend-rebuild-design.md`

**Note on testing:** This frontend has no test framework configured. Each task verifies via `npx tsc --noEmit` (type safety) + visual smoke test with `npm run dev`. Setting up Vitest/Playwright is out of scope for this MVP rebuild.

---

## File Structure (Complete)

```
src/
├── app/
│   ├── globals.css                          # Tailwind v4 @theme inline + design tokens
│   ├── layout.tsx                           # Root layout: Inter font, metadata, Providers, Toaster
│   ├── page.tsx                             # Root redirect to /login
│   ├── not-found.tsx                        # 404 page
│   ├── (auth)/
│   │   ├── layout.tsx                       # Centered card layout
│   │   ├── login/page.tsx                   # Login form
│   │   └── signup/page.tsx                  # Signup form
│   ├── onboarding/
│   │   ├── layout.tsx                       # Onboarding wrapper with step indicator
│   │   ├── personal/page.tsx                # Step 1: name, DOB, sex
│   │   ├── fitness/page.tsx                 # Step 2: equipment, injuries, activity, goals
│   │   ├── nutrition/page.tsx               # Step 3: allergies, diet, dislikes, weight
│   │   └── generating/page.tsx              # Loading state for plan generation
│   └── (app)/
│       ├── layout.tsx                       # Auth guard + BottomNav + QuickLogSheet
│       ├── dashboard/page.tsx               # Home screen
│       ├── chat/
│       │   ├── page.tsx                     # Chat session list
│       │   └── [sessionId]/page.tsx         # Active chat (no bottom nav)
│       ├── plans/
│       │   ├── page.tsx                     # Plans overview
│       │   └── [id]/page.tsx                # Plan detail
│       ├── logs/
│       │   ├── page.tsx                     # Activity log list
│       │   └── new/[type]/page.tsx          # Manual log form (food/workout/water/weight/mood/sleep/energy)
│       └── settings/
│           ├── page.tsx                     # Settings hub
│           └── profile/page.tsx             # Edit profile
├── components/
│   ├── providers.tsx                        # Client providers wrapper
│   ├── ui/                                  # shadcn/ui (reinstalled fresh)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   └── progress.tsx
│   ├── layout/
│   │   ├── bottom-nav.tsx                   # 4 tabs + FAB
│   │   └── page-wrapper.tsx                 # max-w-md container
│   ├── shared/
│   │   ├── geo-avatar.tsx                   # DiceBear avatar with state prop
│   │   ├── empty-state.tsx                  # Icon + title + description + CTA
│   │   ├── loading-skeleton.tsx             # CardSkeleton, TextSkeleton
│   │   └── quick-log-sheet.tsx              # Bottom sheet with 8 log types
│   ├── auth/
│   │   ├── login-form.tsx                   # Email/password login
│   │   └── signup-form.tsx                  # Email/password signup
│   ├── onboarding/
│   │   ├── personal-form.tsx                # Step 1 form
│   │   ├── fitness-form.tsx                 # Step 2 form
│   │   ├── nutrition-form.tsx               # Step 3 form
│   │   ├── step-indicator.tsx               # Progress dots
│   │   ├── multi-chip.tsx                   # Multi-select chip input
│   │   └── geo-commentary.tsx               # Geo message bubble
│   ├── dashboard/
│   │   ├── next-up-card.tsx                 # Hero meal card with gradient
│   │   ├── progress-card.tsx                # Calorie headline + macro bars
│   │   ├── quick-stats.tsx                  # Water/mood/sleep/energy mini cards
│   │   ├── workout-card.tsx                 # Today's workout checklist
│   │   └── suggestion-card.tsx              # Geo suggestion with actions
│   ├── chat/
│   │   ├── session-list.tsx                 # Chat history list
│   │   ├── chat-header.tsx                  # Back + avatar + name + status
│   │   ├── chat-thread.tsx                  # Message list container
│   │   ├── chat-bubble.tsx                  # User or Geo message
│   │   ├── chat-input.tsx                   # Input bar with send button
│   │   └── typing-indicator.tsx             # Animated dots
│   ├── logs/
│   │   ├── log-list.tsx                     # Filterable activity feed
│   │   ├── food-log-form.tsx                # Food form
│   │   ├── workout-log-form.tsx             # Workout form
│   │   ├── water-log-form.tsx               # Water form
│   │   ├── weight-log-form.tsx              # Weight form
│   │   ├── mood-log-form.tsx                # Mood form
│   │   ├── sleep-log-form.tsx               # Sleep form
│   │   └── energy-log-form.tsx              # Energy form
│   ├── plans/
│   │   ├── plan-overview-card.tsx           # Summary card
│   │   ├── meal-plan-detail.tsx             # Day-by-day meals
│   │   └── workout-plan-detail.tsx          # Day-by-day workouts
│   └── settings/
│       ├── settings-section.tsx             # Grouped settings card
│       └── profile-form.tsx                 # Editable profile fields
├── lib/
│   ├── api/
│   │   ├── client.ts                        # apiFetch() base client
│   │   ├── auth.api.ts                      # signup, login, logout, refresh
│   │   ├── profile.api.ts                   # profile + onboarding endpoints
│   │   ├── logs.api.ts                      # CRUD logs + summary
│   │   ├── chat.api.ts                      # send message, sessions
│   │   ├── plans.api.ts                     # list/get/activate plans
│   │   ├── suggestions.api.ts               # list + action
│   │   └── settings.api.ts                  # get/update settings
│   ├── supabase.ts                          # Supabase client init
│   └── utils.ts                             # cn(), formatDate(), getGreeting()
├── stores/
│   ├── auth.store.ts                        # User + tokens (persisted)
│   └── ui.store.ts                          # activeSheet state
├── types/
│   ├── api.types.ts                         # ApiException
│   ├── profile.types.ts                     # Profile, onboarding inputs
│   ├── logs.types.ts                        # Log, LogType, payloads, summary
│   ├── chat.types.ts                        # ChatMessage, ChatSession, ChatResponse
│   ├── plans.types.ts                       # Plan, MealPlan, WorkoutPlan
│   ├── suggestions.types.ts                 # Suggestion, actions
│   └── settings.types.ts                    # Settings
└── middleware.ts                             # Auth guard + onboarding check
```

---

## Chunk 1: Foundation

### Task 1: Nuke src/ and scaffold base files

**Files:**
- Delete: `src/` (entire directory)
- Create: `src/app/globals.css`
- Create: `src/lib/utils.ts`
- Create: `src/types/api.types.ts`

- [ ] **Step 1: Delete src/ directory**

```bash
rm -rf src/
```

- [ ] **Step 2: Create globals.css with design tokens**

Create `src/app/globals.css`:
```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: #FFFFFF;
  --color-surface: #F9F7F4;
  --color-surface-hover: #F3F0EB;
  --color-border: #E8E4DF;
  --color-accent: #E8663C;
  --color-accent-hover: #D45A32;
  --color-accent-light: #FDF0EB;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6560;
  --color-text-tertiary: #A39E99;
  --color-success: #34C759;
  --color-info: #3B82F6;
  --color-warning: #FF9F0A;
  --color-purple: #A855F7;
  --color-destructive: #FF3B30;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-background text-text-primary font-sans antialiased;
  }
}
```

- [ ] **Step 3: Create utils.ts**

Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
```

- [ ] **Step 4: Create api.types.ts**

Create `src/types/api.types.ts`:
```typescript
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public code?: string,
    public details?: string
  ) {
    super(details ?? error)
    this.name = 'ApiException'
  }
}
```

- [ ] **Step 5: Verify structure**

```bash
ls src/app/globals.css src/lib/utils.ts src/types/api.types.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: nuke src/ and scaffold foundation (globals.css, utils, api types)"
```

---

### Task 2: Type definitions

**Files:**
- Create: `src/types/profile.types.ts`
- Create: `src/types/logs.types.ts`
- Create: `src/types/chat.types.ts`
- Create: `src/types/plans.types.ts`
- Create: `src/types/suggestions.types.ts`
- Create: `src/types/settings.types.ts`

- [ ] **Step 1: Create profile.types.ts**

Create `src/types/profile.types.ts`:
```typescript
export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'lightly_active' | 'moderate' | 'moderately_active' | 'active' | 'very_active'
export type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'body_recomposition' | 'improve_health' | 'athletic_performance'
export type DietaryStyle = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher'

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  dob?: string
  sex?: Sex
  height_cm?: number
  current_weight_kg?: number
  target_weight_kg?: number
  activity_level?: ActivityLevel
  primary_goal?: PrimaryGoal
  dietary_style?: DietaryStyle
  equipment?: string[]
  injuries?: string[]
  allergies?: string[]
  disliked_foods?: string[]
  preferred_cuisines?: string[]
  meals_per_day?: number
  workout_frequency?: number
  onboarding_personal_complete?: boolean
  onboarding_fitness_complete?: boolean
  onboarding_nutrition_complete?: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingStatus {
  personal: { complete: boolean; completed_at: string | null }
  fitness: { complete: boolean; completed_at: string | null }
  nutrition: { complete: boolean; completed_at: string | null }
}

export function canUseApp(status: OnboardingStatus): boolean {
  return status.personal.complete && status.fitness.complete && status.nutrition.complete
}

export interface PersonalOnboardingInput {
  name: string
  dob: string
  sex: Sex
}

export interface FitnessOnboardingInput {
  equipment: string[]
  injuries: string[]
  activity_level: ActivityLevel
  workout_frequency: number
  primary_goal: PrimaryGoal
}

export interface NutritionOnboardingInput {
  allergies: string[]
  dietary_style?: DietaryStyle
  dislikes?: string[]
  cuisines?: string[]
  meals_per_day?: number
  weight_kg?: number
  target_weight_kg?: number
}
```

- [ ] **Step 2: Create logs.types.ts**

Create `src/types/logs.types.ts`:
```typescript
export type LogType = 'food' | 'workout' | 'sleep' | 'mood' | 'energy' | 'water' | 'weight' | 'correction'
export type LogSource = 'manual' | 'menu_scan' | 'ai_suggestion' | 'quick_log' | 'import'

export interface FoodPayload {
  food_name: string
  quantity_g?: number
  est_macros?: { calories?: number; protein?: number; carbs?: number; fat?: number }
  meal_type?: string
  notes?: string
}

export interface WorkoutPayload {
  exercise: string
  sets?: number
  reps?: number
  weight_kg?: number
  duration_min?: number
  difficulty_rating?: number
  notes?: string
}

export interface SleepPayload {
  hours: number
  quality_rating: number
  notes?: string
}

export interface MoodPayload {
  rating: number
  notes?: string
}

export interface EnergyPayload {
  rating: number
  time_of_day?: string
  notes?: string
}

export interface WaterPayload {
  glasses?: number
  liters?: number
}

export interface WeightPayload {
  weight_kg: number
  notes?: string
}

export type LogPayload = FoodPayload | WorkoutPayload | SleepPayload | MoodPayload | EnergyPayload | WaterPayload | WeightPayload

export interface Log {
  id: string
  user_id: string
  type: LogType
  payload: LogPayload
  source: LogSource
  created_at: string
  updated_at: string
}

export interface LogsSummary {
  period: string
  summary: {
    total_logs: number
    avg_daily_calories: number
    avg_daily_protein: number
    workout_count: number
    avg_sleep_hours: number
    avg_energy_rating: number
  }
  daily_breakdown?: {
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    workouts: number
  }[]
}

export interface CreateLogInput {
  type: LogType
  payload: LogPayload
  source?: LogSource
}
```

- [ ] **Step 3: Create chat.types.ts**

Create `src/types/chat.types.ts`:
```typescript
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id?: string
  role: MessageRole
  content: string
  timestamp?: string
  tokens_used?: number
}

export interface ChatSession {
  id: string
  session_id: string
  user_id: string
  title?: string
  message_count?: number
  last_message?: string
  created_at: string
  updated_at: string
}

export interface ChatResponse {
  session_id: string
  response: {
    content: string
    role: MessageRole
    tokens_used?: number
  }
  tools_used?: string[]
  actions_taken?: string[]
}

export interface SendMessageInput {
  message: string
  session_id?: string
}
```

- [ ] **Step 4: Create plans.types.ts**

Create `src/types/plans.types.ts`:
```typescript
export type PlanType = 'meal' | 'workout'
export type PlanStatus = 'draft' | 'active' | 'superseded' | 'completed'

export interface MealPlanMeal {
  type: string
  name: string
  time?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealPlanSnack {
  name: string
  time?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealPlanDay {
  date: string
  meals: MealPlanMeal[]
  snacks?: MealPlanSnack[]
}

export interface WorkoutExercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration_seconds?: number
  notes?: string
}

export interface WorkoutPlanDay {
  date: string
  name: string
  is_rest_day?: boolean
  exercises?: WorkoutExercise[]
}

export interface MealPlan {
  id: string
  user_id: string
  type: 'meal'
  status: PlanStatus
  version?: number
  start_date?: string
  end_date?: string
  content: {
    days?: MealPlanDay[]
    daily_targets?: { calories: number; protein: number; carbs: number; fat: number }
    notes?: string
  }
  created_at: string
  updated_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  type: 'workout'
  status: PlanStatus
  version?: number
  start_date?: string
  end_date?: string
  content: {
    days?: WorkoutPlanDay[]
    notes?: string
  }
  created_at: string
  updated_at: string
}

export type Plan = MealPlan | WorkoutPlan
```

- [ ] **Step 5: Create suggestions.types.ts**

Create `src/types/suggestions.types.ts`:
```typescript
export type SuggestionAction = 'approve' | 'reject' | 'dismiss'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'dismissed' | 'applied' | 'expired'
export type SuggestionType = 'meal_swap' | 'macro_adjustment' | 'workout_modification' | 'rest_day' | 'hydration' | 'sleep' | 'general'

export interface Suggestion {
  id: string
  user_id: string
  type: SuggestionType
  title: string
  description: string
  confidence?: number
  status: SuggestionStatus
  feedback?: string
  created_at: string
  updated_at: string
}

export interface SuggestionActionInput {
  action: SuggestionAction
  feedback?: string
}
```

- [ ] **Step 6: Create settings.types.ts**

Create `src/types/settings.types.ts`:
```typescript
export type GeoPersonality = 'nurturing' | 'drill_sergeant' | 'balanced' | 'data_driven'
export type Theme = 'light' | 'dark' | 'system'
export type NotificationType = 'daily_summary' | 'meal_reminders' | 'workout_reminders' | 'goal_achievements'

export interface Settings {
  id: string
  user_id: string
  notifications_enabled: boolean
  notification_time: string
  notification_types: NotificationType[]
  geo_personality: GeoPersonality
  auto_apply_suggestions: boolean
  auto_apply_threshold: number
  theme: Theme
  language: string
  share_progress: boolean
  analytics_enabled: boolean
  created_at: string
  updated_at: string
}

export type SettingsUpdateInput = Partial<Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
```

- [ ] **Step 7: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/types/ && git commit -m "feat: add all TypeScript type definitions"
```

---

### Task 3: Stores, API client, and middleware

**Files:**
- Create: `src/stores/auth.store.ts`
- Create: `src/stores/ui.store.ts`
- Create: `src/lib/api/client.ts`
- Create: `src/lib/api/auth.api.ts`
- Create: `src/lib/api/profile.api.ts`
- Create: `src/lib/api/logs.api.ts`
- Create: `src/lib/api/chat.api.ts`
- Create: `src/lib/api/plans.api.ts`
- Create: `src/lib/api/suggestions.api.ts`
- Create: `src/lib/api/settings.api.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create auth.store.ts**

Create `src/stores/auth.store.ts` — copy exact content from the existing file (already read above, lines 1-41).

- [ ] **Step 2: Create ui.store.ts**

Create `src/stores/ui.store.ts`:
```typescript
import { create } from 'zustand'

interface UIState {
  activeSheet: string | null
  openSheet: (name: string) => void
  closeSheet: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeSheet: null,
  openSheet: (name) => set({ activeSheet: name }),
  closeSheet: () => set({ activeSheet: null }),
}))
```

- [ ] **Step 3: Create API client and all API modules**

Create `src/lib/api/client.ts` — copy exact content from existing file (already read above, lines 1-49).

Create `src/lib/api/auth.api.ts`:
```typescript
import { apiFetch } from './client'
import { useAuthStore } from '@/stores/auth.store'

interface AuthResponse {
  user: { id: string; email: string }
  session: { access_token: string; refresh_token: string }
}

export async function signup(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, password, fullName },
  })
  useAuthStore.getState().setSession(data.user, data.session.access_token, data.session.refresh_token)
  document.cookie = `nextmealai-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  useAuthStore.getState().setSession(data.user, data.session.access_token, data.session.refresh_token)
  document.cookie = `nextmealai-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  return data
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    useAuthStore.getState().clearSession()
    document.cookie = 'nextmealai-token=; path=/; max-age=0'
    document.cookie = 'nextmealai-onboarded=; path=/; max-age=0'
  }
}
```

Create `src/lib/api/profile.api.ts`:
```typescript
import { apiFetch } from './client'
import type { Profile, OnboardingStatus, PersonalOnboardingInput, FitnessOnboardingInput, NutritionOnboardingInput } from '@/types/profile.types'

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>('/v1/profile')
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return apiFetch<Profile>('/v1/profile', { method: 'PUT', body: data })
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>('/v1/profile/onboarding')
}

export async function submitPersonalOnboarding(data: PersonalOnboardingInput): Promise<void> {
  await apiFetch('/v1/profile/onboarding/personal', { method: 'POST', body: data })
}

export async function submitFitnessOnboarding(data: FitnessOnboardingInput): Promise<void> {
  await apiFetch('/v1/profile/onboarding/fitness', { method: 'POST', body: data })
}

export async function submitNutritionOnboarding(data: NutritionOnboardingInput): Promise<void> {
  await apiFetch('/v1/profile/onboarding/nutrition', { method: 'POST', body: data })
}
```

Create `src/lib/api/logs.api.ts`:
```typescript
import { apiFetch } from './client'
import type { Log, LogsSummary, CreateLogInput } from '@/types/logs.types'

export async function getLogs(params?: { type?: string; days?: number; limit?: number; offset?: number }): Promise<Log[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.days) query.set('days', String(params.days))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch<Log[]>(`/v1/logs${qs ? `?${qs}` : ''}`)
}

export async function getLogsSummary(period: 'day' | 'week' | 'month'): Promise<LogsSummary> {
  return apiFetch<LogsSummary>(`/v1/logs/summary?period=${period}`)
}

export async function createLog(data: CreateLogInput): Promise<Log> {
  return apiFetch<Log>('/v1/logs', { method: 'POST', body: data })
}

export async function deleteLog(id: string): Promise<void> {
  await apiFetch(`/v1/logs/${id}`, { method: 'DELETE' })
}
```

Create `src/lib/api/chat.api.ts`:
```typescript
import { apiFetch } from './client'
import type { ChatResponse, ChatSession, ChatMessage, SendMessageInput } from '@/types/chat.types'

export async function sendMessage(input: SendMessageInput): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: input })
}

export async function getChatSessions(): Promise<ChatSession[]> {
  return apiFetch<ChatSession[]>('/v1/chat/sessions')
}

export async function getChatSession(sessionId: string, params?: { limit?: number; offset?: number }): Promise<{ messages: ChatMessage[] }> {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch(`/v1/chat/sessions/${sessionId}${qs ? `?${qs}` : ''}`)
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiFetch(`/v1/chat/sessions/${sessionId}`, { method: 'DELETE' })
}
```

Create `src/lib/api/plans.api.ts`:
```typescript
import { apiFetch } from './client'
import type { Plan } from '@/types/plans.types'

export async function getPlans(params?: { type?: string; active_only?: boolean }): Promise<Plan[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.active_only) query.set('active_only', 'true')
  const qs = query.toString()
  return apiFetch<Plan[]>(`/v1/plans${qs ? `?${qs}` : ''}`)
}

export async function getPlan(id: string): Promise<Plan> {
  return apiFetch<Plan>(`/v1/plans/${id}`)
}

export async function activatePlan(id: string): Promise<void> {
  await apiFetch(`/v1/plans/${id}/activate`, { method: 'POST' })
}
```

Create `src/lib/api/suggestions.api.ts`:
```typescript
import { apiFetch } from './client'
import type { Suggestion, SuggestionActionInput } from '@/types/suggestions.types'

export async function getSuggestions(params?: { status?: string; type?: string }): Promise<Suggestion[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.type) query.set('type', params.type)
  const qs = query.toString()
  return apiFetch<Suggestion[]>(`/v1/suggestions${qs ? `?${qs}` : ''}`)
}

export async function takeSuggestionAction(id: string, input: SuggestionActionInput): Promise<void> {
  await apiFetch(`/v1/suggestions/${id}/action`, { method: 'POST', body: input })
}
```

Create `src/lib/api/settings.api.ts`:
```typescript
import { apiFetch } from './client'
import type { Settings, SettingsUpdateInput } from '@/types/settings.types'

export async function getSettings(): Promise<Settings> {
  return apiFetch<Settings>('/v1/settings')
}

export async function updateSettings(data: SettingsUpdateInput): Promise<Settings> {
  return apiFetch<Settings>('/v1/settings', { method: 'PATCH', body: data })
}
```

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 4: Create middleware.ts**

Create `src/middleware.ts` — copy exact content from the existing `src/proxy.ts` file (already read above, lines 1-89), but rename the export from `proxy` to `middleware`:
```typescript
// Change line 4 from:
export async function proxy(request: NextRequest) {
// To:
export async function middleware(request: NextRequest) {
```

- [ ] **Step 5: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/stores/ src/lib/ src/middleware.ts && git commit -m "feat: add stores, API client layer, and middleware"
```

---

### Task 4: shadcn/ui components and providers

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/providers.tsx`

- [ ] **Step 1: Install shadcn/ui components**

```bash
npx shadcn@latest add button input label card skeleton progress --yes
```

If the CLI doesn't work (no components.json), create the files manually by copying from the existing codebase or shadcn/ui docs. The key components are Button (with accent variant), Input, Label, Card, Skeleton, Progress.

- [ ] **Step 2: Create providers.tsx**

Create `src/components/providers.tsx`:
```typescript
'use client'

import { type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ && git commit -m "feat: add shadcn/ui components and providers"
```

---

### Task 5: Root layout and app shell

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/components/layout/page-wrapper.tsx`

- [ ] **Step 1: Create root layout**

Create `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'NextMealAI',
  description: 'AI-powered nutrition and fitness coaching',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create root page (redirect)**

Create `src/app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
```

- [ ] **Step 3: Create not-found page**

Create `src/app/not-found.tsx`:
```typescript
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-[22px] font-semibold text-text-primary">Page not found</h1>
        <p className="text-sm text-text-secondary mt-2">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard" className="text-sm text-accent font-medium mt-4 inline-block">
          Go home
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create page-wrapper**

Create `src/components/layout/page-wrapper.tsx`:
```typescript
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-md px-4 py-6', className)}>
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Visit `http://localhost:3000` — should redirect to `/login` (which will 404 for now, that's expected).

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/not-found.tsx src/components/layout/page-wrapper.tsx && git commit -m "feat: add root layout, page wrapper, and app shell"
```

---

## Chunk 2: Auth & Onboarding

### Task 6: Auth pages (login + signup)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/signup-form.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create login-form component**

Create `src/components/auth/login-form.tsx` — a `'use client'` form with:
- Zod schema: email (valid email), password (min 1 char)
- react-hook-form with zodResolver
- Calls `login()` from auth.api
- On success: `router.push('/dashboard')`
- Error handling with `toast.error()`
- Uses `<Input>`, `<Label>`, `<Button>` from shadcn/ui
- Link to `/signup`

- [ ] **Step 3: Create signup-form component**

Create `src/components/auth/signup-form.tsx` — similar to login-form with:
- Zod schema: email, password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special), confirmPassword (matches password)
- Calls `signup()` from auth.api
- On success: `router.push('/onboarding/personal')`
- Link to `/login`

- [ ] **Step 4: Create login page**

Create `src/app/(auth)/login/page.tsx`:
```typescript
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 5: Create signup page**

Create `src/app/(auth)/signup/page.tsx`:
```typescript
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return <SignupForm />
}
```

- [ ] **Step 6: Smoke test**

```bash
npm run dev
```
Visit `/login` — should render the login form. Visit `/signup` — should render signup form.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/ && git commit -m "feat: add login and signup pages with Zod validation"
```

---

### Task 7: Onboarding flow (3 steps + generating)

**Files:**
- Create: `src/app/onboarding/layout.tsx`
- Create: `src/app/onboarding/personal/page.tsx`
- Create: `src/app/onboarding/fitness/page.tsx`
- Create: `src/app/onboarding/nutrition/page.tsx`
- Create: `src/app/onboarding/generating/page.tsx`
- Create: `src/components/onboarding/personal-form.tsx`
- Create: `src/components/onboarding/fitness-form.tsx`
- Create: `src/components/onboarding/nutrition-form.tsx`
- Create: `src/components/onboarding/step-indicator.tsx`
- Create: `src/components/onboarding/multi-chip.tsx`
- Create: `src/components/onboarding/geo-commentary.tsx`
- Create: `src/components/shared/geo-avatar.tsx`

- [ ] **Step 1: Create GeoAvatar shared component**

Create `src/components/shared/geo-avatar.tsx`:
```typescript
'use client'

import { cn } from '@/lib/utils'

type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'

const SEEDS: Record<GeoState, string> = {
  default: 'Sadie',
  happy: 'Vivian',
  thinking: 'Jack',
  suggest: 'Robert',
  coach: 'Caleb',
}

function avatarUrl(state: GeoState): string {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?backgroundColor=f4511e&eyes=frame2&seed=${SEEDS[state]}`
}

export function GeoAvatar({ state = 'default', size = 36, className }: {
  state?: GeoState
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('rounded-full overflow-hidden shrink-0 bg-accent-light', className)}
      style={{ width: size, height: size }}
    >
      <img src={avatarUrl(state)} alt="Geo" className="w-full h-full" />
    </div>
  )
}
```

- [ ] **Step 2: Create step-indicator, multi-chip, geo-commentary**

Create `src/components/onboarding/step-indicator.tsx` — 3 dots showing current step (1/2/3), active dot uses accent color.

Create `src/components/onboarding/multi-chip.tsx` — takes `options: string[]`, `selected: string[]`, `onChange: (val: string[]) => void`. Renders a flex-wrap grid of toggleable chips using the approved chip styling (accent bg when active, surface bg when inactive).

Create `src/components/onboarding/geo-commentary.tsx` — renders GeoAvatar + a speech bubble with a message string. Used in onboarding to have Geo guide the user.

- [ ] **Step 3: Create personal-form**

Create `src/components/onboarding/personal-form.tsx` — `'use client'` form:
- Fields: name (text), dob (date input), sex (3 chips: Male/Female/Other)
- Zod validation
- Calls `submitPersonalOnboarding()`
- On success: `router.push('/onboarding/fitness')`
- GeoCommentary at top: "Let's get to know you! This helps me personalize your plans."

- [ ] **Step 4: Create fitness-form**

Create `src/components/onboarding/fitness-form.tsx` — `'use client'` form:
- Equipment: MultiChip (Dumbbells, Barbell, Resistance bands, Pull-up bar, Kettlebell, Bench, Cable machine, None)
- Injuries: text input to add items + display chips
- Activity level: 4 chips (Sedentary, Lightly Active, Moderately Active, Very Active)
- Workout frequency: number 0-7
- Primary goal: 4 chips (Fat Loss, Muscle Gain, Maintenance, Body Recomposition)
- Calls `submitFitnessOnboarding()`
- On success: `router.push('/onboarding/nutrition')`

- [ ] **Step 5: Create nutrition-form**

Create `src/components/onboarding/nutrition-form.tsx` — `'use client'` form:
- Allergies: MultiChip or text input
- Dietary style: 8 chips (Omnivore through Kosher)
- Disliked foods: text input to add items
- Preferred cuisines: text input to add items
- Meals per day: number 1-6
- Current weight (kg): number input
- Target weight (kg): number input
- Calls `submitNutritionOnboarding()`
- On success: `router.push('/onboarding/generating')`

- [ ] **Step 6: Create onboarding layout and pages**

Create `src/app/onboarding/layout.tsx`:
```typescript
import { PageWrapper } from '@/components/layout/page-wrapper'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PageWrapper>{children}</PageWrapper>
    </div>
  )
}
```

Create `src/app/onboarding/personal/page.tsx`, `fitness/page.tsx`, `nutrition/page.tsx` — each imports and renders the corresponding form component with StepIndicator.

Create `src/app/onboarding/generating/page.tsx` — loading animation screen that navigates to `/dashboard` after a brief delay (or after chat API creates initial plan).

- [ ] **Step 7: Smoke test all 3 steps**

- [ ] **Step 8: Commit**

```bash
git add src/app/onboarding/ src/components/onboarding/ src/components/shared/geo-avatar.tsx && git commit -m "feat: add 3-step onboarding flow with Geo commentary"
```

---

## Chunk 3: Layout & Navigation

### Task 8: Bottom nav, FAB, and quick log sheet

**Files:**
- Create: `src/components/layout/bottom-nav.tsx`
- Create: `src/components/shared/quick-log-sheet.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/loading-skeleton.tsx`
- Create: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create bottom-nav**

Create `src/components/layout/bottom-nav.tsx` — `'use client'` component:
- Uses `usePathname()` to determine active tab
- 4 nav items: Home (`/dashboard`), Chat (`/chat`), Plans (`/plans`), More (`/settings`)
- Centered FAB (gradient background, Plus icon, shadow-accent)
- FAB onClick: `useUIStore.getState().openSheet('quick-log')`
- **Hides when pathname starts with `/chat/` (active chat)** — this is critical
- All icons from Lucide React, never emojis
- Active tab: accent color. Inactive: text-tertiary
- Frosted glass effect: `bg-white/92 backdrop-blur-xl border-t border-border`

- [ ] **Step 2: Create quick-log-sheet**

Create `src/components/shared/quick-log-sheet.tsx` — `'use client'` component:
- Reads `activeSheet` from `useUIStore`
- Framer Motion `AnimatePresence` + `motion.div` for slide-up animation
- Dark overlay backdrop (click to close)
- Sheet with handle bar + "Quick Log" title
- 4x2 grid of 8 log types, each with colored Lucide icon:
  - Food (UtensilsCrossed, accent), Workout (Dumbbell, success), Water (Droplets, info), Weight (Scale, purple)
  - Mood (SmilePlus, warning), Sleep (Moon, #6366F1), Energy (Zap, accent), Scan Menu (Camera, text-secondary)
- Each item: `onClick={() => { closeSheet(); router.push('/logs/new/{type}') }}`

- [ ] **Step 3: Create empty-state and loading-skeleton**

Create `src/components/shared/empty-state.tsx`:
```typescript
import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description, children }: {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-10 h-10 text-text-tertiary mb-3" />
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="text-xs text-text-secondary mt-1 max-w-[240px]">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
```

Create `src/components/shared/loading-skeleton.tsx`:
```typescript
export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-surface-hover rounded mb-3" />
      <div className="h-5 w-48 bg-surface-hover rounded mb-2" />
      <div className="h-3 w-32 bg-surface-hover rounded" />
    </div>
  )
}
```

- [ ] **Step 4: Create app layout**

Create `src/app/(app)/layout.tsx`:
```typescript
'use client'

import { BottomNav } from '@/components/layout/bottom-nav'
import { QuickLogSheet } from '@/components/shared/quick-log-sheet'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
      <QuickLogSheet />
    </div>
  )
}
```

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```
Navigate to `/dashboard` (will be empty but layout should show bottom nav with 4 tabs + FAB). Tap FAB — quick log sheet should slide up.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/components/shared/ src/app/\(app\)/layout.tsx && git commit -m "feat: add bottom nav, FAB, quick log sheet, and app layout"
```

---

## Chunk 4: Dashboard (Home Screen)

### Task 9: Dashboard page with all cards

**Files:**
- Create: `src/components/dashboard/next-up-card.tsx`
- Create: `src/components/dashboard/progress-card.tsx`
- Create: `src/components/dashboard/quick-stats.tsx`
- Create: `src/components/dashboard/workout-card.tsx`
- Create: `src/components/dashboard/suggestion-card.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create next-up-card**

Create `src/components/dashboard/next-up-card.tsx` — displays the next planned meal from active meal plan:
- Props: `mealPlan: MealPlan | undefined`, `workoutPlan: WorkoutPlan | undefined`, `today: string`
- Hero gradient background: `bg-gradient-to-br from-accent-light via-[#FEE8DE] to-accent-light`
- Overline: UtensilsCrossed icon + "Next up · {meal.type}"
- Title: meal name (17px/600)
- Macros line: tabular-nums
- Buttons: "Log it" (accent gradient + Check icon) + "Swap" (outline)
- Empty state: "No active plan yet" + link to chat

- [ ] **Step 2: Create progress-card**

Create `src/components/dashboard/progress-card.tsx`:
- Props: `consumed: number`, `target: number`, `protein: {consumed, target}`, `carbs: {consumed, target}`, `fat: {consumed, target}`, `isEmpty: boolean`
- Header row: "TODAY'S PROGRESS" label (left) + `{consumed} / {target} cal` in accent (right, 20px/600)
- 4 progress bars with gradient fills:
  - Calories: `bg-gradient-to-r from-accent to-[#F0885E]`
  - Protein: `bg-gradient-to-r from-info to-[#60A5FA]`
  - Carbs: `bg-gradient-to-r from-warning to-[#FFB84D]`
  - Fat: `bg-gradient-to-r from-purple to-[#C084FC]`
- Calories shows percentage, others show `g` values

- [ ] **Step 3: Create quick-stats**

Create `src/components/dashboard/quick-stats.tsx`:
- 4 mini stat boxes in a grid
- Each has: Lucide icon (colored per type), value (14px/600), label (9px/uppercase)
- Water (Droplets/info), Mood (Smile/warning), Sleep (Moon/purple), Energy (Zap/accent)
- Props: `water: number`, `mood: number`, `sleep: number`, `energy: number`

- [ ] **Step 4: Create workout-card**

Create `src/components/dashboard/workout-card.tsx`:
- Surface background (no green tint)
- Standard card-label "TODAY'S WORKOUT"
- Workout name as card-title
- Exercise list: CircleCheck (green) for done, Circle (gray) for todo
- Props: `workoutPlan: WorkoutPlan | undefined`, `today: string`

- [ ] **Step 5: Create suggestion-card**

Create `src/components/dashboard/suggestion-card.tsx`:
- GeoAvatar (suggest state) + suggestion text + action buttons
- "Yes, update" (accent btn) calls `takeSuggestionAction(id, { action: 'approve' })`
- "Not now" (ghost btn) calls `takeSuggestionAction(id, { action: 'dismiss' })`
- Props: `suggestion: Suggestion`, `onAction: () => void`

- [ ] **Step 6: Create dashboard page**

Create `src/app/(app)/dashboard/page.tsx` — `'use client'`:
- Fetches in parallel on mount: `getLogsSummary('day')`, `getPlans({ active_only: true })`, `getSuggestions({ status: 'pending' })`
- Greeting row: "Good {greeting}, {firstName}" + date + user avatar initial circle
- Page background: `bg-gradient-to-b from-accent-light to-background` (top 60px only via inline style)
- Components in order: greeting → NextUpCard → ProgressCard → QuickStats → WorkoutCard → SuggestionCard
- Loading state: 3 CardSkeletons

- [ ] **Step 7: Smoke test with real data**

Log in with test account, verify all cards render with live data.

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/ src/app/\(app\)/dashboard/ && git commit -m "feat: add dashboard with all home screen cards"
```

---

## Chunk 5: Chat

### Task 10: Chat session list and active chat

**Files:**
- Create: `src/components/chat/session-list.tsx`
- Create: `src/components/chat/chat-header.tsx`
- Create: `src/components/chat/chat-thread.tsx`
- Create: `src/components/chat/chat-bubble.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Create: `src/components/chat/typing-indicator.tsx`
- Create: `src/app/(app)/chat/page.tsx`
- Create: `src/app/(app)/chat/[sessionId]/page.tsx`

- [ ] **Step 1: Create chat-bubble**

Create `src/components/chat/chat-bubble.tsx`:
- User bubbles: accent gradient bg, white text, `rounded-2xl rounded-br-sm`, right-aligned
- Geo bubbles: surface bg, border, `rounded-2xl rounded-bl-sm`, left-aligned with small GeoAvatar (28px)
- Supports inline action buttons (accent btn-sm) when message contains structured data

- [ ] **Step 2: Create typing-indicator**

Create `src/components/chat/typing-indicator.tsx`:
- 3 animated dots inside a Geo-style bubble
- CSS animation: staggered bounce

- [ ] **Step 3: Create chat-input**

Create `src/components/chat/chat-input.tsx`:
- Pill-shaped input bar: surface bg, border, rounded-full
- Text input + accent gradient send button (ArrowUp icon, 32px circle)
- Props: `onSend: (message: string) => void`, `disabled: boolean`

- [ ] **Step 4: Create chat-header**

Create `src/components/chat/chat-header.tsx`:
- Back arrow (ArrowLeft, onClick navigates to `/chat`)
- GeoAvatar (default, 36px)
- "Geo" name + green "Online" status with dot
- Fixed at top of chat view

- [ ] **Step 5: Create chat-thread**

Create `src/components/chat/chat-thread.tsx`:
- Scrollable message list
- Auto-scrolls to bottom on new messages
- Shows TypingIndicator when `isTyping` is true
- Maps `ChatMessage[]` to `ChatBubble` components

- [ ] **Step 6: Create session-list**

Create `src/components/chat/session-list.tsx`:
- Lists chat sessions from API
- Each row: GeoAvatar (default) + session title + preview text + timestamp
- onClick: `router.push('/chat/{session_id}')`
- Empty state: GeoAvatar + "Start a conversation with Geo"

- [ ] **Step 7: Create chat list page**

Create `src/app/(app)/chat/page.tsx` — `'use client'`:
- Title "Chats" + "New Chat" accent button (top-right)
- "New Chat" onClick: `sendMessage({ message: 'Hi!' })` then navigate to session
- Fetches sessions via `getChatSessions()`
- Renders `<SessionList>`

- [ ] **Step 8: Create active chat page**

Create `src/app/(app)/chat/[sessionId]/page.tsx` — `'use client'`:
- **Bottom nav is already hidden** (bottom-nav checks pathname `/chat/[id]`)
- Loads messages via `getChatSession(sessionId)`
- Renders `<ChatHeader>` + `<ChatThread>` + `<ChatInput>`
- Send message: calls `sendMessage()`, appends user message immediately, shows typing indicator, then appends response
- Full-height layout with flex column

- [ ] **Step 9: Smoke test chat flow**

- [ ] **Step 10: Commit**

```bash
git add src/components/chat/ src/app/\(app\)/chat/ && git commit -m "feat: add chat session list and active chat with Geo"
```

---

## Chunk 6: Logs & Manual Forms

### Task 11: Log forms for all 7 types + activity log

**Files:**
- Create: `src/components/logs/food-log-form.tsx`
- Create: `src/components/logs/workout-log-form.tsx`
- Create: `src/components/logs/water-log-form.tsx`
- Create: `src/components/logs/weight-log-form.tsx`
- Create: `src/components/logs/mood-log-form.tsx`
- Create: `src/components/logs/sleep-log-form.tsx`
- Create: `src/components/logs/energy-log-form.tsx`
- Create: `src/components/logs/log-list.tsx`
- Create: `src/app/(app)/logs/page.tsx`
- Create: `src/app/(app)/logs/new/[type]/page.tsx`

- [ ] **Step 1: Create food-log-form**

Create `src/components/logs/food-log-form.tsx` — `'use client'`:
- Close button (X icon) at top-left, "Log Food" centered title
- Meal type chips: Breakfast, Lunch, Dinner, Snack
- Fields: food_name (text), quantity_g (number), calories (number), protein (number), carbs (number), fat (number) in 2x2 grid
- "Don't know macros? Ask Geo to estimate" link (accent, MessageCircle icon) → navigates to `/chat`
- Save button: full-width accent gradient
- Calls `createLog({ type: 'food', payload: { food_name, quantity_g, est_macros: { calories, protein, carbs, fat } }, source: 'manual' })`
- On success: `toast.success('Food logged')` + `router.back()`

- [ ] **Step 2: Create workout-log-form**

Similar pattern:
- Fields: exercise (text), sets (number), reps (number), weight_kg (number), duration_min (number), difficulty_rating (1-10 slider), notes (text)
- Calls `createLog({ type: 'workout', payload })`

- [ ] **Step 3: Create water-log-form**

- Glasses counter: big number display with - / + buttons
- Or liters input toggle
- Calls `createLog({ type: 'water', payload: { glasses } })`

- [ ] **Step 4: Create weight-log-form**

- Single weight_kg input (large, centered)
- Notes textarea (optional)
- Calls `createLog({ type: 'weight', payload: { weight_kg } })`

- [ ] **Step 5: Create mood-log-form**

- Rating: visual scale 1-10 (row of tappable circles)
- Notes textarea
- Calls `createLog({ type: 'mood', payload: { rating, notes } })`

- [ ] **Step 6: Create sleep-log-form**

- Hours: number input
- Quality rating: 1-10 scale
- Notes textarea
- Calls `createLog({ type: 'sleep', payload: { hours, quality_rating, notes } })`

- [ ] **Step 7: Create energy-log-form**

- Rating: 1-10 scale
- Time of day: chips (Morning, Afternoon, Evening)
- Notes textarea
- Calls `createLog({ type: 'energy', payload: { rating, time_of_day, notes } })`

- [ ] **Step 8: Create dynamic log page**

Create `src/app/(app)/logs/new/[type]/page.tsx` — `'use client'`:
```typescript
'use client'

import { use } from 'react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { FoodLogForm } from '@/components/logs/food-log-form'
import { WorkoutLogForm } from '@/components/logs/workout-log-form'
import { WaterLogForm } from '@/components/logs/water-log-form'
import { WeightLogForm } from '@/components/logs/weight-log-form'
import { MoodLogForm } from '@/components/logs/mood-log-form'
import { SleepLogForm } from '@/components/logs/sleep-log-form'
import { EnergyLogForm } from '@/components/logs/energy-log-form'

const FORMS: Record<string, React.ComponentType> = {
  food: FoodLogForm,
  workout: WorkoutLogForm,
  water: WaterLogForm,
  weight: WeightLogForm,
  mood: MoodLogForm,
  sleep: SleepLogForm,
  energy: EnergyLogForm,
}

export default function NewLogPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  const FormComponent = FORMS[type]

  if (!FormComponent) {
    return <PageWrapper><p className="text-text-secondary">Unknown log type</p></PageWrapper>
  }

  return (
    <PageWrapper>
      <FormComponent />
    </PageWrapper>
  )
}
```

- [ ] **Step 9: Create log-list and activity log page**

Create `src/components/logs/log-list.tsx`:
- Fetches `getLogs({ limit: 50 })` on mount
- Filter bar: chips for All, Food, Workout, Water, Weight, Mood, Sleep, Energy
- Each log entry: colored dot (by type), description (derived from payload), key metric, relative timestamp
- Empty state

Create `src/app/(app)/logs/page.tsx`:
```typescript
'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { LogList } from '@/components/logs/log-list'

export default function LogsPage() {
  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-4">Activity</h1>
      <LogList />
    </PageWrapper>
  )
}
```

- [ ] **Step 10: Smoke test all log forms**

- [ ] **Step 11: Commit**

```bash
git add src/components/logs/ src/app/\(app\)/logs/ && git commit -m "feat: add manual log forms for all 7 types and activity log"
```

---

## Chunk 7: Plans, Settings & Polish

### Task 12: Plans pages

**Files:**
- Create: `src/components/plans/plan-overview-card.tsx`
- Create: `src/components/plans/meal-plan-detail.tsx`
- Create: `src/components/plans/workout-plan-detail.tsx`
- Create: `src/app/(app)/plans/page.tsx`
- Create: `src/app/(app)/plans/[id]/page.tsx`

- [ ] **Step 1: Create plan-overview-card**

Shows plan summary: type icon (UtensilsCrossed or Dumbbell), plan status badge, date range, brief content preview. Clickable → navigates to plan detail.

- [ ] **Step 2: Create meal-plan-detail**

Day-by-day accordion/list view. Each day shows date + meals with name, time, macros. Daily totals row.

- [ ] **Step 3: Create workout-plan-detail**

Day-by-day view. Each day shows workout name, exercises with sets/reps/weight. Rest days shown with Moon icon.

- [ ] **Step 4: Create plans pages**

Create `src/app/(app)/plans/page.tsx` — fetches `getPlans({ active_only: true })`, renders two sections (Meal Plan / Workout Plan) with PlanOverviewCard. Empty state if no plans: "Chat with Geo to create a plan".

Create `src/app/(app)/plans/[id]/page.tsx` — fetches `getPlan(id)`, renders MealPlanDetail or WorkoutPlanDetail based on type.

- [ ] **Step 5: Commit**

```bash
git add src/components/plans/ src/app/\(app\)/plans/ && git commit -m "feat: add plans overview and detail pages"
```

---

### Task 13: Settings and profile pages

**Files:**
- Create: `src/components/settings/settings-section.tsx`
- Create: `src/components/settings/profile-form.tsx`
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/app/(app)/settings/profile/page.tsx`

- [ ] **Step 1: Create settings-section**

Reusable grouped card: label + list of setting rows. Each row: label, current value or toggle, onClick handler.

- [ ] **Step 2: Create settings page**

Create `src/app/(app)/settings/page.tsx` — `'use client'`:
- Fetches `getSettings()` on mount
- Sections:
  - **Account**: Profile link (→ `/settings/profile`), Email display
  - **Notifications**: enabled toggle, time picker, notification types
  - **Geo Personality**: 4-option selector (Nurturing, Drill Sergeant, Balanced, Data-Driven)
  - **Preferences**: Theme, Language
  - **Data**: Share progress toggle, Analytics toggle
  - **Danger**: Logout button (destructive)
- Updates via `updateSettings()`

- [ ] **Step 3: Create profile-form**

Create `src/components/settings/profile-form.tsx` — `'use client'`:
- Fetches `getProfile()` on mount
- Sections matching the design spec: Measurements (weight, target, height), Primary Goal, Activity Level, Dietary Style, Equipment, Injuries
- All using the chip/multi-chip patterns from the design system
- Save via `updateProfile()`
- Back arrow → `/settings`

- [ ] **Step 4: Create profile page**

Create `src/app/(app)/settings/profile/page.tsx`:
```typescript
'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { ProfileForm } from '@/components/settings/profile-form'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  return (
    <PageWrapper>
      <button onClick={() => router.push('/settings')} className="flex items-center gap-1 text-sm text-text-secondary mb-4 hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        More
      </button>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">Profile</h1>
      <ProfileForm />
    </PageWrapper>
  )
}
```

- [ ] **Step 5: Smoke test settings + profile**

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/ src/app/\(app\)/settings/ && git commit -m "feat: add settings hub and profile editor"
```

---

### Task 14: Final type check and polish

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 3: Visual smoke test all routes**

Walk through every route manually:
1. `/login` → login form renders
2. `/signup` → signup form renders
3. Login → redirects to `/dashboard`
4. `/dashboard` → greeting, next up, progress, stats, workout, suggestion
5. `/chat` → session list with "New Chat"
6. Tap session → active chat, bottom nav hidden, back arrow works
7. FAB → quick log sheet slides up, 8 options with icons
8. Tap Food → food log form, save works
9. `/plans` → shows active plans
10. Tap plan → detail view
11. `/logs` → activity feed with filters
12. `/settings` → all settings sections
13. `/settings/profile` → edit profile form

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "fix: resolve type errors and build issues"
```

---

## Summary

| Chunk | Tasks | What it produces |
|-------|-------|-----------------|
| 1: Foundation | 1-5 | Runnable app shell with types, stores, API client, middleware, shadcn/ui |
| 2: Auth & Onboarding | 6-7 | Working login/signup + 3-step onboarding with Geo |
| 3: Layout & Navigation | 8 | Bottom nav + FAB + quick log sheet |
| 4: Dashboard | 9 | Full home screen with 5 cards |
| 5: Chat | 10 | Chat list + active chat with Geo |
| 6: Logs | 11 | All 7 manual log forms + activity log |
| 7: Plans & Settings | 12-14 | Plans views + settings + profile + build verification |

Total: 14 tasks across 7 chunks. Each chunk produces testable, working software.
