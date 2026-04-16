'use client'

/**
 * FB-15: Preview card rendered above a chat bubble when Geo extracts a
 * workout program from a user-uploaded image. Lets the user Accept
 * (create + activate plan), Edit (open the FB-08 manual builder with
 * the program pre-filled), or Discard (local dismiss).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createPlan, activatePlan } from '@/lib/api/plans.api'
import type { WorkoutProgramContent } from '@/types/plans.types'

export interface WorkoutProgramPreviewCardProps {
  program: WorkoutProgramContent
  confidence: number
  onAccept?: (planId: string) => void
  onEdit?: () => void
  onDiscard?: () => void
}

function confidenceLabel(c: number): { label: string; tone: string } {
  if (c >= 0.85) return { label: 'High confidence', tone: 'text-green-600' }
  if (c >= 0.6) return { label: 'Medium confidence', tone: 'text-yellow-600' }
  return { label: 'Low confidence', tone: 'text-orange-600' }
}

export function WorkoutProgramPreviewCard({
  program,
  confidence,
  onAccept,
  onEdit,
  onDiscard,
}: WorkoutProgramPreviewCardProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const days = Array.isArray(program.days) ? program.days : []
  const totalExercises = days.reduce(
    (sum, d) => sum + (Array.isArray(d.exercises) ? d.exercises.length : 0),
    0
  )
  const conf = confidenceLabel(confidence)

  const handleAccept = async () => {
    setBusy(true)
    try {
      const plan = await createPlan({ type: 'workout', content: program, generated_by: 'ai' })
      await activatePlan(plan.id)
      toast.success('Workout program saved', {
        description: 'Your new program is active.',
      })
      onAccept?.(plan.id)
      router.push(`/plans/${plan.id}`)
    } catch {
      toast.error('Could not save the program. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = () => {
    try {
      const encoded =
        typeof window !== 'undefined'
          ? btoa(unescape(encodeURIComponent(JSON.stringify(program))))
          : Buffer.from(JSON.stringify(program), 'utf8').toString('base64')
      router.push(`/plans/new/workout?prefill=${encodeURIComponent(encoded)}`)
      onEdit?.()
    } catch {
      toast.error('Could not open the editor.')
    }
  }

  const handleDiscard = () => {
    setDismissed(true)
    onDiscard?.()
  }

  return (
    <div
      data-testid="workout-program-preview-card"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Geo extracted a workout program
        </h3>
        <span className={`text-xs font-medium ${conf.tone}`} data-testid="confidence-badge">
          {conf.label} ({Math.round(confidence * 100)}%)
        </span>
      </div>

      <div className="text-sm text-muted-foreground" data-testid="program-summary">
        {days.length} day{days.length === 1 ? '' : 's'} · {totalExercises} exercise
        {totalExercises === 1 ? '' : 's'}
      </div>

      <ul className="text-xs text-muted-foreground space-y-1" data-testid="day-list">
        {days.map((d, i) => (
          <li key={i} className="flex items-center justify-between">
            <span>{d.name || `Day ${i + 1}`}</span>
            <span>{(d.exercises?.length ?? 0)} ex</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          data-testid="preview-accept"
        >
          {busy ? 'Saving…' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={handleEdit}
          disabled={busy}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground"
          data-testid="preview-edit"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={busy}
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
          data-testid="preview-discard"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
