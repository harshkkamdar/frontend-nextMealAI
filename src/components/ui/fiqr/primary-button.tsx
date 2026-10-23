import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

export function PrimaryButton({ icon, trailing, children, className, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={cn('w-full bg-accent text-cream rounded-[18px] px-[18px] py-4 font-bold text-[19px] flex items-center gap-[13px] shadow-[var(--shadow-action)] disabled:bg-ink-08 disabled:text-ink-35 disabled:shadow-none', className)}
      {...props}
    >
      {icon ? (
        <span className="w-8 h-8 rounded-full bg-cream-22 flex items-center justify-center text-[20px] font-semibold leading-none">
          {icon}
        </span>
      ) : null}
      {children}
      {trailing ? <span className="ml-auto text-[13.5px] font-semibold text-ink">{trailing}</span> : null}
    </button>
  )
}
