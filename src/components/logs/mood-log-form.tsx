'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FieldLabel, ManualLogShell, NotesField, ScaleEnds, saveManualLog } from './manual-log-shell'
import { Scale } from './log-ui'

export function MoodLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (rating === 0) { toast.error('Select a mood rating'); return }
    setSaving(true)
    const ok = await saveManualLog({ type: 'mood', payload: { rating, notes: notes.trim() || undefined }, source: 'manual' }, 'Mood logged', () => router.back())
    setFailed(!ok)
    setSaving(false)
  }

  return (
    <ManualLogShell title="Mood" prompt="How are you feeling?" saving={saving} failed={failed} onSave={() => void handleSave()}>
      <div className="space-y-6">
        <div>
          <FieldLabel>1 is low, 10 is great</FieldLabel>
          <Scale value={rating} onChange={setRating} label="Mood from 1 to 10" />
          <ScaleEnds low="Low" high="Great" />
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
