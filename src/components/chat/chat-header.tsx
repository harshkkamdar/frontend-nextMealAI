'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { GeoAvatar } from '@/components/shared/geo-avatar'

export function ChatHeader({ sessionId }: { sessionId?: string }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-surface-hover transition-colors"
          aria-label="Back to chats"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <GeoAvatar state="default" size={36} />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-text-primary leading-tight">
            Geo
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[11px] text-success">Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}
