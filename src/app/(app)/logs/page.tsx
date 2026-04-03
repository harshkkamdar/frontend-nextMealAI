'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Utensils, Dumbbell, Droplets, Weight, Smile, Moon, Zap } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { LogList } from '@/components/logs/log-list'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'

const LOG_TYPES = [
  { type: 'food', label: 'Food', icon: Utensils, color: 'bg-accent' },
  { type: 'workout', label: 'Workout', icon: Dumbbell, color: 'bg-[#34C759]' },
  { type: 'water', label: 'Water', icon: Droplets, color: 'bg-[#3B82F6]' },
  { type: 'weight', label: 'Weight', icon: Weight, color: 'bg-[#A855F7]' },
  { type: 'mood', label: 'Mood', icon: Smile, color: 'bg-[#FF9F0A]' },
  { type: 'sleep', label: 'Sleep', icon: Moon, color: 'bg-[#6366F1]' },
  { type: 'energy', label: 'Energy', icon: Zap, color: 'bg-accent' },
]

export default function LogsPage() {
  useSetGeoScreen('logs', {})
  const router = useRouter()
  const [fabOpen, setFabOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!fabOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFabOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [fabOpen])

  return (
    <PageWrapper className="pb-32">
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-4">
        Activity Log
      </h1>
      <LogList />

      {/* Floating Action Button */}
      <div ref={menuRef} className="fixed bottom-24 right-5 z-50 flex flex-col items-end">
        {/* Log type menu */}
        {fabOpen && (
          <div className="mb-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {LOG_TYPES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  setFabOpen(false)
                  router.push(`/logs/new/${type}`)
                }}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl pl-4 pr-5 py-2.5 shadow-lg hover:bg-surface-hover transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-text-primary">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            fabOpen
              ? 'bg-text-secondary rotate-45'
              : 'bg-accent hover:bg-accent-hover'
          }`}
          aria-label={fabOpen ? 'Close menu' : 'Add new log'}
        >
          {fabOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </PageWrapper>
  )
}
