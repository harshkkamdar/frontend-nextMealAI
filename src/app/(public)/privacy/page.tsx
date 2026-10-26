import type { Metadata } from 'next'

import { PrivacyContent } from '@/content/legal/privacy'
import { PageContents } from '../_components/page-contents'

export const metadata: Metadata = {
  title: 'Privacy policy · FIQR',
}

export default function PrivacyPage() {
  return (
    <main>
      <PageContents />
      <PrivacyContent />
    </main>
  )
}
