'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { LogList } from '@/components/logs/log-list'

export default function LogsPage() {
  return (
    <PageWrapper>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-4">Activity</h1>
      <LogList />
    </PageWrapper>
  )
}
