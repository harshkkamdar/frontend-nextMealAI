'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

export function WeightLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (!weightKg) {
      toast.error('Weight is required')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'weight',
        payload: {
          weight_kg: weightKg,
          notes: notes.trim() || undefined,
        },
        source: 'manual',
      })
      toast.success('Weight logged')
      router.back()
    } catch {
      toast.error('Failed to log weight')
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
        <h2 className="text-[17px] font-semibold text-text-primary">Log Weight</h2>
        <div className="w-5" />
      </div>

      {/* Weight input - centered large */}
      <div className="flex flex-col items-center py-12">
        <div className="flex items-baseline gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="0.0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
            className="w-32 text-center text-[32px] font-bold h-auto py-2 border-0 border-b-2 border-border rounded-none focus-visible:border-accent focus-visible:ring-0"
          />
          <span className="text-lg text-text-secondary font-medium">kg</span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs text-text-secondary">Notes</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-none"
          placeholder="Any notes (optional)"
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
