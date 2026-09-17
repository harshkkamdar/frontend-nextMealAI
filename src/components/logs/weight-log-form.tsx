'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { ManualLogShell, NotesField, NumericSuffixInput } from './manual-log-shell'

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
    <ManualLogShell title="Log weight" prompt="What's the scale saying?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-6">
        <NumericSuffixInput
          label="Weight"
          value={weightKg}
          onChange={setWeightKg}
          suffix="kg"
          placeholder="0.0"
          step="0.1"
        />
        <NotesField value={notes} onChange={setNotes} placeholder="Any notes (optional)" />
      </div>
    </ManualLogShell>
  )
}
