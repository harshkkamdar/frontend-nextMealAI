'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { ManualLogShell, NotesField, RatingPills } from './manual-log-shell'

const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Evening']

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
      toast.success('Energy logged')
      router.back()
    } catch {
      toast.error('Failed to log energy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Log energy" prompt="How's your energy?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-7">
        <RatingPills rating={rating} onChange={setRating} label="Energy" />
        <div>
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-65">Time of day</p>
          <div className="flex gap-2">
            {TIME_OF_DAY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTimeOfDay(timeOfDay === option ? '' : option)}
                aria-pressed={timeOfDay === option}
                className={`h-11 rounded-full px-4 text-[14px] font-semibold ${
                  timeOfDay === option ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Anything affecting your energy?" />
      </div>
    </ManualLogShell>
  )
}
