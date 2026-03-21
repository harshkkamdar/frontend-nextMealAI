'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

export function WaterLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [glasses, setGlasses] = useState(1)

  const handleSave = async () => {
    if (glasses <= 0) {
      toast.error('Add at least 1 glass')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'water',
        payload: { glasses },
        source: 'manual',
      })
      toast.success('Water logged')
      router.back()
    } catch {
      toast.error('Failed to log water')
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
        <h2 className="text-[17px] font-semibold text-text-primary">Log Water</h2>
        <div className="w-5" />
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center py-12">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setGlasses(Math.max(0, glasses - 1))}
            className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center text-accent transition-colors hover:bg-accent-light"
          >
            <Minus className="w-5 h-5" />
          </button>

          <span className="text-[48px] font-bold text-text-primary tabular-nums min-w-[80px] text-center">
            {glasses}
          </span>

          <button
            type="button"
            onClick={() => setGlasses(glasses + 1)}
            className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center text-accent transition-colors hover:bg-accent-light"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <span className="text-sm text-text-secondary mt-2">glasses</span>
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
