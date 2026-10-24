import { GuestOnly } from '@/components/auth/guest-only'
import { WelcomeCarousel } from '@/components/welcome/welcome-carousel'

export default function WelcomePage() {
  return <GuestOnly><WelcomeCarousel /></GuestOnly>
}
