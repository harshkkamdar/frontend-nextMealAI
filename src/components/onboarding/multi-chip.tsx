'use client'

import { cn } from '@/lib/utils'

export function MultiChip({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const noneValue = options.find((o) => o.toLowerCase() === 'none')

  function toggle(option: string) {
    if (selected.includes(option)) {
      // Deselect
      onChange(selected.filter((s) => s !== option))
    } else if (noneValue && option.toLowerCase() === 'none') {
      // Selecting "None" clears everything else
      onChange([option])
    } else {
      // Selecting a real option removes "None" if present
      const without = noneValue ? selected.filter((s) => s.toLowerCase() !== 'none') : selected
      onChange([...without, option])
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const isActive = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={isActive}
            className={cn(
              'h-9 rounded-full px-3 text-[13.5px] font-semibold',
              isActive
                ? 'bg-ink text-cream'
                : 'bg-ink-08 text-ink'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
