'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FieldLabel, ManualLogShell, NotesField, ScaleEnds, saveManualLog } from './manual-log-shell'
import { Chips, Scale } from './log-ui'

const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Evening'].map((value) => ({ value, label: value }))

export function EnergyLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [rating, setRating] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (rating === 0) { toast.error('Select an energy rating'); return }
    setSaving(true)
    const ok = await saveManualLog({ type: 'energy', payload: { rating, time_of_day: timeOfDay || undefined, notes: notes.trim() || undefined }, source: 'manual' }, 'Energy logged', () => router.back())
    setFailed(!ok)
    setSaving(false)
  }

  return (
    <ManualLogShell title="Energy" prompt="How much energy?" saving={saving} failed={failed} onSave={() => void handleSave()}>
      <div className="space-y-6">
        <div>
          <FieldLabel>1 is flat, 10 is flying</FieldLabel>
          <Scale value={rating} onChange={setRating} label="Energy from 1 to 10" />
          <ScaleEnds low="Flat" high="Flying" />
        </div>
        <div>
          <FieldLabel>Time of day</FieldLabel>
          <Chips options={TIME_OF_DAY_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} label="Time of day" clearable />
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
