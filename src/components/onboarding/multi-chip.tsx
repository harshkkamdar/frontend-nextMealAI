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
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
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
