import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onNavy?: boolean
  arrow?: boolean
}

export function SecondaryButton({ onNavy = false, arrow = false, children, className, ...props }: SecondaryButtonProps) {
  return (
    <button
      className={cn(
        'w-full h-14 rounded-[15px] bg-cream text-ink font-bold text-[18px] flex items-center justify-center gap-2 disabled:bg-ink-08 disabled:text-ink-35 disabled:border-0',
        !onNavy && 'border border-ink-16',
        className,
      )}
      {...props}
    >
      {children}
      {arrow ? <span className="text-[17px]">→</span> : null}
    </button>
  )
}
