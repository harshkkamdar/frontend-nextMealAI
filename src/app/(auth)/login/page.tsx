import { LoginForm } from '@/components/auth/login-form'
import { GuestOnly } from '@/components/auth/guest-only'

export default function LoginPage() {
  return <GuestOnly><LoginForm /></GuestOnly>
}
