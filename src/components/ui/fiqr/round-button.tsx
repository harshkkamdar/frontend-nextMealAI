import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * 44 pt round control on the glass layer (back, close, header actions). Needs an aria-label.
 * `flat`: no glass or shadow, for screens with nothing scrolling underneath (onboarding).
 */
export function RoundButton({ className, flat, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string; flat?: boolean }) {
  return (
    <button
      type="button"
      className={cn(flat ? 'bg-card outline outline-1 -outline-offset-1 outline-ink-08' : 'glass-btn', 'grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.94] [&_svg]:size-5', className)}
      {...props}
    />
  )
}
