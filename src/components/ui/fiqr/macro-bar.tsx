interface MacroBarProps {
  name: 'Calories' | 'Protein' | 'Carbs' | 'Fat'
  current: number
  target: number
  unit?: 'g'
}

const fillColors: Record<MacroBarProps['name'], string> = {
  Calories: 'bg-accent',
  Protein: 'bg-ink',
  Carbs: 'bg-macro-teal',
  Fat: 'bg-macro-ochre',
}

export function MacroBar({ name, current, target, unit }: MacroBarProps) {
  const c = Math.round(current)
  const t = Math.round(target)
  const left = Math.max(t - c, 0)
  const over = c - t
  const fillWidth = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15.5px] font-semibold text-ink">{name}</span>
        <span className="text-[13.5px] whitespace-nowrap">
          <b className="font-semibold text-ink">{c}</b>
          <span className="text-ink-65"> / {t}{unit}</span>
          {' · '}
          {t <= 0 ? (
            <span className="text-ink-65">no target yet</span>
          ) : c > t ? (
            <span className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-[3px]">{over}{unit} over</span>
          ) : name === 'Calories' ? (
            <span className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-[3px]">{left} left</span>
          ) : (
            <span className="text-ink-65">{left}{unit} left</span>
          )}
        </span>
      </div>
      <div className="mt-[6px] h-[7px] rounded-[4px] bg-ink-10 overflow-hidden">
        <div
          data-slot="macro-bar-fill"
          className={`h-full ${fillColors[name]}`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
    </div>
  )
}
