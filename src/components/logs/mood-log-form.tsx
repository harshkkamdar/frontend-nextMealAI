'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

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
      toast.success('Mood logged')
      router.back()
    } catch {
      toast.error('Failed to log mood')
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
        <h2 className="text-[17px] font-semibold text-text-primary">Log Mood</h2>
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
        <Label className="text-xs text-text-secondary">How are you feeling?</Label>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                n <= rating
                  ? 'bg-[#FF9F0A] text-white'
                  : 'bg-surface-hover text-text-secondary'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs text-text-secondary">Notes</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
          placeholder="What's on your mind?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-accent to-accent-hover text-white mt-6"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
