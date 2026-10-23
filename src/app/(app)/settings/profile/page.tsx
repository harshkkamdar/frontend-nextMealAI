'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { ProfileForm } from '@/components/settings/profile-form'
import { PageHeader } from '@/components/ui/fiqr/page-header'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  return (
    <PageWrapper>
      <PageHeader title="Profile" onBack={() => router.push('/settings')} backLabel="Back to settings" />
      <ProfileForm />
    </PageWrapper>
  )
}
