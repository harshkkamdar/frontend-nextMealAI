import { GuestOnly } from '@/components/auth/guest-only'
import { WelcomeBeats } from '@/components/welcome/welcome-beats'

export default function WelcomePage() {
  return <GuestOnly><WelcomeBeats /></GuestOnly>
}
