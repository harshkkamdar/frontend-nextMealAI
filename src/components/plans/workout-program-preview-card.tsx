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
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'

export interface WorkoutProgramPreviewCardProps {
  program: WorkoutProgramContent
  confidence: number
  onAccept?: (planId: string) => void
  onEdit?: () => void
  onDiscard?: () => void
}

function confidenceLabel(c: number): string {
  if (c >= 0.85) return 'High confidence'
  if (c >= 0.6) return 'Medium confidence'
  return 'Low confidence'
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
      router.push(`/plans/view?id=${plan.id}`)
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
      className="space-y-3 rounded-[16px] border border-ink-12 bg-card p-[14px]"
    >
      <div className="flex items-center justify-between">
        <SectionLabel>Program from your photo</SectionLabel>
        <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65" data-testid="confidence-badge">
          {conf}
        </span>
      </div>

      <div className="text-[13.5px] text-ink-65" data-testid="program-summary">
        {days.length} day{days.length === 1 ? '' : 's'} · {totalExercises} exercise
        {totalExercises === 1 ? '' : 's'}
      </div>

      <ul className="space-y-1 text-[13.5px] text-ink-65" data-testid="day-list">
        {days.map((d, i) => (
          <li key={i} className="flex items-center justify-between">
            <span>{d.name || `Day ${i + 1}`}</span>
            <span>{(d.exercises?.length ?? 0)} ex</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2 pt-1">
        <PrimaryButton
          type="button"
          onClick={handleAccept}
          disabled={busy}
          data-testid="preview-accept"
        >
          {busy ? 'Saving…' : 'Use this program'}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={handleEdit}
          disabled={busy}
          onNavy={false}
          data-testid="preview-edit"
        >
          Edit first
        </SecondaryButton>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={busy}
          className="w-full py-2 text-[13.5px] font-semibold text-ink-65"
          data-testid="preview-discard"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
