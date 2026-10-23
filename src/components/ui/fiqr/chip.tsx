import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Selectable pill: 44px tall, ink when selected. Orange stays reserved for the screen's one primary action. */
export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'min-h-11 rounded-full px-4 text-[14px] font-semibold',
        selected ? 'bg-ink text-cream' : 'bg-ink-08 text-ink',
        className,
      )}
      {...props}
    />
  )
}
