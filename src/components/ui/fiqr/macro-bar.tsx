import { cn } from '@/lib/utils'

interface MacroBarProps {
  name: 'Calories' | 'Protein' | 'Carbs' | 'Fat'
  current: number
  target: number
  unit?: 'g'
  /** Calories leads: a slightly heavier bar (DESIGN.md component 5). */
  lead?: boolean
  /** Opens the macro detail; the whole row becomes the target. */
  onClick?: () => void
}

const fillColors: Record<MacroBarProps['name'], string> = {
  Calories: 'bg-accent',
  Protein: 'bg-ink',
  Carbs: 'bg-macro-teal',
  Fat: 'bg-macro-ochre',
}

const fmt = (n: number) => n.toLocaleString('en-US')

/** George's macro bar: name and readout on one baseline, the bar 6 below, the fill capped at 100%. */
export function MacroBar({ name, current, target, unit, lead = false, onClick }: MacroBarProps) {
  const c = Math.round(current)
  const t = Math.round(target)
  const left = Math.max(t - c, 0)
  const fillWidth = target > 0 ? Math.min(100, (current / target) * 100) : 0

  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[15.5px] font-semibold text-ink">{name}</span>
        <span className="whitespace-nowrap text-[13.5px] tabular-nums">
          <b className="font-semibold text-ink">{fmt(c)}</b>
          <span className="text-ink-65"> / {fmt(t)}{unit}</span>
          <span className="text-ink-65"> · </span>
          {t <= 0 ? (
            <span className="text-ink-65">no target yet</span>
          ) : c > t ? (
            <span className="font-semibold text-accent-ink">{fmt(c - t)}{unit} over</span>
          ) : name === 'Calories' ? (
            <span className="font-semibold text-accent-ink">{fmt(left)} left</span>
          ) : (
            <span className="text-ink-65">{fmt(left)}{unit} left</span>
          )}
        </span>
      </span>
      <span className={cn('mt-[6px] block overflow-hidden rounded-[4px] bg-ink-10', lead ? 'h-[9px] rounded-[5px]' : 'h-[7px]')}>
        <span data-slot="macro-bar-fill" className={cn('bar-fill block h-full', fillColors[name])} style={{ width: `${fillWidth}%` }} />
      </span>
    </>
  )

  if (!onClick) return <div>{body}</div>
  return (
    <button type="button" onClick={onClick} aria-label={`${name}: ${fmt(c)} of ${fmt(t)}${unit ?? ''}, open details`} className="block w-full py-[2px] text-left transition-opacity active:opacity-60">
      {body}
    </button>
  )
}
