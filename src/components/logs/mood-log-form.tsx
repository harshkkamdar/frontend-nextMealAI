'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { ManualLogShell, NotesField, RatingPills } from './manual-log-shell'

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
    <ManualLogShell title="Log mood" prompt="How are you feeling?" saving={saving} onSave={() => void handleSave()}>
      <div className="space-y-7">
        <RatingPills rating={rating} onChange={setRating} label="Mood" />
        <NotesField value={notes} onChange={setNotes} placeholder="What's on your mind?" />
      </div>
    </ManualLogShell>
  )
}
