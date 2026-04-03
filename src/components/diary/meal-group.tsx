'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { deleteLog } from '@/lib/api/logs.api'
import type { Log, FoodPayload } from '@/types/logs.types'

interface MealGroupProps {
  mealType: string
  items: Log[]
  onAddFood: () => void
  onDeleteLog: (id: string) => void
}

export function MealGroup({ mealType, items, onAddFood, onDeleteLog }: MealGroupProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const subtotalCals = items.reduce((sum, item) => {
    const payload = item.payload as FoodPayload
    return sum + (payload.est_macros?.calories ?? 0)
  }, 0)

  const subtotalProtein = items.reduce((sum, item) => {
    const payload = item.payload as FoodPayload
    return sum + (payload.est_macros?.protein ?? 0)
  }, 0)

  const handleDelete = async (logId: string) => {
    setDeletingId(logId)
    try {
      await deleteLog(logId)
      onDeleteLog(logId)
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">{mealType}</span>
        {items.length > 0 && (
          <span className="text-xs text-text-secondary tabular-nums">
            {subtotalCals} cal &middot; {subtotalProtein}g P
          </span>
        )}
      </div>

      {/* Items */}
      <AnimatePresence>
        {items.map((item) => {
          const payload = item.payload as FoodPayload
          const cals = payload.est_macros?.calories ?? 0
          const protein = payload.est_macros?.protein ?? 0

          return (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{payload.food_name}</p>
                <p className="text-[11px] text-text-tertiary tabular-nums">
                  {payload.quantity_g ? `${payload.quantity_g}g` : '1 serving'}
                  {cals > 0 && ` · ${cals} cal`}
                  {protein > 0 && ` · ${protein}g P`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="p-1.5 rounded-full text-text-tertiary hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label="Remove food"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Empty state or add button */}
      {items.length === 0 ? (
        <button
          onClick={onAddFood}
          className="flex items-center justify-center gap-1.5 w-full py-4 text-xs text-text-tertiary hover:text-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          No {mealType.toLowerCase()} logged — tap to add
        </button>
      ) : (
        <button
          onClick={onAddFood}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-accent hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add to {mealType}
        </button>
      )}
    </div>
  )
}
