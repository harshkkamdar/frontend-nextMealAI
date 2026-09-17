'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { ManualLogShell, NotesField, NumericSuffixInput, RatingPills } from './manual-log-shell'

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
      toast.success('Sleep logged')
      router.back()
    } catch {
      toast.error('Failed to log sleep')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Log sleep" prompt="How did you sleep?" saving={saving} onSave={() => void handleSave()}>
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
        <RatingPills rating={qualityRating} onChange={setQualityRating} label="Sleep quality" />
        <NotesField value={notes} onChange={setNotes} placeholder="How was your sleep?" />
      </div>
    </ManualLogShell>
  )
}
