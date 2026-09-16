import type { Metadata } from 'next'

import { PrivacyContent } from '@/content/legal/privacy'

export const metadata: Metadata = {
  title: 'Privacy policy · FIQR',
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
