'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, Undo2 } from 'lucide-react'
import type { LoggedFood } from '@/components/chat/logged-foods'
import type { ActionCardModel } from '@/components/chat/thread-actions'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

const fmt = (n: number) => (Number.isInteger(n) ? n : Number(n.toFixed(1))).toLocaleString('en-AU')

function MacroValue({ value, letter, color }: { value: number | null; letter: string; color: string }) {
  if (value === null) return null
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: color }} />
      {fmt(value)} g {letter}
    </span>
  )
}

/** Foods on the card: name and kcal on a baseline, macros (or the row's own meal) under the name. */
function FoodRows({ foods, sharedMeal, struck }: { foods: LoggedFood[]; sharedMeal: string | null; struck: boolean }) {
  return (
    <ul aria-label="Logged" className={cn(struck && 'text-ink-65 line-through decoration-ink-35')}>
      {foods.map((food, index) => {
        const hasMacros = food.protein !== null || food.carbs !== null || food.fat !== null
        const rowMeal = sharedMeal ? null : food.meal
        return (
          <li key={index} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1 border-t border-ink-06 px-4 py-3">
            <span className={cn('min-w-0 text-[15px] font-semibold leading-snug', !struck && 'text-ink')}>{food.name}</span>
            <span className={cn('text-right text-[15px] font-semibold tabular-nums', !struck && 'text-ink')}>
              {food.estimated ? '~' : ''}{fmt(food.kcal)}<span className="text-[13px] font-medium text-ink-65"> kcal</span>
            </span>
            {hasMacros || rowMeal ? (
              <>
                <span className="flex min-w-0 flex-wrap gap-x-3 text-[13px] font-medium text-ink-65 tabular-nums">
                  {hasMacros ? (
                    <>
                      <MacroValue value={food.protein} letter="P" color="var(--color-ink)" />
                      <MacroValue value={food.carbs} letter="C" color="var(--color-macro-teal)" />
                      <MacroValue value={food.fat} letter="F" color="var(--color-macro-ochre)" />
                    </>
                  ) : rowMeal}
                </span>
                <span className="text-right text-[13px] font-medium text-ink-65">{hasMacros ? rowMeal : null}</span>
              </>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

const LABELS: Record<string, string> = { 'change something': 'Change' }

/**
 * One thing Geo did, as one white card (pick A2): a confirmation line with the total, the rows, and the card's own
 * actions along the bottom. Undo strikes the card through; a saved draft says "Plan saved" in place.
 * The buttons send the chip text Geo offered, so the turn reads exactly as a tapped chip did.
 */
export function ActionCard({ card, body, onAction }: { card: ActionCardModel; body?: ReactNode; onAction?: (text: string) => void }) {
  const { kind, foods, undone, accepted } = card
  const actions = onAction ? card.actions : []
  const sharedMeal = foods.length > 0 && foods.every((f) => f.meal === foods[0].meal) ? foods[0].meal : null
  const total = foods.reduce((sum, f) => sum + f.kcal, 0)

  const label =
    kind === 'draft' ? (accepted ? 'Plan saved' : 'Draft plan') :
    kind === 'saved' ? 'Plan saved' :
    undone ? `Removed${sharedMeal ? ` from ${sharedMeal.toLowerCase()}` : ''}` :
    `Logged${sharedMeal ? ` to ${sharedMeal.toLowerCase()}` : card.logType && card.logType !== 'food' ? ` ${card.logType}` : ''}`
  const done = (kind === 'logged' && !undone) || kind === 'saved' || accepted

  return (
    <section aria-label={label} className="overflow-hidden rounded-card card-glass">
      <div className="flex min-h-11 items-center gap-1.5 px-4 pt-1">
        {done ? <Check aria-hidden="true" className="size-4 text-ink" strokeWidth={2.25} /> : null}
        <p className="min-w-0 flex-1 text-caption font-semibold text-ink-65">{label}</p>
        {foods.length > 0 ? (
          <p className={cn('text-[15px] font-bold tabular-nums', undone ? 'text-ink-65 line-through' : 'text-ink')}>
            {foods.some((f) => f.estimated) ? '~' : ''}{fmt(total)} kcal
          </p>
        ) : null}
      </div>
      {foods.length > 0 ? <FoodRows foods={foods} sharedMeal={sharedMeal} struck={undone} /> : null}
      {body ? <div className="px-4 pb-4">{body}</div> : null}
      {kind === 'saved' || accepted ? (
        <Link href="/plans" className="flex h-btn items-center justify-center border-t border-ink-06 text-[15px] font-semibold text-ink active:bg-ink-04">
          Open plan
        </Link>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex border-t border-ink-06">
          {actions.map((action, i) => {
            const primary = kind === 'draft' && i === 0
            return (
              <button
                key={action}
                type="button"
                onClick={() => { void haptic('selection'); onAction?.(action) }}
                className={cn(
                  'flex h-btn flex-1 items-center justify-center gap-1.5 text-[15px] font-semibold transition-transform active:scale-[.97]',
                  primary ? 'bg-ink text-cream' : 'text-ink active:bg-ink-04',
                  i > 0 && 'border-l border-ink-06',
                )}
              >
                {/^undo$/i.test(action) ? <Undo2 aria-hidden="true" className="size-4" strokeWidth={2} /> : null}
                {LABELS[action.toLowerCase()] ?? action}
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
