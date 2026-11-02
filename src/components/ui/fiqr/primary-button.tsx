import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

export function PrimaryButton({ icon, trailing, children, className, ...props }: PrimaryButtonProps) {
  return (
    <button
      // George's primary action (DESIGN.md component 3): cream label at 19 pt bold, which passes AA on orange as large text.
      className={cn('w-full bg-accent text-cream rounded-[18px] px-[18px] py-[12px] font-bold text-[19px] leading-tight flex items-center gap-[13px] shadow-[var(--shadow-action)] disabled:bg-ink-08 disabled:text-ink-35 disabled:shadow-none transition-[background-color,color,transform] duration-200 enabled:active:scale-[.98] enabled:active:duration-75', icon ? 'min-h-[64px]' : 'min-h-btn justify-center', className)}
      {...props}
    >
      {icon ? (
        <span className="w-8 h-8 shrink-0 rounded-full bg-cream-22 flex items-center justify-center text-[20px] font-semibold leading-none">
          {icon}
        </span>
      ) : null}
      {children}
      {trailing ? <span className="ml-auto text-[13.5px] font-semibold text-ink">{trailing}</span> : null}
    </button>
  )
}
