'use client'

import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { PlanChangelog } from '@/components/plans/plan-changelog'
import { formatDateRange, statusLabel } from '@/components/plans/plan-format'
import { goBack } from '@/lib/navigation'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { spring } from '@/lib/motion'
import type { Plan } from '@/types/plans.types'

/** Shared frame of both plan details: pushed header with an edit action, the plan name, history, and "make active". */
export function PlanDetailFrame({ plan, kind, fallbackTitle, activating, onActivate, children }: {
  plan: Plan
  kind: string
  fallbackTitle: string
  activating: boolean
  onActivate: () => void
  children: ReactNode
}) {
  const router = useRouter()
  const reduce = useReducedMotion()
  // Everything under the days glides (transform) when a day opens or closes, instead of jumping.
  const glide = reduce ? { duration: 0 } : spring.glide
  return (
    <div className="pb-6">
      <PushedHeader
        title={kind}
        onBack={() => goBack(router, '/plans')}
        actions={<RoundButton aria-label="Edit plan" onClick={() => router.push(`/plans/edit?id=${plan.id}`)}><Pencil strokeWidth={1.75} /></RoundButton>}
      />
      <div className="-mx-4"><OfflineBand /></div>
      <header className="px-1 pt-2">
        <h1 className="font-wide break-words text-[30px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">{plan.content.name || fallbackTitle}</h1>
        <p className="mt-1.5 text-[15px] text-ink-65">{statusLabel(plan.status)} · {formatDateRange(plan.start_date, plan.end_date)}</p>
      </header>
      <LayoutGroup>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
      <motion.div layout="position" transition={glide}>
      {plan.content.notes ? (
        <section className="mt-8">
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-65">Notes</h2>
          <p className="rounded-[24px] bg-card p-5 text-[15.5px] leading-[1.5] text-ink shadow-[var(--shadow-card)]">{plan.content.notes}</p>
        </section>
      ) : null}
      <div className="mt-8"><PlanChangelog planId={plan.id} /></div>
      {plan.status !== 'active' ? (
        <PrimaryButton type="button" className="mt-6 h-[56px] rounded-full py-0" onClick={onActivate} disabled={activating} aria-busy={activating || undefined}>
          {activating ? 'Making it active…' : 'Make this my plan'}
        </PrimaryButton>
      ) : null}
      </motion.div>
      </LayoutGroup>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-5 px-1 text-[13px] font-semibold text-ink-65 first:mt-0">{children}</h2>
}
