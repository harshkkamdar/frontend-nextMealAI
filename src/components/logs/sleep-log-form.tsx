'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-1">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-[17px] font-semibold text-text-primary">Log Sleep</h2>
        <div className="w-5" />
      </div>

      {/* Hours input - large centered */}
      <div className="flex flex-col items-center py-8">
        <div className="flex items-baseline gap-2">
          <Input
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value ? Number(e.target.value) : '')}
            className="w-24 text-center text-[32px] font-bold h-auto py-2 border-0 border-b-2 border-border rounded-none focus-visible:border-accent focus-visible:ring-0"
          />
          <span className="text-lg text-text-secondary font-medium">hours</span>
        </div>
      </div>

      {/* Quality rating */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-text-secondary">Sleep Quality</Label>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQualityRating(n)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                n <= qualityRating
                  ? 'bg-[#6366F1] text-white'
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
          placeholder="How was your sleep?"
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
