'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronUp, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { formatMacroKcal } from '@/lib/macros'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { LIST } from './log-ui'
import { MEALS, sumMacros, type Meal, type PlateItem } from './log-math'

const count = (n: number) => `${n} item${n === 1 ? '' : 's'}`

/** The plate pill (journey-log D2): what is on the plate and one Log; tap the pill for the plate sheet. */
export function PlatePill({ items, saving, onOpen, onLog }: { items: PlateItem[]; saving: boolean; onOpen: () => void; onLog: () => void }) {
  const reduce = useReducedMotion()
  const kcal = sumMacros(items.map((i) => i.macros)).calories
  return (
    <AnimatePresence>
      {items.length > 0 ? (
        <motion.div
          key="plate"
          data-testid="food-meal-tray"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          transition={reduce ? reducedFade : spring.sheet}
          className="fixed inset-x-0 z-30 mx-auto w-full max-w-md px-3"
          style={{ bottom: 'calc(12px + var(--safe-bottom))' }}
        >
          <div className="glass flex h-[56px] items-center rounded-full pl-1 pr-1.5">
            <button type="button" onClick={() => { void haptic('selection'); onOpen() }} aria-label={`Your plate, ${count(items.length)}, ${formatMacroKcal(kcal)} kcal. Open the plate`} className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-full pl-3 text-left">
              <ChevronUp aria-hidden="true" className="size-4 shrink-0 text-ink" />
              <span className="truncate text-body-sm font-bold text-ink tabular-nums">{count(items.length)} · {formatMacroKcal(kcal)} kcal</span>
            </button>
            <PrimaryButton type="button" onClick={onLog} disabled={saving} aria-busy={saving} className="h-11 min-h-11 w-auto shrink-0 px-6 disabled:bg-accent/60 disabled:text-ink">
              {saving ? 'Saving…' : 'Log'}
            </PrimaryButton>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** The plate sheet: the meal, every item with its kcal and a remove, and Log n items to the meal. */
export function PlateSheet({ open, items, meal, saving, failedNote, loggedCount, onMeal, onRemove, onClose, onLog, onDone }: {
  open: boolean
  items: PlateItem[]
  meal: Meal
  saving: boolean
  /** Set after a partial save: which item(s) did not save. */
  failedNote: string | null
  loggedCount: number
  onMeal: (meal: Meal) => void
  onRemove: (key: string) => void
  onClose: () => void
  onLog: () => void
  onDone: () => void
}) {
  const kcal = sumMacros(items.map((i) => i.macros)).calories
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Your plate">
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-1">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-headline text-ink">{meal}</h2>
          <p className="text-caption text-ink-65 tabular-nums">{count(items.length)} · {formatMacroKcal(kcal)} kcal</p>
        </div>
        <div role="radiogroup" aria-label="Meal" data-no-swipe-back className="scrollbar-hide -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {MEALS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === meal}
              onClick={() => { void haptic('selection'); onMeal(m) }}
              className={`h-11 shrink-0 rounded-full px-4 text-body-sm font-semibold transition-transform active:scale-[.96] ${m === meal ? 'bg-ink text-cream' : 'card-glass text-ink'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <ul className={cn(LIST, 'mt-3 min-h-0 flex-1 overflow-y-auto')} aria-label="On your plate">
          {items.map((item) => (
            <li key={item.key} className="flex min-h-row items-center gap-2 border-b border-ink-06 pl-4 pr-1 last:border-b-0">
              <span className="min-w-0 flex-1 py-2">
                <span className="block truncate text-body-sm font-semibold text-ink">{item.name}</span>
                <span className="block text-caption text-ink-65 tabular-nums">{item.portion}</span>
              </span>
              <span className="shrink-0 text-body-sm font-bold text-ink tabular-nums">{formatMacroKcal(item.macros.calories)}</span>
              <button type="button" aria-label={`Remove ${item.name}`} onClick={() => { void haptic('selection'); onRemove(item.key) }} className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.92]">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        {failedNote ? (
          <p role="alert" className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-[16px] bg-macro-ochre/15 pl-4 pr-1 text-caption text-ink">
            {failedNote}
            <button type="button" onClick={onLog} disabled={saving} className="h-11 shrink-0 px-3 text-body-sm font-semibold text-ink underline underline-offset-4">{saving ? 'Retrying…' : 'Retry'}</button>
          </p>
        ) : null}
        <PrimaryButton type="button" onClick={failedNote ? onDone : onLog} disabled={saving || (!failedNote && items.length === 0)} aria-busy={saving} className="mt-3 shrink-0">
          {failedNote ? `Done, ${loggedCount} logged` : saving ? 'Saving…' : `Log ${count(items.length)} to ${meal}`}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
