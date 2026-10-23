'use client'

import { SectionLabel } from '@/components/ui/fiqr/section-label'

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionLabel className="mb-2">{title}</SectionLabel>
      <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
        {children}
      </div>
    </section>
  )
}

function RowChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-ink-65"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function SettingsRow({
  label,
  value,
  onClick,
  children,
}: {
  label: string
  value?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  const content = (
    <>
      <span className="font-medium text-ink">{label}</span>
      <span className="flex items-center gap-2">
        {value && !children ? <span className="text-[13.5px] text-ink-65">{value}</span> : null}
        {children}
        {onClick && !children ? <RowChevron /> : null}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="min-h-14 w-full px-[14px] flex items-center justify-between text-left text-[15.5px]"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="min-h-14 px-[14px] flex items-center justify-between text-[15.5px]">
      {content}
    </div>
  )
}
