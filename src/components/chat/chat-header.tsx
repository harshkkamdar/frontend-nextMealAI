'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export function ChatHeader({ title }: { sessionId?: string; title?: string }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-30 border-b border-ink-10 bg-cream px-gutter py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/chat')}
          className="-ml-3 flex size-11 items-center justify-center rounded-full text-ink active:bg-ink-08"
          aria-label="Back to chats"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-[17px] font-bold leading-tight text-ink">Geo</span>
          <span className="truncate text-[13.5px] font-medium text-ink-65">
            {title ?? 'New conversation'}
          </span>
        </div>
      </div>
    </div>
  )
}
