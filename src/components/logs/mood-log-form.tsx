'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { FieldLabel, ManualLogShell, NotesField } from './manual-log-shell'
import { Scale } from './log-ui'

export function MoodLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (rating === 0) {
      toast.error('Select a mood rating')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'mood',
        payload: {
          rating,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
      void haptic('success')
      toast.success('Mood logged')
      router.back()
    } catch {
      toast.error('Failed to log mood')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Mood" prompt="How are you feeling right now?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-7">
        <div>
          <FieldLabel>1 is low, 10 is great</FieldLabel>
          <Scale value={rating} onChange={setRating} label="Mood from 1 to 10" />
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
