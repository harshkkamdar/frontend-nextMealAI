'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary px-4 pt-4 pb-2">{title}</p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

export function SettingsRow({
  label,
  value,
  onClick,
  destructive,
  children,
}: {
  label: string
  value?: string
  onClick?: () => void
  destructive?: boolean
  children?: React.ReactNode
}) {
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-sm transition-colors',
        onClick && 'cursor-pointer hover:bg-surface-hover',
        destructive && 'text-destructive'
      )}
    >
      <span className={cn('font-medium', destructive ? 'text-destructive' : 'text-text-primary')}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        {value && !children && (
          <span className="text-text-secondary">{value}</span>
        )}
        {children}
        {onClick && !children && (
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        )}
      </div>
    </Comp>
  )
}
