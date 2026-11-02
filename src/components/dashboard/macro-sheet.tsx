'use client'

import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { INK_BUTTON } from '@/components/plans/spatial-parts'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { computeMacroContributions, type MacroKey } from '@/lib/macros'
import { cn } from '@/lib/utils'
import type { Log } from '@/types/logs.types'
import { CarbsIcon, FatIcon, FlameIcon, ProteinIcon } from './home-icons'

/** Each macro's hue (brand colour or its macro colour). */
const MACROS: Record<MacroKey, { label: string; unit: string; hue: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  calories: { label: 'Calories', unit: 'kcal', hue: 'var(--color-accent)', icon: FlameIcon },
  protein: { label: 'Protein', unit: 'g', hue: 'var(--color-ink)', icon: ProteinIcon },
  carbs: { label: 'Carbs', unit: 'g', hue: 'var(--color-macro-teal)', icon: CarbsIcon },
  fat: { label: 'Fat', unit: 'g', hue: 'var(--color-macro-ochre)', icon: FatIcon },
}
const ORDER: MacroKey[] = ['calories', 'protein', 'carbs', 'fat']
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** Today's breakdown: one sheet for all four, switched in place; total against target, then each food biggest first. */
export function MacroSheet({ open, macro, foodLogs, targets, onClose, onLogMeal }: {
  open: boolean
  macro: MacroKey
  foodLogs: readonly Log[]
  targets: Record<MacroKey, number>
  onClose: () => void
  onLogMeal: () => void
}) {
  const [picked, setPicked] = useState<MacroKey>(macro)
  const [openedWith, setOpenedWith] = useState<MacroKey | null>(null)
  // Each opening starts on the macro that was tapped.
  if (open && openedWith !== macro) { setOpenedWith(macro); setPicked(macro) }
  if (!open && openedWith !== null) setOpenedWith(null)

  const rows = useMemo(() => computeMacroContributions(foodLogs, picked), [foodLogs, picked])
  const m = MACROS[picked]
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const target = targets[picked]
  const left = target - total
  const top = rows[0]?.value || 1

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Today's breakdown">
      <div className="flex min-h-0 flex-col gap-4 px-5 pb-5 pt-2">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.4px] text-ink">Today&apos;s breakdown</h2>
        <div role="group" aria-label="Nutrient" className="flex gap-1 rounded-full bg-ink-06 p-1">
          {ORDER.map((key) => {
            const { label, hue, icon: TabIcon } = MACROS[key]
            const on = key === picked
            return (
              <button key={key} type="button" aria-pressed={on} onClick={() => setPicked(key)} className={cn('flex h-11 flex-auto items-center justify-center gap-1 rounded-full px-2 text-[12px] font-semibold transition-[background-color,color] duration-200', on ? 'bg-card text-ink shadow-[var(--shadow-card)]' : 'text-ink-65')}>
                <TabIcon className="size-3.5 shrink-0" style={{ color: hue }} />{label}
              </button>
            )
          })}
        </div>
        {/* Switching macro crossfades old and new bodies stacked in one cell (200 ms), and the body keeps a three-row
            floor, so neither the content nor the sheet's height hard-cuts. */}
        <div className="grid min-h-0">
          <AnimatePresence initial={false}>
            <motion.div key={picked} className="col-start-1 row-start-1 flex min-h-[300px] flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <div className="rounded-[16px] border border-ink-12 bg-card p-4">
            <p className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">{fmt(total)}</span>
              <span className="text-[13px] font-medium text-ink-62">{m.unit}</span>
            </p>
            {target > 0 ? (
              <>
                <p className="mt-1.5 text-[13.5px] text-ink-65 tabular-nums">of {fmt(target)} {m.unit} · <span className="font-semibold text-ink">{fmt(Math.abs(left))} {m.unit} {left < 0 ? 'over' : 'left'}</span></p>
                <span className="mt-3 block h-[9px] overflow-hidden rounded-[5px] bg-ink-10" aria-hidden="true">
                  <span className="bar-fill block h-full" style={{ width: `${Math.min(100, (total / target) * 100)}%`, background: m.hue }} />
                </span>
              </>
            ) : <p className="mt-1 text-caption text-ink-65">No target set yet</p>}
          </div>
          {rows.length === 0 ? (
            <>
              <p className="text-body-sm text-ink-65">Nothing logged today. What you eat shows here, biggest first.</p>
              <button type="button" className={INK_BUTTON} onClick={onLogMeal}>Log a meal</button>
            </>
          ) : (
            <ul className="-mx-1 max-h-[42dvh] overflow-y-auto px-1" aria-label={`${m.label} by food`}>
              {rows.map((row) => (
                <li key={row.id} className="flex min-h-row items-center gap-3 border-b border-ink-06 py-2 last:border-b-0">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: m.hue }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-body-sm text-ink">{row.name}</span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink-06" aria-hidden="true">
                      <span className="block h-full origin-left rounded-full" style={{ background: m.hue, transform: `scaleX(${row.value / top})` }} />
                    </span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <b className="text-body-sm font-bold text-ink">{fmt(row.value)}</b><span className="text-label text-ink-65"> {m.unit}</span>
                  </span>
                  <span className="w-10 shrink-0 text-right text-caption text-ink-65 tabular-nums">{row.pct}%</span>
                </li>
              ))}
            </ul>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BottomSheet>
  )
}
