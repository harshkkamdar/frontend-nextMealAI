import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

export function PrimaryButton({ icon, trailing, children, className, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={cn('w-full min-h-btn bg-accent text-cream rounded-full px-[18px] py-2 font-bold text-body flex items-center gap-3 disabled:bg-ink-08 disabled:text-ink-35 transition-[background-color,color,transform] duration-200 enabled:active:scale-[.97] enabled:active:duration-75', !icon && 'justify-center', className)}
      {...props}
    >
      {icon ? (
        <span className="w-8 h-8 rounded-full bg-cream-22 flex items-center justify-center text-[20px] font-semibold leading-none">
          {icon}
        </span>
      ) : null}
      {children}
      {trailing ? <span className="ml-auto text-caption font-semibold text-ink">{trailing}</span> : null}
    </button>
  )
}
