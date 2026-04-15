# FB-05 Rest Timer Bugfixes — Implementation Plan

> Single session, me-review. SMALL tier. Frontend-only.

**Goal:** Fix three live-UAT bugs in the workout session page: runaway elapsed counter, tick-ahead rest-timer loophole, and last-set-of-exercise skipping the rest timer.

**Branch:** `fix/fb-05-rest-timer-bugs` (off `main`)

**PRD:** `docs/plans/FB-05-rest-timer-bugs-prd.md` (AC01.1–AC01.17)

---

## File Structure

- **Modify:** `src/app/(app)/activity/workout/[sessionId]/page.tsx`
  - Add `restKey` state counter
  - Stale-session guard in the `started_at` effect (cap at 6h, PATCH reset, local reset)
  - `completeSet` bumps `restKey` on every completion
  - `completeSet` fires rest timer on last-set-of-non-final-exercise
  - `completeSet` skips rest timer when `rest_seconds === 0`
  - Pass `resetToken={restKey}` into `<RestTimer />`
- **Modify:** `src/components/workout/rest-timer.tsx`
  - Add optional `resetToken?: number` prop
  - Include it in the effect dependency array so the countdown resets when the parent bumps it
- **Create:** `src/components/workout/__tests__/rest-timer.test.tsx` — RTL + fake timers
- **Create:** `src/components/workout/__tests__/workout-session-page.test.tsx` — RTL for completeSet + stale-session logic (mock API, mock router)

---

## Task 1: Failing tests — rest-timer.test.tsx

- [ ] `vi.useFakeTimers()` + render `<RestTimer isActive={true} duration={90} resetToken={1} ... />`
- [ ] Advance 30s → `remaining === 60`
- [ ] Rerender with `resetToken={2}` (same duration) → `remaining === 90` (reset)
- [ ] Rerender with `duration={60}` (different duration, same token) → `remaining === 60` (existing behavior still works)
- [ ] `isActive=false` → component returns null
- [ ] onComplete fires when countdown hits 0

## Task 2: Failing tests — workout-session-page.test.tsx

- [ ] Mock `@/lib/api/workout-sessions.api` so `getWorkoutSession` returns a canned session and `updateWorkoutSession` resolves.
- [ ] Session with `started_at = 7 hours ago` → elapsed display starts at "0:00" and `updateWorkoutSession` was called with `{ started_at: <iso near now> }`.
- [ ] Session with `started_at = 2 minutes ago` → elapsed display shows around "2:00" and `updateWorkoutSession` NOT called with `started_at`.
- [ ] PATCH rejection on stale reset does not crash the page (wrap in try/catch).
- [ ] `completeSet` on set 3 of 3 for Exercise A (when there are 2 exercises total) → `showRestTimer === true`, exercise status becomes `'completed'`.
- [ ] `completeSet` on set 3 of 3 for the LAST exercise → `showRestTimer === false`, status becomes `'completed'`.
- [ ] Single-set exercise: completing it fires rest timer (non-final exercise).
- [ ] `rest_seconds === 0` → no rest timer shown.
- [ ] Uncheck a completed set → rest timer state unchanged.
- [ ] Tick set 1, then tick set 2 of same exercise (same rest_seconds) → `restKey` bumps twice and the RestTimer receives a different resetToken on each.

## Task 3: Implement `rest-timer.tsx`

Add `resetToken?: number` to `RestTimerProps`. Include it in the `useEffect` deps so the effect reinitializes when the parent changes it even if `duration` is the same.

```tsx
interface RestTimerProps {
  isActive: boolean
  duration: number
  onSkip: () => void
  onComplete: () => void
  resetToken?: number
}
```

The effect body stays identical — only the deps array changes from `[isActive, duration]` to `[isActive, duration, resetToken]`.

## Task 4: Implement `workout-session-page.tsx`

### 4a. Add `restKey` state
```tsx
const [restKey, setRestKey] = useState(0)
```

### 4b. Stale-session guard in the started_at effect
Replace the existing effect:
```tsx
useEffect(() => {
  if (!session?.started_at) return
  const startedAt = new Date(session.started_at).getTime()
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  const SIX_HOURS = 6 * 3600

  if (elapsed > SIX_HOURS) {
    // Stale resumed session — bump started_at server-side and zero out locally
    setElapsedSeconds(0)
    const nowIso = new Date().toISOString()
    updateWorkoutSession(sessionId, { started_at: nowIso }).catch(() => {})
    // Optimistically reflect the new started_at on local session so subsequent
    // ticks compute from the right base.
    setSession((prev) => prev ? { ...prev, started_at: nowIso } : prev)
    return
  }

  setElapsedSeconds(Math.max(0, elapsed))
}, [session?.started_at, sessionId])
```

Note: `updateWorkoutSession` may not currently accept `started_at` in its schema. Check the type and the backend validator — if not allowed, add it narrowly (see Task 4d) or use a dedicated reset helper. If the backend rejects the field, the `.catch(() => {})` still tolerates it and the local display is still reset, which is the user-visible fix.

### 4c. `completeSet` rewrite
Fire rest timer on every completion, bump restKey, handle last-set-of-non-final-exercise, handle rest_seconds=0:

```tsx
const completeSet = (exIndex: number, setIndex: number) => {
  if (!session) return
  const updated = [...session.exercises]
  const sets = [...updated[exIndex].sets]
  const set = sets[setIndex]

  if (set.completed) {
    // Uncheck — leave rest timer alone (AC01.6)
    sets[setIndex] = { ...set, completed: false, completed_at: null }
    updated[exIndex] = { ...updated[exIndex], sets }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
    return
  }

  // Mark complete
  sets[setIndex] = { ...set, completed: true, completed_at: new Date().toISOString() }
  if (updated[exIndex].status === 'pending') {
    updated[exIndex] = { ...updated[exIndex], status: 'in_progress' }
  }

  const allDone = sets.every((s) => s.completed)
  if (allDone) {
    updated[exIndex] = { ...updated[exIndex], status: 'completed', sets }
  } else {
    updated[exIndex] = { ...updated[exIndex], sets }
  }

  setSession({ ...session, exercises: updated })
  saveExercises(updated)

  // Rest timer logic — fire unless this is the last set of the LAST exercise,
  // or rest_seconds is explicitly zero.
  const isLastExerciseComplete = allDone && exIndex === updated.length - 1
  const restSecondsForExercise = updated[exIndex].rest_seconds || 0
  if (!isLastExerciseComplete && restSecondsForExercise > 0) {
    setRestSeconds(restSecondsForExercise)
    setShowRestTimer(true)
    setRestKey((k) => k + 1) // Force RestTimer to reset even if duration is unchanged
  }
}
```

### 4d. Pass `resetToken` to RestTimer
```tsx
<RestTimer
  isActive={showRestTimer}
  duration={restSeconds}
  resetToken={restKey}
  onSkip={() => setShowRestTimer(false)}
  onComplete={() => setShowRestTimer(false)}
/>
```

### 4e. `updateWorkoutSession` type
Check `src/lib/api/workout-sessions.api.ts` — if its body type doesn't include `started_at`, widen it narrowly (add `started_at?: string`). Backend already accepts it (the controller spreads `req.body` into the update).

## Task 5: Run tests + type-check

- [ ] `pnpm exec vitest run src/components/workout/__tests__`
- [ ] Full `pnpm exec vitest run`
- [ ] `pnpm type-check`

## Task 6: Commit, push, PR, tracker update

- [ ] `fix(FB-05): rest timer runaway, tick-ahead, last-set bugs`
- [ ] `gh pr create` against main (frontend repo)
- [ ] Update backend tracker + Obsidian mirror noting the three bugs and the fix
- [ ] Manual re-UAT against local dev to verify all three behaviors
