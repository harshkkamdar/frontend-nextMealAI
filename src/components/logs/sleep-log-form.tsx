'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { FieldLabel, ManualLogShell, NotesField, NumericSuffixInput } from './manual-log-shell'
import { Scale } from './log-ui'

export function SleepLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState<number | ''>('')
  const [qualityRating, setQualityRating] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (!hours) {
      toast.error('Hours slept is required')
      return
    }
    if (qualityRating === 0) {
      toast.error('Select a quality rating')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'sleep',
        payload: {
          hours: hours,
          quality_rating: qualityRating,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
      void haptic('success')
      toast.success('Sleep logged')
      router.back()
    } catch {
      toast.error('Failed to log sleep')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Sleep" prompt="How did you sleep last night?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-7">
        <NumericSuffixInput
          label="Hours slept"
          value={hours}
          onChange={setHours}
          suffix="h"
          placeholder="0"
          step="0.5"
          min={0}
          max={24}
        />
        <div>
          <FieldLabel>How well, 1 to 10</FieldLabel>
          <Scale value={qualityRating} onChange={setQualityRating} label="Sleep quality from 1 to 10" />
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
