'use client'

import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpDown, Copy, Pencil, Trash2, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { reducedFade } from '@/lib/motion'
import type { FoodPayload, Log } from '@/types/logs.types'
import { ChoiceGrid, GroupLabel } from './choice-grid'
import { copyDays, kcalText, mealOf, quantityLabel, shiftISO } from './diary-logic'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

/** "Today", "Tomorrow", "Yesterday", else the short weekday; the chip's second line is "27 Oct". */
function dayChip(iso: string, today: string) {
  const d = new Date(`${iso}T12:00:00`)
  const label = iso === today ? 'Today' : iso === shiftISO(today, 1) ? 'Tomorrow' : iso === shiftISO(today, -1) ? 'Yesterday' : d.toLocaleDateString('en-AU', { weekday: 'short' })
  return { value: iso, label, sub: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) }
}

interface RowActionsSheetProps {
  open: boolean
  /** Kept by the caller after close, so the sheet keeps its content while it leaves. */
  log: Log | null
  /** The day the log is on, and the user's today (YYYY-MM-DD). */
  date: string
  today: string
  /** "Mon 26 Oct". */
  dayLabel: (iso: string) => string
  onClose: () => void
  onEdit: (log: Log) => void
  onMove: (log: Log, meal: string) => void
  onCopy: (log: Log, date: string, meal: string) => void
  /** Delete asks first: the caller closes this sheet and shows the confirm (a confirm over a modal sheet can't take focus). */
  onDelete: (log: Log) => void
}

/**
 * One logged item's actions (journey-food D1 Tap for actions, "Row actions sheet and confirm"): edit the amount, copy it
 * to a day and meal, change its meal, or delete it (the caller confirms, then offers Undo).
 */
export function RowActionsSheet({ open, log, date, today, dayLabel, onClose, onEdit, onMove, onCopy, onDelete }: RowActionsSheetProps) {
  const reduce = useReducedMotion()
  const [view, setView] = useState<'list' | 'move' | 'copy'>('list')
  const [copyDay, setCopyDay] = useState<string | null>(null)
  const [copyMeal, setCopyMeal] = useState<string | null>(null)

  // Each opening starts on the list (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setView('list'); setCopyDay(null); setCopyMeal(null) }
  }

  if (!log) return null
  const payload = log.payload as FoodPayload
  const meal = mealOf(payload)
  const kcal = kcalText(payload.est_macros?.calories)
  const days = copyDays(date, today)
  const pickedDay = copyDay ?? days[0]
  const pickedMeal = copyMeal ?? meal

  const header = (title: string, sub: string) => (
    <div className="flex items-start gap-3 px-1 pb-3">
      <div className="min-w-0 flex-1">
        <h2 className="font-display line-clamp-2 text-headline font-extrabold leading-tight text-ink [overflow-wrap:anywhere]">{title}</h2>
        <p className="mt-0.5 text-caption text-ink-65 tabular-nums">{sub}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94]">
        <X className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={`${payload.food_name} actions`}>
      <motion.div
        key={view}
        initial={view === 'list' ? false : reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? reducedFade : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="px-4 pb-5 pt-1"
      >
        {view === 'list' ? (
          <>
            {header(payload.food_name, `${quantityLabel(payload)} · ${kcal} kcal · ${meal}, ${dayLabel(date)}`)}
            <div className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
              <ActionItem icon={<Pencil />} label="Edit amount" onClick={() => onEdit(log)} />
              <ActionItem icon={<Copy />} label={date === today ? 'Copy to another day' : 'Copy to today'} onClick={() => setView('copy')} />
              <ActionItem icon={<ArrowUpDown />} label="Change meal" detail={meal} onClick={() => setView('move')} />
              <ActionItem icon={<Trash2 />} label="Delete" onClick={() => onDelete(log)} />
            </div>
          </>
        ) : view === 'move' ? (
          <>
            {header('Move to', payload.food_name)}
            <ChoiceGrid
              label="Meal"
              choices={MEALS.map((m) => ({ value: m, label: m, sub: m === meal ? 'Now' : undefined, disabled: m === meal }))}
              value={null}
              onPick={(m) => onMove(log, m)}
            />
            <p className="mx-1 mt-4 text-label text-ink-65">Stays on {dayLabel(date)}. Totals do not change.</p>
          </>
        ) : (
          <>
            {header('Copy to', payload.food_name)}
            <GroupLabel className="mt-0">Day</GroupLabel>
            <ChoiceGrid label="Day" cols={3} choices={days.map((d) => dayChip(d, today))} value={pickedDay} onPick={setCopyDay} />
            <GroupLabel>Meal</GroupLabel>
            <ChoiceGrid label="Meal" choices={MEALS.map((m) => ({ value: m, label: m }))} value={pickedMeal} onPick={setCopyMeal} />
            <button
              type="button"
              onClick={() => onCopy(log, pickedDay, pickedMeal)}
              className="mt-4 h-btn w-full rounded-[18px] bg-ink text-body font-bold text-cream transition-transform active:scale-[.97]"
            >
              Copy
            </button>
          </>
        )}
      </motion.div>
    </BottomSheet>
  )
}

function ActionItem({ icon, label, detail, onClick }: { icon: ReactNode; label: string; detail?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="relative flex min-h-14 w-full items-center gap-3.5 px-4 text-left text-body font-medium text-ink active:bg-ink-04 [&+&]:before:absolute [&+&]:before:left-[50px] [&+&]:before:right-0 [&+&]:before:top-0 [&+&]:before:h-px [&+&]:before:bg-ink-06">
      <span aria-hidden="true" className="text-ink-65 [&_svg]:size-[22px] [&_svg]:stroke-[1.75]">{icon}</span>
      <span className="flex-1">{label}</span>
      {detail ? <span className="text-caption text-ink-65">{detail}</span> : null}
    </button>
  )
}
