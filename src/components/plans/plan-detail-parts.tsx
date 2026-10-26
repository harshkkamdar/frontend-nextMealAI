'use client'

import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { OfflineBand } from '@/components/shared/offline-band'
import { PlanChangelog } from '@/components/plans/plan-changelog'
import { timeLeft } from '@/components/plans/plan-overview-card'
import { formatDateRange, statusLabel } from '@/components/plans/plan-format'
import { Busy, CARD, Dock, DockSpacer, ORANGE_BUTTON, SectionHeading } from '@/components/plans/spatial-parts'
import { PushedHeader } from '@/components/layout/screen-header'
import { goBack } from '@/lib/navigation'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { spring } from '@/lib/motion'
import type { Plan } from '@/types/plans.types'

/** "Active until 30 Nov, 5 weeks left", "Active, no end date", "Ended 25 Aug". */
export function planSubtitle(plan: Plan, today = new Date()): string {
  const end = plan.end_date ? formatDateRange(undefined, plan.end_date).replace('Until ', '') : null
  if (plan.status === 'active') {
    const left = timeLeft(plan.end_date, today)
    return end ? `Active until ${end}${left ? `, ${left.charAt(0).toLowerCase()}${left.slice(1)}` : ''}` : 'Active, no end date'
  }
  if (plan.status === 'draft') return 'Draft'
  return end ? `Ended ${end}` : statusLabel(plan.status)
}

/** Shared frame of both plan views: large title with the plan name, an edit action, notes, history, and "make active". */
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
  const inactive = plan.status !== 'active'
  return (
    <div>
      <PushedHeader
        large
        title={plan.content.name || fallbackTitle}
        barTitle={kind}
        subtitle={planSubtitle(plan)}
        onBack={() => goBack(router, '/plans')}
        backLabel="Back to plans"
        actions={<RoundButton aria-label="Edit plan" onClick={() => router.push(`/plans/edit?id=${plan.id}`)}><Pencil strokeWidth={1.75} /></RoundButton>}
      />
      <div className="-mx-4 mt-3"><OfflineBand /></div>
      <LayoutGroup>
        <div className="mt-4 flex flex-col">{children}</div>
        <motion.div layout="position" transition={glide}>
          {plan.content.notes ? (
            <section>
              <SectionHeading>Notes</SectionHeading>
              <p className={`${CARD} whitespace-pre-line p-4 text-body leading-[1.45] text-ink`}>{plan.content.notes}</p>
            </section>
          ) : null}
          <PlanChangelog planId={plan.id} />
          {inactive ? <DockSpacer /> : <div aria-hidden="true" className="h-[var(--tabbar-clearance)]" />}
        </motion.div>
      </LayoutGroup>
      {inactive ? (
        <Dock>
          <button type="button" className={ORANGE_BUTTON} onClick={onActivate} disabled={activating} aria-busy={activating || undefined}>
            {activating ? <Busy>Making it your plan</Busy> : 'Make this my plan'}
          </button>
        </Dock>
      ) : null}
    </div>
  )
}

export { SectionHeading as SectionTitle }
