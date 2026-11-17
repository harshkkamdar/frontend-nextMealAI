'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { abandonWorkoutSession, getInProgressSession, startWorkoutSessionWithStatus } from '@/lib/api/workout-sessions.api'
import type { WorkoutPlan } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'
import { OFFLINE_START } from './train-data'
import { UnfinishedWorkoutSheet } from './unfinished-workout-sheet'

/**
 * Start a plan day from a screen that doesn't hold the open workout (Home, the plan page). Asks first when another
 * workout is still open; a start queued offline stays on the screen with the offline toast. Render `sheet`.
 */
export function useStartWorkout() {
  const router = useRouter()
  const [startingIdx, setStartingIdx] = useState<number | null>(null)
  // The open workout and the day asked for, kept while the sheet closes.
  const [ask, setAsk] = useState<{ session: WorkoutSession; plan: WorkoutPlan; dayIdx: number } | null>(null)
  const [askOpen, setAskOpen] = useState(false)

  async function start(plan: WorkoutPlan, dayIdx: number, discard?: WorkoutSession) {
    if (startingIdx !== null) return
    setStartingIdx(dayIdx)
    setAskOpen(false)
    let leaving = false
    try {
      if (discard) await abandonWorkoutSession(discard.id)
      else {
        // Not knowing (offline) starts anyway. The same plan day already open needs no question: startSession returns it.
        const open = await getInProgressSession().catch(() => null)
        if (open && !(open.plan_id === plan.id && open.plan_day_index === dayIdx)) { setAsk({ session: open, plan, dayIdx }); setAskOpen(true); return }
      }
      const result = await startWorkoutSessionWithStatus({ plan_id: plan.id, plan_day_index: dayIdx })
      // A start queued offline has no session to open yet (its pending id never loads).
      if (result.queued) { toast.success(OFFLINE_START); return }
      leaving = true
      router.push(`/train/session?id=${result.data.id}`)
    } catch {
      toast.error("Couldn't start the workout. Try again.")
    } finally {
      // Stays busy while the session opens.
      if (!leaving) setStartingIdx(null)
    }
  }

  const sheet = (
    <UnfinishedWorkoutSheet
      open={askOpen}
      session={ask?.session ?? null}
      nextName={ask ? ask.plan.content.days?.[ask.dayIdx]?.name || `Day ${ask.dayIdx + 1}` : ''}
      onClose={() => setAskOpen(false)}
      onResume={() => { if (ask) router.push(`/train/session?id=${ask.session.id}`) }}
      onDiscard={() => { if (ask) void start(ask.plan, ask.dayIdx, ask.session) }}
    />
  )

  return { start, startingIdx, sheet }
}
