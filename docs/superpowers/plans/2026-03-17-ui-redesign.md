# NextMealAI UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire NextMealAI frontend from a dark navy/orange theme to a warm white/terracotta light-mode app with improved UX hierarchy and mobile-native patterns.

**Architecture:** Retheme globals.css with new warm color tokens, swap Inter for Geist font, redesign every screen component. Keep existing file structure, API layer, stores, and types untouched. All changes are visual/UX — no backend changes.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Framer Motion, shadcn/ui primitives, Inter (Google Fonts), Lucide icons

---

## File Map

### Global Theme (Task 1)
- Modify: `src/app/globals.css` — full color token replacement
- Modify: `src/app/layout.tsx` — swap font to Inter, remove hardcoded dark class

### Shared Components (Task 2)
- Modify: `src/components/shared/geo-avatar.tsx` — new friendly face avatar
- Modify: `src/components/shared/empty-state.tsx` — warm theme
- Modify: `src/components/shared/loading-skeleton.tsx` — warm skeleton colors
- Modify: `src/components/shared/confidence-badge.tsx` — warm colors
- Modify: `src/components/layout/page-wrapper.tsx` — minor spacing tweaks
- Modify: `src/components/layout/bottom-nav.tsx` — 4 items + FAB
- Modify: `src/components/providers.tsx` — remove dark theme forcing

### UI Primitives (Task 3)
- Modify: `src/components/ui/button.tsx` — warm color variants
- Modify: `src/components/ui/input.tsx` — warm borders, focus states
- Modify: `src/components/ui/card.tsx` — cream surface, warm border
- Modify: `src/components/ui/badge.tsx` — warm variants
- Modify: `src/components/ui/skeleton.tsx` — warm pulse color
- Modify: `src/components/ui/sonner.tsx` — light theme toast

### Auth Screens (Task 4)
- Modify: `src/app/(auth)/layout.tsx` — white bg, warm gradient
- Modify: `src/components/auth/login-form.tsx` — full redesign
- Modify: `src/components/auth/signup-form.tsx` — full redesign

### Onboarding Screens (Task 5)
- Modify: `src/app/onboarding/layout.tsx` — white bg
- Modify: `src/components/onboarding/step-indicator.tsx` — replace with progress dots
- Modify: `src/components/onboarding/geo-commentary.tsx` — warm theme
- Modify: `src/components/onboarding/personal-form.tsx` — conversational redesign
- Modify: `src/components/onboarding/fitness-form.tsx` — conversational redesign
- Modify: `src/components/onboarding/nutrition-form.tsx` — conversational redesign
- Modify: `src/app/onboarding/generating/page.tsx` — warm theme

### Dashboard (Task 6)
- Modify: `src/app/(app)/dashboard/page.tsx` — full redesign with next-meal hero
- Modify: `src/components/dashboard/macro-ring.tsx` — replace with horizontal bars
- Modify: `src/components/dashboard/today-plan-card.tsx` — redesign as next-meal hero
- Modify: `src/components/dashboard/suggestion-card.tsx` — inline Geo suggestion

### Chat (Task 7)
- Modify: `src/app/(app)/chat/page.tsx` — warm bubbles, simplified layout
- Modify: `src/components/chat/chat-window.tsx` — warm theme
- Modify: `src/components/chat/chat-message.tsx` — cream/terracotta bubbles
- Modify: `src/components/chat/chat-input.tsx` — warm input styling
- Modify: `src/components/chat/typing-indicator.tsx` — warm dots
- Modify: `src/components/chat/session-list.tsx` — clean list style

### Settings & Profile (Task 8)
- Modify: `src/app/(app)/settings/page.tsx` — redesign as "More" page
- Modify: `src/app/(app)/settings/profile/page.tsx` — warm form styling
- Modify: `src/components/onboarding/multi-chip.tsx` — warm chip styling

### New: Quick-Log Bottom Sheet (Task 9)
- Create: `src/components/shared/quick-log-sheet.tsx` — FAB bottom sheet
- Modify: `src/app/(app)/layout.tsx` — mount quick-log sheet

### Plans & Logs Placeholders (Task 10)
- Modify: `src/app/(app)/plans/page.tsx` — proper plans page layout
- Modify: `src/app/(app)/logs/page.tsx` — proper logs page layout

---

## Design Tokens Reference

```
Background:      #FFFFFF
Surface:         #F9F7F4
Surface Hover:   #F3EFEA
Border:          #E8E4DF
Text Primary:    #1A1A1A
Text Secondary:  #6B6560
Text Tertiary:   #9C9590
Accent:          #E8663C (terracotta)
Accent Hover:    #D45A32
Accent Light:    #FEF3EE
Success:         #3D8B5E
Success Light:   #EEF6F1
Warning:         #D49A4E
Warning Light:   #FDF6EC
```

**Font:** Inter (400, 500, 600) from Google Fonts
**Type Scale:** H1: 28/600, H2: 22/600, H3: 17/500, Body: 15/400, Caption: 13/400, Overline: 12/500 uppercase

---

## Chunk 1: Foundation (Tasks 1-3)

### Task 1: Global Theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace globals.css color tokens**

Replace the entire `@theme inline` block and `@layer base` in `globals.css` with warm light-mode tokens:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-background: #FFFFFF;
  --color-surface: #F9F7F4;
  --color-surface-hover: #F3EFEA;
  --color-border: #E8E4DF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6560;
  --color-text-tertiary: #9C9590;
  --color-accent: #E8663C;
  --color-accent-hover: #D45A32;
  --color-accent-light: #FEF3EE;
  --color-success: #3D8B5E;
  --color-success-light: #EEF6F1;
  --color-warning: #D49A4E;
  --color-warning-light: #FDF6EC;
  --color-destructive: #DC2626;
  --color-destructive-light: #FEF2F2;

  --color-macro-protein: #3D8B5E;
  --color-macro-carbs: #6B8FA3;
  --color-macro-fat: #D49A4E;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
}

@layer base {
  html {
    @apply font-sans text-text-primary bg-background antialiased;
  }

  body {
    @apply min-h-screen;
  }
}
```

- [ ] **Step 2: Swap font to Inter in layout.tsx**

Replace Geist font imports with Inter. Remove hardcoded `dark` class from `<html>`:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

Update the `<html>` tag:
```tsx
<html lang="en" className={inter.variable}>
```

Remove `className="dark"` from `<html>`.

- [ ] **Step 3: Verify the app loads with white background**

Run: `pnpm dev`, open http://localhost:3000
Expected: white background, no dark theme, text should be readable

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: replace dark navy theme with warm white/terracotta design tokens"
```

---

### Task 2: Shared Components

**Files:**
- Modify: `src/components/shared/geo-avatar.tsx`
- Modify: `src/components/shared/empty-state.tsx`
- Modify: `src/components/shared/loading-skeleton.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`
- Modify: `src/components/layout/page-wrapper.tsx`

- [ ] **Step 1: Redesign GeoAvatar with friendly face**

Replace the current "G" letter avatar with a CSS face (two dot eyes + smile):

```tsx
interface GeoAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { container: "w-8 h-8", eye: "w-1 h-1", eyeGap: "gap-1.5", smile: "w-2.5 h-1.5" },
  md: { container: "w-10 h-10", eye: "w-1.5 h-1.5", eyeGap: "gap-2", smile: "w-3 h-2" },
  lg: { container: "w-14 h-14", eye: "w-2 h-2", eyeGap: "gap-3", smile: "w-4 h-2.5" },
};

export function GeoAvatar({ size = "md", className }: GeoAvatarProps) {
  const s = sizes[size];
  return (
    <div className={`${s.container} rounded-full bg-accent flex flex-col items-center justify-center shrink-0 ${className || ""}`}>
      <div className={`flex ${s.eyeGap} mb-0.5`}>
        <div className={`${s.eye} rounded-full bg-white`} />
        <div className={`${s.eye} rounded-full bg-white`} />
      </div>
      <div className={`${s.smile} border-b-2 border-white rounded-b-full`} />
    </div>
  );
}
```

- [ ] **Step 2: Update EmptyState for warm theme**

Replace dark bg classes with warm classes:
- Background: remove any `bg-bg-deep` or `bg-bg-secondary`
- Text: use `text-text-secondary` and `text-text-tertiary`
- Keep the layout structure the same

- [ ] **Step 3: Update LoadingSkeleton colors**

Change skeleton pulse color from dark grey to warm:
- Replace `bg-bg-secondary` with `bg-surface`
- Replace `bg-bg-primary` with `bg-surface-hover`

- [ ] **Step 4: Redesign BottomNav — 4 items + FAB**

Complete rewrite of bottom-nav.tsx:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, MessageCircle, CalendarDays, MoreHorizontal, Plus } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/plans", icon: CalendarDays, label: "Plans" },
  { href: "/settings", icon: MoreHorizontal, label: "More" },
];

interface BottomNavProps {
  onFabPress: () => void;
}

export function BottomNav({ onFabPress }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      {/* FAB */}
      <button
        onClick={onFabPress}
        className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
                isActive ? "text-accent" : "text-text-tertiary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

Note: `pb-safe` handles iOS safe area. The FAB sits between Chat and Plans in the visual layout.

- [ ] **Step 5: Verify nav renders with 4 items + floating plus**

Run the app and check the bottom nav renders correctly on mobile viewport.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/ src/components/layout/
git commit -m "feat: redesign shared components with warm theme and new nav"
```

---

### Task 3: UI Primitives

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/sonner.tsx`

- [ ] **Step 1: Update Button variants**

Update the CVA variants to use warm colors:
- `default`: `bg-accent text-white hover:bg-accent-hover` (terracotta)
- `destructive`: `bg-destructive text-white hover:bg-red-700`
- `outline`: `border border-border bg-background hover:bg-surface text-text-primary`
- `secondary`: `bg-surface text-text-primary hover:bg-surface-hover`
- `ghost`: `hover:bg-surface text-text-primary`
- `link`: `text-accent underline-offset-4 hover:underline`

- [ ] **Step 2: Update Input styling**

Replace dark input styles with warm:
- Border: `border-border`
- Background: `bg-background`
- Focus: `focus:border-accent focus:ring-1 focus:ring-accent/20`
- Placeholder: `placeholder:text-text-tertiary`
- Border radius: `rounded-xl`

- [ ] **Step 3: Update Card styling**

- Background: `bg-surface`
- Border: `border border-border`
- Border radius: `rounded-2xl`

- [ ] **Step 4: Update Badge, Skeleton, Sonner**

Badge: warm color variants matching the palette.
Skeleton: pulse color should be `bg-surface-hover` animating to `bg-surface`.
Sonner: set theme to "light", update toast colors to match warm palette.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: update UI primitives to warm terracotta theme"
```

---

## Chunk 2: Auth & Onboarding (Tasks 4-5)

### Task 4: Auth Screens

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/components/auth/signup-form.tsx`
- Modify: `src/components/auth/login-form.tsx`

- [ ] **Step 1: Update auth layout**

Replace dark bg with white + subtle warm gradient at top:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Redesign signup-form.tsx**

New layout:
1. Top: Subtle gradient area (`bg-gradient-to-b from-accent-light to-background`) with GeoAvatar (lg) centered + "NextMealAI" text below
2. Headline: "Your AI nutrition coach" (H1, text-text-primary)
3. Subtitle: "Personalized meals, workouts, and guidance — all through one conversation." (body, text-text-secondary)
4. Form fields: Email + Password with warm Input styling, labels in text-text-secondary
5. CTA: "Create account" full-width Button (default/accent variant)
6. Footer: "Already have an account? Sign in" with terracotta link

Remove the "Meet Geo" heading and the old dark card styling. Remove any `bg-bg-deep`, `bg-bg-secondary` classes.

- [ ] **Step 3: Redesign login-form.tsx**

Same structure as signup but:
1. Headline: "Welcome back"
2. CTA: "Sign in"
3. Footer: "Don't have an account? Create one"

- [ ] **Step 4: Test auth flows visually**

Open /signup and /login. Verify:
- White background with warm gradient at top
- Geo avatar with face (not letter)
- Terracotta button
- Warm input focus states
- Links work between login/signup

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/
git commit -m "feat: redesign auth screens with warm white theme"
```

---

### Task 5: Onboarding Screens

**Files:**
- Modify: `src/app/onboarding/layout.tsx`
- Modify: `src/components/onboarding/step-indicator.tsx`
- Modify: `src/components/onboarding/geo-commentary.tsx`
- Modify: `src/components/onboarding/personal-form.tsx`
- Modify: `src/components/onboarding/fitness-form.tsx`
- Modify: `src/components/onboarding/nutrition-form.tsx`
- Modify: `src/components/onboarding/multi-chip.tsx`
- Modify: `src/app/onboarding/generating/page.tsx`

- [ ] **Step 1: Update onboarding layout to white bg**

```tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace StepIndicator with progress dots**

Replace the numbered 3-step indicator with subtle progress dots:

```tsx
interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current
              ? "w-6 bg-accent"
              : i === current
              ? "w-6 bg-accent"
              : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}
```

Note: Export as `ProgressDots` but keep the file name as `step-indicator.tsx` to avoid import changes, or update imports if renamed.

- [ ] **Step 3: Update GeoCommentary for warm theme**

Replace dark styling with warm:
- Remove `bg-bg-secondary` → no background (or very subtle `bg-accent-light` pill)
- Text: `text-text-secondary`
- Avatar: small GeoAvatar with new face

- [ ] **Step 4: Update MultiChip for warm theme**

Selected state: `bg-accent text-white` instead of old orange on dark
Unselected state: `bg-surface border border-border text-text-primary hover:bg-surface-hover`
Border radius: `rounded-full`

- [ ] **Step 5: Redesign personal-form.tsx**

Make it conversational:
- GeoCommentary at top: "Hey! Let me get to know you a bit."
- Clean white form with warm inputs
- Sex selector: 3 rounded buttons, selected = `bg-accent text-white`, unselected = `bg-surface border border-border`
- "Continue" button: full-width accent
- ProgressDots at bottom (current=0, total=8 approximately)

Replace all dark color classes (`bg-bg-deep`, `bg-bg-secondary`, `text-white`, etc.) with warm equivalents.

- [ ] **Step 6: Redesign fitness-form.tsx**

Same conversational approach:
- GeoCommentary: "Now let's talk about your fitness."
- Equipment and Injuries: MultiChip with warm styling
- Activity level: large tappable cards on `bg-surface` with `border-accent` when selected
- Primary goal: same card pattern
- All warm colors

- [ ] **Step 7: Redesign nutrition-form.tsx**

Same pattern:
- GeoCommentary: "Last step — let's talk food."
- Allergies, cuisines: warm MultiChip
- Dietary style: card selection
- Dislikes: warm tag input
- Weight inputs: warm Input components

- [ ] **Step 8: Update generating page**

Replace dark bg with white. Keep the pulsing animation but use accent color:
- Background: `bg-background`
- Pulsing rings: `bg-accent/10`, `bg-accent/5`
- Status text: `text-text-secondary`
- GeoAvatar: large with face

- [ ] **Step 9: Test full onboarding flow**

Navigate /onboarding/personal → fitness → nutrition → generating.
Verify warm theme, progress dots, conversational feel.

- [ ] **Step 10: Commit**

```bash
git add src/app/onboarding/ src/components/onboarding/
git commit -m "feat: redesign onboarding with conversational warm theme"
```

---

## Chunk 3: Core App Screens (Tasks 6-8)

### Task 6: Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/components/dashboard/today-plan-card.tsx` → rename to `next-meal-card.tsx`
- Modify: `src/components/dashboard/macro-ring.tsx` → refactor to `progress-bars.tsx`
- Modify: `src/components/dashboard/suggestion-card.tsx`

- [ ] **Step 1: Update app layout**

Replace dark bg, update for warm theme:
- Background: `bg-background`
- Remove `bg-bg-primary` class
- Add padding bottom for FAB clearance: `pb-24`
- Mount `BottomNav` with `onFabPress` that opens QuickLogSheet (wired in Task 9)

- [ ] **Step 2: Create next-meal-card.tsx (rename today-plan-card)**

The hero card showing the user's next meal:

Structure:
```
┌────────────────────────────┐
│  NEXT UP · LUNCH           │  ← overline
│                            │
│  Grilled chicken bowl      │  ← H3
│  with quinoa and veggies   │  ← body, text-secondary
│                            │
│  520 cal · 42g P · 58g C   │  ← caption, text-tertiary
│                            │
│  [  Log it ✓  ] [ Swap ]   │  ← accent btn + outline btn
└────────────────────────────┘
```

- Card: `bg-surface border border-border rounded-2xl p-5`
- Overline: `text-xs font-medium uppercase tracking-wider text-text-tertiary`
- Meal name: `text-lg font-medium text-text-primary`
- Macros: `text-sm text-text-tertiary`
- Buttons row: `flex gap-3 mt-4`

Falls back to empty state with CTA "Chat with Geo to create your plan" when no plan exists.

- [ ] **Step 3: Create progress-bars.tsx (replace macro-ring)**

Replace the SVG ring with horizontal bars:

```
Calories                    1,240 / 2,100
████████████░░░░░░░░░░░░░░░░░░░░░

Protein        Carbs          Fat
██████░░░░     ████████░░     ████░░░░
78 / 145g      155 / 250g     35 / 70g
```

- Overall calories: full-width bar, `bg-accent` fill on `bg-surface` track
- Macro bars: 3 equal columns
  - Protein: `bg-macro-protein` (sage green)
  - Carbs: `bg-macro-carbs` (blue-grey)
  - Fat: `bg-macro-fat` (warm amber)
- All bars: `h-2 rounded-full`
- Labels: `text-xs text-text-tertiary`
- Values: `text-sm font-medium text-text-primary`

Falls back to empty state when no food logged.

- [ ] **Step 4: Update suggestion-card.tsx**

Inline Geo suggestion — less card-like, more conversational:

```
┌────────────────────────────┐
│  ○ Geo                     │
│  "You've been low on       │
│   protein the last 3 days."│
│                            │
│  [ Yes, adjust ]  Dismiss  │
└────────────────────────────┘
```

- Container: `bg-accent-light border border-accent/10 rounded-2xl p-4`
- GeoAvatar: small
- Message: `text-sm text-text-primary`
- Primary action: `text-accent font-medium`
- Dismiss: `text-text-tertiary`

- [ ] **Step 5: Redesign dashboard page**

New layout (top to bottom):
1. **Header**: "Good morning, Harsh" (H2) + date caption + user initial circle (top right)
2. **Next Meal Card** (hero)
3. **Today's Progress** section label (overline) + ProgressBars
4. **Geo Suggestion** (if any pending)
5. **Upcoming** section label (overline) + timeline list of remaining meals/workout

Replace all dark color classes. Use `PageWrapper` for consistent padding.

- [ ] **Step 6: Test dashboard**

Open /dashboard. Verify:
- Warm white bg, cream cards
- Next meal card prominent at top
- Progress bars readable
- Suggestion card with Geo face
- Timeline at bottom

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/dashboard/ src/app/\(app\)/layout.tsx src/components/dashboard/
git commit -m "feat: redesign dashboard with next-meal hero and warm theme"
```

---

### Task 7: Chat

**Files:**
- Modify: `src/app/(app)/chat/page.tsx`
- Modify: `src/components/chat/chat-message.tsx`
- Modify: `src/components/chat/chat-window.tsx`
- Modify: `src/components/chat/chat-input.tsx`
- Modify: `src/components/chat/typing-indicator.tsx`
- Modify: `src/components/chat/session-list.tsx`

- [ ] **Step 1: Update chat-message.tsx bubble styles**

Geo messages (left):
- `bg-surface rounded-2xl rounded-bl-sm p-3`
- Small GeoAvatar with face to the left
- Text: `text-text-primary text-sm`

User messages (right):
- `bg-accent text-white rounded-2xl rounded-br-sm p-3`
- No avatar

Action cards (plan updated, etc.):
- `bg-success-light border border-success/20 rounded-xl p-3 mt-2`
- Check icon in `text-success`
- Text: `text-success text-sm font-medium`

Timestamps: `text-[11px] text-text-tertiary mt-1`

- [ ] **Step 2: Update chat-window.tsx**

- Background: `bg-background`
- Remove any dark bg classes
- Keep auto-scroll behavior
- Update EmptyState to use warm theme

- [ ] **Step 3: Update chat-input.tsx**

- Container: `bg-background border-t border-border px-4 py-3`
- Input: `bg-surface rounded-xl border-none px-4 py-3 text-sm`
- Send button: `w-9 h-9 rounded-full bg-accent flex items-center justify-center`
- Send icon: `text-white w-4 h-4`
- Disabled state: `bg-surface-hover` (greyed out)

- [ ] **Step 4: Update typing-indicator.tsx**

- Use `bg-surface` bubble (same as Geo message)
- Dots: `bg-text-tertiary` with warm pulse

- [ ] **Step 5: Update session-list.tsx**

- Background: `bg-background`
- "New chat" button: `bg-accent text-white rounded-xl`
- Session items: `hover:bg-surface rounded-xl px-3 py-2`
- Active session: `bg-surface`
- Title: `text-text-primary text-sm`
- Date: `text-text-tertiary text-xs`
- Delete button: `text-text-tertiary hover:text-destructive`

- [ ] **Step 6: Update chat page layout**

Top bar:
- Left: "← Sessions" button (text-text-secondary, navigates to session list view)
- Center: "Geo" with tiny GeoAvatar
- Right: "⋮" menu icon
- Bar: `bg-background border-b border-border`

Mobile: sessions as a separate full-screen view (slide from left), not a sidebar.
Desktop: keep side-by-side if desired, but mobile is priority.

- [ ] **Step 7: Test chat**

Open /chat. Verify:
- Warm white bg
- Cream Geo bubbles, terracotta user bubbles
- Input area clean with warm styling
- Session list accessible and clean

- [ ] **Step 8: Commit**

```bash
git add src/app/\(app\)/chat/ src/components/chat/
git commit -m "feat: redesign chat with warm cream/terracotta bubbles"
```

---

### Task 8: Settings & Profile

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/app/(app)/settings/profile/page.tsx`

- [ ] **Step 1: Redesign settings as "More" page**

Clean, grouped list layout:

```
More

┌─ Account ─────────────────┐
│  👤 Profile            →  │
│  ⚙️ Preferences        →  │
└───────────────────────────┘

┌─ Geo ─────────────────────┐
│  Personality    [Friendly] │  ← selector
│  Auto-apply        [  ●]  │  ← toggle
└───────────────────────────┘

┌─ App ─────────────────────┐
│  Notifications     [  ●]  │
│  About                 →  │
│  Sign out                 │
└───────────────────────────┘
```

- Section labels: overline style (`text-xs font-medium uppercase tracking-wider text-text-tertiary`)
- Groups: `bg-surface rounded-2xl border border-border divide-y divide-border`
- Rows: `px-4 py-3.5 flex items-center justify-between`
- Toggle: custom warm toggle (`bg-accent` when on, `bg-border` when off)

- [ ] **Step 2: Redesign profile edit page**

- Header: "← More" back button + "Profile" title
- Form sections grouped in cream cards
- MultiChip: warm styling (already updated in Task 5)
- Goal/activity/diet selectors: card grid with `border-accent` selected state
- Save button: full-width accent at bottom

Replace all dark classes with warm equivalents.

- [ ] **Step 3: Test settings flow**

Navigate /settings and /settings/profile. Verify warm theme, grouped layout, toggle states.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/settings/
git commit -m "feat: redesign settings as 'More' page with warm grouped layout"
```

---

## Chunk 4: New Features & Cleanup (Tasks 9-10)

### Task 9: Quick-Log Bottom Sheet

**Files:**
- Create: `src/components/shared/quick-log-sheet.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create QuickLogSheet component**

A bottom sheet that slides up when the FAB "+" is pressed:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Apple, Dumbbell, Droplets, Scale, Smile, Moon } from "lucide-react";

interface QuickLogSheetProps {
  open: boolean;
  onClose: () => void;
}

const logTypes = [
  { icon: Apple, label: "Food", color: "text-accent", href: "/logs?type=food" },
  { icon: Dumbbell, label: "Workout", color: "text-macro-protein", href: "/logs?type=workout" },
  { icon: Droplets, label: "Water", color: "text-macro-carbs", href: "/logs?type=water" },
  { icon: Scale, label: "Weight", color: "text-text-secondary", href: "/logs?type=weight" },
  { icon: Smile, label: "Mood", color: "text-warning", href: "/logs?type=mood" },
  { icon: Moon, label: "Sleep", color: "text-macro-carbs", href: "/logs?type=sleep" },
];
```

Layout:
- Backdrop: `bg-black/30` with fade
- Sheet: `bg-background rounded-t-3xl p-6` slides up from bottom
- Title: "Quick Log" in H3
- 3x2 grid of icon buttons, each with icon + label
- Close X in top right

Each button navigates to the appropriate log page or opens inline form (for now, just show the grid and use `toast("Coming soon")` for items that don't have pages yet, or navigate to chat with a pre-filled message like "Log food").

- [ ] **Step 2: Wire QuickLogSheet into app layout**

In `src/app/(app)/layout.tsx`:
- Add `useState` for sheet open state
- Pass `onFabPress` to BottomNav that sets open to true
- Render `<QuickLogSheet open={open} onClose={() => setOpen(false)} />`

- [ ] **Step 3: Test FAB + bottom sheet**

Click the + FAB. Verify:
- Sheet slides up smoothly
- 6 log type options visible
- Tapping backdrop or X closes it
- Warm styling throughout

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/quick-log-sheet.tsx src/app/\(app\)/layout.tsx
git commit -m "feat: add quick-log bottom sheet with FAB trigger"
```

---

### Task 10: Plans & Logs Placeholders

**Files:**
- Modify: `src/app/(app)/plans/page.tsx`
- Modify: `src/app/(app)/logs/page.tsx`

- [ ] **Step 1: Create proper Plans placeholder page**

```tsx
import { PageWrapper } from "@/components/layout/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PlansPage() {
  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">
        Plans
      </h1>
      <EmptyState
        title="Your plans will show here"
        description="Chat with Geo to create your personalized meal and workout plans."
      >
        <Link href="/chat">
          <Button>Chat with Geo</Button>
        </Link>
      </EmptyState>
    </PageWrapper>
  );
}
```

- [ ] **Step 2: Create proper Logs placeholder page**

Same pattern but for logs:
- Title: "Activity Log"
- Empty state: "Your logged meals, workouts, and more will appear here."
- CTA: "Log something" button that opens the quick-log sheet (or links to chat)

- [ ] **Step 3: Verify placeholder pages**

Navigate to /plans and /logs. Verify warm theme, proper empty states.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/plans/ src/app/\(app\)/logs/
git commit -m "feat: add proper placeholder pages for plans and logs"
```

---

## Final Cleanup

- [ ] **Delete design-prototype.html** (it was for exploration only)
- [ ] **Remove unused CSS variables** from globals.css (any leftover dark-mode oklch tokens)
- [ ] **Verify full flow**: signup → onboarding (3 steps) → generating → dashboard → chat → settings → profile
- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused design artifacts and stale CSS tokens"
```
