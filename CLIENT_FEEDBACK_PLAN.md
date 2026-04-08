# NextMealAI — Client Feedback Implementation Plan

> **Save to workspace:** Copy to `CLIENT_FEEDBACK_PLAN.md` on execution start.

---

## Context

Client tested the MVP and provided 2 rounds of feedback (16 items total, with 10 screenshots). Core issues: food search is US-only and can't find Australian brands, AI logs multiple foods as one combined entry, diary shows duplicates when AI corrects, workout timer is fullscreen overlay, and several UX gaps. This plan addresses all feedback in priority order: bugs first, then food system overhaul, then workout UX.

**Decisions confirmed with Ved:**
- Open Food Facts as primary food DB, USDA as fallback
- Bugs first, manual program builder deferred to v2
- Exercise DB imported to Supabase (~870 exercises)
- Test locally, fix error handling for "trouble processing" errors
- Sticky top-banner rest timer
- Inline P/C/F macros in diary
- Grams + servings toggle for food entry

---

## Scope: 17 changes across 5 phases

### Phase 1: Critical AI/Chat Bug Fixes
> Fix what's broken — restore user trust

**1.1 — Individual food logging (R2-9)** `Backend`
- **File:** `backend/packages/core/src/orchestrator/prompts.ts`
- **Change:** Add explicit rule to system prompt:
  ```
  CRITICAL RULE — INDIVIDUAL FOOD LOGGING:
  When a user mentions multiple food items (e.g., "yogurt 300g and apple 150g"),
  you MUST create a SEPARATE create_log call for EACH food item.
  NEVER combine multiple foods into one log entry.
  Each food = its own create_log call with its own name, quantity, and macros.
  ```
- **Verify:** Send "I had 350g yogurt and 170g apple" → 2 separate diary entries

**1.2 — Fix diary duplicates on correction (R2-10)** `Backend`
- **File:** `backend/packages/core/src/orchestrator/prompts.ts`
- **File:** `backend/packages/core/src/orchestrator/tools.ts` — add `update_log` tool
- **File:** `backend/packages/core/src/orchestrator/tool-executor.ts` — implement `executeUpdateLog()`
- **Change:** Add `update_log` tool that updates an existing log's payload in-place. Update prompt:
  ```
  CORRECTION FLOW:
  When user says macros are wrong or wants to update a food entry:
  1. Call get_recent_logs to find the existing entry
  2. Call update_log with the corrected data (NOT create_log)
  3. Only use delete_log + create_log if the food itself is different
  ```
- **Backend logs table:** Already has `UPDATE` capability (despite the "immutable" note in memory — need to verify)
- **Verify:** Log beef mince → correct macros → diary shows ONE entry with updated values

**1.3 — Fix "trouble processing" errors (R2-3)** `Backend`
- **File:** `backend/packages/core/src/orchestrator/index.ts` — tool execution loop
- **File:** `backend/packages/core/src/orchestrator/tool-executor.ts` — all execute* functions
- **Changes:**
  - Wrap each tool execution in try/catch with retry (1 retry, 3s delay)
  - On final failure, return descriptive error to LLM (not generic message)
  - Add timeout handling for web_search (currently no timeout guard in orchestrator)
  - Log errors with full context for debugging
- **Test locally:** Start backend, send URL to chat, observe error chain
- **Verify:** Send product URL → Geo processes it (or gives specific error, not generic)

**1.4 — Multi-line chat input (R2-8)** `Frontend`
- **File:** `frontend/src/components/chat/chat-input.tsx`
- **Change:** Replace `<input>` with auto-growing `<textarea>`
  - Enter = send message
  - Shift+Enter = new line
  - Auto-resize up to ~4 lines, then scroll
  - Maintain existing image upload button positioning
- **Verify:** Type multi-line message with Shift+Enter → sends with newlines preserved

**1.5 — Geo lists foods before logging (R1-7)** `Backend`
- **File:** `backend/packages/core/src/orchestrator/prompts.ts`
- **Change:** Update food logging flow in prompt:
  ```
  FOOD LOGGING FLOW:
  1. User mentions food → search_foods + web_search to get accurate macros
  2. List each food item with estimated macros in your response
  3. Ask "Should I log these?" or "Sound right?"
  4. On user confirmation → create_log for each item
  Exception: If user explicitly says "log this" or "add to my diary", skip confirmation.
  ```
- **Verify:** "I had yogurt and apple" → Geo lists both with macros → user confirms → logged

---

### Phase 2: Food System Overhaul
> Make food lookup work globally

**2.1 — Open Food Facts API integration (R2-12)** `Backend`
- **New file:** `backend/packages/core/src/services/openfoodfacts.ts`
  ```typescript
  // API: https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1&page_size=10
  // Also: https://world.openfoodfacts.org/api/v2/search?categories_tags={query}&fields=...
  // Extract: product_name, brands, nutriments (energy-kcal_100g, proteins_100g, carbohydrates_100g, fat_100g), serving_size
  // No API key needed, 100 req/min rate limit
  ```
- **File:** `backend/packages/core/src/controllers/foods.controller.ts`
  - Add OFF search in `searchFoods()`: personal → OFF → USDA (fallback)
  - Map OFF response to existing food result format
- **File:** `backend/packages/core/src/orchestrator/tool-executor.ts`
  - Update `executeSearchFoods()` to include OFF results
- **Verify:** Search "Danone YoPro" → returns correct product with Australian macros

**2.2 — Gram input for food entry (R2-6)** `Frontend`
- **File:** `frontend/src/components/diary/food-search-sheet.tsx`
- **Change:** In confirmation view, add toggle between "Servings" and "Grams" mode:
  - Servings mode: existing ±0.25 increment buttons
  - Grams mode: numeric input, auto-calculates macros from `macros_per_serving / serving_size_g * grams`
  - Toggle UI: segmented control `[Servings | Grams]`
  - Both modes show live macro preview (cal, P, C, F)
- **Verify:** Select apple → switch to Grams → enter 192g → macros update → log

**2.3 — Show all macros in diary (R2-11)** `Frontend`
- **File:** `frontend/src/app/(app)/diary/page.tsx` (or diary entry component)
- **Change:** Replace `{grams} · {calories} cal · {protein}g P` with:
  ```
  {grams} · {calories} cal · {protein}P · {carbs}C · {fat}F
  ```
  - Use color coding: P=blue, C=orange, F=purple (matching existing macro bar colors)
- **Verify:** Diary entries show all 3 macros per line item

---

### Phase 3: Workout System Fixes
> Fix workout UX issues

**3.1 — Compact rest timer (R2-1)** `Frontend`
- **File:** `frontend/src/components/workout/rest-timer.tsx`
- **Change:** Replace fullscreen modal with sticky top banner:
  - Fixed position at top of workout page (below header)
  - Shows: timer icon + "Rest" label + countdown (mm:ss) + progress bar + Skip button
  - Progress bar: thin horizontal bar that shrinks over time
  - Vibrate on completion (keep existing)
  - Auto-dismiss when timer reaches 0
  - Brand orange accent color for progress bar
- **Verify:** Complete a set → rest timer appears as top banner → exercises still visible below

**3.2 — Per-exercise rest times (R2-2, R1-8)** `Backend`
- **File:** `backend/packages/core/src/controllers/plan-generation.controller.ts`
- **Change:** Update plan generation prompt to specify per-exercise rest times:
  ```
  Set rest_seconds PER EXERCISE based on:
  - Compound lifts (squat, bench, deadlift): 120-180s
  - Accessory compound (rows, OHP): 90-120s  
  - Isolation (curls, flies, laterals): 60-90s
  - Core/abs: 30-60s
  ```
- **Already in schema:** `SessionExercise.rest_seconds` exists per exercise. Frontend already reads it.
- **File:** `backend/packages/core/src/orchestrator/prompts.ts` — same rule for chat-generated plans
- **Verify:** Generate plan → exercises have varied rest times → timer uses per-exercise value

**3.3 — All exercises expanded (R2-4)** `Frontend`
- **File:** `frontend/src/app/(app)/activity/workout/[sessionId]/page.tsx`
- **Change:** Remove accordion behavior. All exercises rendered expanded by default.
  - Keep collapse/expand as optional (tap header to toggle)
  - Remove auto-collapse-others logic
  - Auto-scroll to current exercise on set completion
- **Verify:** Start workout → all exercises visible, can scroll through entire workout

**3.4 — Fix AI workout plan generation via chat (R2-7)** `Backend`
- **File:** `backend/packages/core/src/orchestrator/tool-executor.ts` — `executeCreatePlan()`, `executeUpdatePlan()`
- **Investigate:** Run locally, ask Geo to create a workout plan via chat, capture the error
- **Likely fix:** The AI is generating plan content that doesn't match the expected schema, or the tool executor has validation issues
- **Also check:** `tools.ts` — does `create_plan` tool schema match what the DB expects?
- **Verify:** Chat with Geo: "Create me a new 4-day workout plan" → plan created and visible in /plans

**3.5 — Workout history shows details on click (R2-16)** `Frontend`
- **File:** `frontend/src/app/(app)/activity/page.tsx`
- **Change:** Make workout history items in the calendar section clickable
  - On click → navigate to `/activity/workout/[sessionId]` (read-only mode for completed sessions)
  - Or: expand inline to show exercises, sets, reps, weight from that session
- **Verify:** Tap a completed workout in history → see exercises/sets/reps/weight

---

### Phase 4: Exercise Database Integration
> Enable exercise lookup for future program builder

**4.1 — Import free-exercise-db to Supabase (R2-13)** `Backend`
- **New migration:** Create `exercises` table:
  ```sql
  CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    aliases TEXT[],
    muscle_group TEXT NOT NULL,
    secondary_muscles TEXT[],
    equipment TEXT[],
    category TEXT, -- compound, isolation, cardio, stretch
    instructions TEXT[],
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_exercises_name ON exercises USING gin(to_tsvector('english', name));
  CREATE INDEX idx_exercises_muscle ON exercises(muscle_group);
  ```
- **Seed script:** Parse `free-exercise-db` JSON → insert into exercises table
- **New endpoint:** `GET /v1/exercises/search?q={query}&muscle_group={group}&equipment={equip}`
- **Verify:** Search "bench press" → returns exercise with muscles, instructions, images

**4.2 — Gallery image upload verification (R1-6)** `Frontend`
- **File:** `frontend/src/components/chat/chat-input.tsx`
- **Check:** Current `<input type="file" accept="image/*">` should allow gallery selection on mobile
- **Fix if needed:** Remove `capture="environment"` attribute (forces camera) → allow gallery
- **Verify:** On mobile, tap camera icon → can choose from photo gallery

---

### Phase 5: Onboarding Enhancement (LOW PRIORITY)

**5.1 — Optional body measurements (R1-3)** `Both`
- **Backend:** Add optional fields to profile: `waist_cm`, `chest_cm`, `hip_cm`, `body_fat_pct`
- **Frontend:** Add optional measurements step or section in onboarding fitness form
- **Plan gen prompt:** Include measurements if available for more accurate TDEE calculation
- **Deferred:** Body image upload (complex, privacy concerns, questionable accuracy)

---

## Deferred to v2
- **R2-14:** Manual workout program builder (large feature — separate sprint)
- **R2-15:** RPE/intensity per exercise (ties into program builder)
- Body image analysis for onboarding

---

## Key Files Summary

### Backend modifications
| File | Phase | Changes |
|------|-------|---------|
| `orchestrator/prompts.ts` | 1,2,3 | Individual logging, confirmation flow, rest times, correction flow |
| `orchestrator/index.ts` | 1 | Error handling + retry in tool loop |
| `orchestrator/tool-executor.ts` | 1,2,3 | Update_log, better errors, fix plan tools, OFF search |
| `orchestrator/tools.ts` | 1 | Add update_log tool definition |
| `controllers/foods.controller.ts` | 2 | OFF as primary, USDA as fallback |
| `services/openfoodfacts.ts` | 2 | NEW — Open Food Facts API client |
| `controllers/plan-generation.controller.ts` | 3 | Per-exercise rest times in prompt |
| `controllers/workout-sessions.controller.ts` | 4 | Exercise DB integration |
| Migration: `exercises` table | 4 | NEW — exercise database |
| Seed: exercise data | 4 | Import free-exercise-db |

### Frontend modifications
| File | Phase | Changes |
|------|-------|---------|
| `components/chat/chat-input.tsx` | 1,4 | Textarea + gallery upload |
| `components/diary/food-search-sheet.tsx` | 2 | Grams/servings toggle |
| `app/(app)/diary/page.tsx` | 2 | Inline P/C/F macros |
| `components/workout/rest-timer.tsx` | 3 | Sticky top banner |
| `app/(app)/activity/workout/[sessionId]/page.tsx` | 3 | All exercises expanded |
| `app/(app)/activity/page.tsx` | 3 | Clickable workout history |

---

## Verification Checklist
- [ ] Search "Danone YoPro" → returns correct product from Open Food Facts
- [ ] "I had 350g yogurt and 170g apple" → 2 separate diary entries (not 1 combined)
- [ ] Correct a food's macros via chat → old entry updated, no duplicate
- [ ] Send product URL to Geo → processes (no "trouble processing" error)
- [ ] Diary entries show: `{g} · {cal} cal · {P}P · {C}C · {F}F`
- [ ] "Add to Lunch" → can toggle to grams, enter 192g, macros auto-calc
- [ ] Multi-line chat (Shift+Enter for newline, Enter to send)
- [ ] Rest timer: sticky top banner, not fullscreen
- [ ] Workout: all exercises expanded by default
- [ ] Rest times vary per exercise (compound > isolation)
- [ ] AI generates workout plan via chat (no errors)
- [ ] Workout history: tap entry → see exercises/sets/reps
- [ ] Exercise search: "bench press" → returns from exercise DB
- [ ] Chat: can upload photo from gallery (not just camera)

## Execution Strategy
- Use subagent-driven development: parallel agents for independent changes
- Backend changes first (Phase 1-2), then frontend in parallel
- Test each change locally before moving to next
- Group commits by phase
