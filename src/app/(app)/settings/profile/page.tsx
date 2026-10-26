'use client'

import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/settings/profile-form'
import { goBack } from '@/lib/navigation'

export default function ProfilePage() {
  const router = useRouter()
  return (
    <div className="mx-auto w-full max-w-md px-4">
      <ProfileForm onBack={() => goBack(router, '/settings')} />
    </div>
  )
}
