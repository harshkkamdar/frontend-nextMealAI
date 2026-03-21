'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Scale,
  SmilePlus,
  Moon,
  Zap,
  Camera,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'

interface LogType {
  icon: LucideIcon
  label: string
  color: string
  bgColor: string
  route: string
}

const logTypes: LogType[] = [
  { icon: UtensilsCrossed, label: 'Food', color: '#E8663C', bgColor: 'bg-accent-light', route: '/logs/new/food' },
  { icon: Dumbbell, label: 'Workout', color: '#34C759', bgColor: 'bg-green-50', route: '/logs/new/workout' },
  { icon: Droplets, label: 'Water', color: '#3B82F6', bgColor: 'bg-blue-50', route: '/logs/new/water' },
  { icon: Scale, label: 'Weight', color: '#A855F7', bgColor: 'bg-purple-50', route: '/logs/new/weight' },
  { icon: SmilePlus, label: 'Mood', color: '#FF9F0A', bgColor: 'bg-amber-50', route: '/logs/new/mood' },
  { icon: Moon, label: 'Sleep', color: '#6366F1', bgColor: 'bg-indigo-50', route: '/logs/new/sleep' },
  { icon: Zap, label: 'Energy', color: '#E8663C', bgColor: 'bg-accent-light', route: '/logs/new/energy' },
  { icon: Camera, label: 'Scan Menu', color: '#6B6560', bgColor: 'bg-surface', route: '/chat' },
]

export function QuickLogSheet() {
  const activeSheet = useUIStore((s) => s.activeSheet)
  const closeSheet = useUIStore((s) => s.closeSheet)
  const router = useRouter()
  const isOpen = activeSheet === 'quick-log'

  const handleSelect = (route: string) => {
    closeSheet()
    router.push(route)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeSheet}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-6 pt-3 pb-8"
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Title */}
            <h2 className="text-base font-semibold text-text-primary mb-5">
              Quick Log
            </h2>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-4">
              {logTypes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleSelect(item.route)}
                    className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs text-text-primary">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
