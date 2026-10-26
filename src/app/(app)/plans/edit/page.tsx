'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { goBack } from '@/lib/navigation'
import { EditPlanView } from '@/components/plans/edit-plan-view'

export default function EditPlanPage() {
  return <Suspense fallback={null}><EditPlanRoute /></Suspense>
}

function EditPlanRoute() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  if (!id) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <PushedHeader title="Edit plan" onBack={() => goBack(router, '/plans')} backLabel="Back to plans" />
        <p className="mt-4 px-1 text-[15px] text-ink-65">No plan picked. <Link href="/plans" className="inline-flex min-h-11 items-center font-semibold text-ink underline">Back to plans</Link></p>
      </div>
    )
  }
  return <EditPlanView id={id} />
}
