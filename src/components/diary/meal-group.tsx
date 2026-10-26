'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Apple, Croissant, Ellipsis, Sandwich, UtensilsCrossed } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ChevronRightIcon, PlusIcon } from '@/components/ui/fiqr/icons'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { reducedFade, spring } from '@/lib/motion'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import { cn } from '@/lib/utils'
import type { FoodPayload, Log } from '@/types/logs.types'
import { dominantMacro, logPhoto, mealOf, quantityLabel, type MacroHue } from './diary-logic'

interface MealGroupProps {
  mealType: string
  items: Log[]
  onAddFood: () => void
  /** A row tap opens that log's actions sheet (journey-food D1 Tap for actions). */
  onOpenLog?: (log: Log) => void
  isToday?: boolean
  onCopyToToday?: () => void
  onSaveFavourite?: () => void
  /** First paint of the session: the section rises in with the others (motion-feel 3e). */
  enterDelay?: number
}

/** A meal with more than 7 rows shows 6 and a "Show n more" row (mock state matrix, long content). */
const FOLD_AFTER = 7
const FOLD_TO = 6

/** "Add breakfast", "Add a snack". */
const addLabel = (mealType: string) => (mealType === 'Snack' ? 'Add a snack' : `Add ${mealType.toLowerCase()}`)

const GLYPH = { Breakfast: Croissant, Lunch: Sandwich, Dinner: UtensilsCrossed, Snack: Apple } as const
/** Q2 tints of the macro hues: the row's main macro tints its glyph tile. */
const TINT: Record<MacroHue, string> = {
  protein: 'bg-ink/[.07] text-ink',
  carbs: 'bg-macro-teal/[.13] text-macro-teal',
  fat: 'bg-macro-ochre/[.16] text-macro-ochre',
}

/** Photo-led media (journey-food C3): the log's photo when it has one, otherwise its meal glyph on a macro-hue tint. */
export function FoodThumb({ payload }: { payload: FoodPayload }) {
  const photo = logPhoto(payload)
  if (photo) return <img src={photo} alt="" className="size-12 shrink-0 rounded-[14px] bg-ink-06 object-cover" />
  const Glyph = GLYPH[mealOf(payload)]
  const hue = dominantMacro(payload.est_macros)
  return (
    <span aria-hidden="true" className={cn('grid size-12 shrink-0 place-items-center rounded-[14px]', hue ? TINT[hue] : 'bg-ink-06 text-ink-65')}>
      <Glyph className="size-[22px]" strokeWidth={1.75} />
    </span>
  )
}

const DIVIDER = <span aria-hidden="true" className="absolute left-4 right-0 top-0 h-px bg-ink-06" />

export function MealGroup({ mealType, items, onAddFood, onOpenLog, isToday = true, onCopyToToday, onSaveFavourite, enterDelay }: MealGroupProps) {
  const reduce = useReducedMotion()
  const tilt = usePressTilt<HTMLDivElement>()
  const [actionsOpen, setActionsOpen] = useState(false)
  const [unfolded, setUnfolded] = useState(false)

  const calories = items.reduce((total, item) => total + ((item.payload as FoodPayload).est_macros?.calories ?? 0), 0)
  const folded = items.length > FOLD_AFTER && !unfolded
  const shown = folded ? items.slice(0, FOLD_TO) : items

  const runAction = (action?: () => void) => {
    setActionsOpen(false)
    action?.()
  }

  const glide = reduce ? reducedFade : spring.glide

  return (
    <motion.section
      layout="position"
      initial={enterDelay === undefined ? false : reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...glide, delay: enterDelay ?? 0, layout: glide }}
      aria-label={mealType}
    >
      <div className="mb-1 flex min-h-11 items-center gap-2.5 pl-1">
        <h2 className="font-display min-w-0 flex-1 text-headline font-extrabold tracking-[-0.015em] text-ink">{mealType}</h2>
        {calories > 0 ? <span className="text-caption font-semibold text-ink-65 tabular-nums">{formatMacroKcal(calories)} kcal</span> : null}
        <button
          type="button"
          onClick={() => setActionsOpen(true)}
          aria-label={`${mealType} actions`}
          aria-haspopup="dialog"
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94] active:bg-ink-06"
        >
          <Ellipsis className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={onAddFood}
          className="flex min-h-14 w-full items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-ink-20 px-4 text-left text-body-sm font-semibold text-ink-65 transition-transform active:scale-[.98]"
        >
          <span className="grid size-[30px] place-items-center rounded-full bg-ink-06 text-ink"><PlusIcon className="size-4" /></span>
          {addLabel(mealType)}
        </button>
      ) : (
        <div {...tilt} className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
          {shown.map((item, index) => {
            const payload = item.payload as FoodPayload
            const macros = payload.est_macros
            const kcal = formatMacroKcal(macros?.calories ?? 0)
            const quantity = quantityLabel(payload)
            return (
              <motion.button
                key={item.id}
                layout="position"
                transition={glide}
                type="button"
                onClick={() => onOpenLog?.(item)}
                aria-haspopup="dialog"
                aria-label={`${payload.food_name}, ${quantity}, ${kcal} kcal`}
                className="relative flex min-h-[60px] w-full items-center gap-3.5 px-4 py-2.5 text-left active:bg-ink-04"
              >
                {index > 0 ? DIVIDER : null}
                <FoodThumb payload={payload} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="line-clamp-2 text-body font-semibold leading-[1.3] text-ink [overflow-wrap:anywhere]">{payload.food_name}</span>
                  <span className="truncate text-caption text-ink-65 tabular-nums">
                    {quantity} · {formatMacroGrams(macros?.protein ?? 0)} P · {formatMacroGrams(macros?.carbs ?? 0)} C · {formatMacroGrams(macros?.fat ?? 0)} F
                  </span>
                </span>
                <span className="min-w-[58px] shrink-0 text-right text-body font-semibold text-ink tabular-nums">
                  {kcal}<span className="text-label font-medium text-ink-65"> kcal</span>
                </span>
              </motion.button>
            )
          })}
          {folded ? (
            <button type="button" onClick={() => setUnfolded(true)} className="relative flex min-h-[50px] w-full items-center px-4 text-body-sm font-semibold text-ink active:bg-ink-04">
              {DIVIDER}
              Show {items.length - FOLD_TO} more
            </button>
          ) : null}
          <motion.div layout="position" transition={glide} className="relative">
            {DIVIDER}
            <button type="button" onClick={onAddFood} aria-label={`Add food to ${mealType}`} className="flex min-h-[50px] w-full items-center gap-2.5 px-4 text-body-sm font-semibold text-ink-65 active:bg-ink-04">
              <PlusIcon className="size-[18px]" />Add food
            </button>
          </motion.div>
        </div>
      )}

      <BottomSheet open={actionsOpen} onClose={() => setActionsOpen(false)} ariaLabel={`${mealType} actions`}>
        <div className="px-4 pb-5 pt-1">
          <h2 className="font-display mb-3 px-1 text-headline font-extrabold text-ink">{mealType}</h2>
          <div className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
            <ActionRow label={addLabel(mealType)} onClick={() => runAction(onAddFood)} />
            {!isToday && onCopyToToday ? <ActionRow label="Copy to today" onClick={() => runAction(onCopyToToday)} /> : null}
            {onSaveFavourite ? <ActionRow label="Save as meal" onClick={() => runAction(onSaveFavourite)} /> : null}
          </div>
        </div>
      </BottomSheet>
    </motion.section>
  )
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between border-b border-ink-06 px-4 py-3 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04">
      {label}
      <ChevronRightIcon className="size-4 text-ink-35" />
    </button>
  )
}
