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
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              isActive
                ? 'bg-accent border-accent text-white'
                : 'bg-surface border-border text-text-primary hover:bg-surface-hover'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
