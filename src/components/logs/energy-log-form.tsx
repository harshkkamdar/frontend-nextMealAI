'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { FieldLabel, ManualLogShell, NotesField } from './manual-log-shell'
import { Chips, Scale } from './log-ui'

const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Evening'].map((value) => ({ value, label: value }))

export function EnergyLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [rating, setRating] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (rating === 0) {
      toast.error('Select an energy rating')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'energy',
        payload: {
          rating,
          time_of_day: timeOfDay || undefined,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
      void haptic('success')
      toast.success('Energy logged')
      router.back()
    } catch {
      toast.error('Failed to log energy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Energy" prompt="How much energy do you have?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-7">
        <div>
          <FieldLabel>1 is flat, 10 is flying</FieldLabel>
          <Scale value={rating} onChange={setRating} label="Energy from 1 to 10" />
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
