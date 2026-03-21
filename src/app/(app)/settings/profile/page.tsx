'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { ProfileForm } from '@/components/settings/profile-form'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  return (
    <PageWrapper>
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-1 text-sm text-text-secondary mb-4 hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        More
      </button>
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-6">Profile</h1>
      <ProfileForm />
    </PageWrapper>
  )
}
