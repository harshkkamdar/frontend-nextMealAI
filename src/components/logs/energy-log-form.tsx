'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-1">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-[17px] font-semibold text-text-primary">Log Energy</h2>
        <div className="w-5" />
      </div>

      {/* Rating display */}
      <div className="flex flex-col items-center py-8">
        <span className="text-[48px] font-bold text-text-primary tabular-nums">
          {rating || '-'}
        </span>
        <span className="text-sm text-text-secondary mt-1">out of 10</span>
      </div>

      {/* Rating circles */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-text-secondary">Energy Level</Label>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                n <= rating
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover text-text-secondary'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Time of day chips */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-text-secondary">Time of Day</Label>
        <div className="flex gap-2">
          {TIME_OF_DAY_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setTimeOfDay(timeOfDay === option ? '' : option)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                timeOfDay === option
                  ? 'bg-accent border border-accent text-white'
                  : 'bg-surface border border-border text-text-primary hover:bg-surface-hover'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs text-text-secondary">Notes</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
          placeholder="Anything affecting your energy?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-accent hover:bg-accent-hover text-white mt-6"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
