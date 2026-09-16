import { SignupForm } from '@/components/auth/signup-form'
import { GuestOnly } from '@/components/auth/guest-only'

export default function SignupPage() {
  return <GuestOnly><SignupForm /></GuestOnly>
}
