import type { ReactNode } from 'react'
import { GeoAvatar } from '@/components/shared/geo-avatar'

export function GeoLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-[11px] items-start py-[14px]">
      <GeoAvatar size={24} />
      <div className="text-[15.5px] font-medium leading-[1.4] text-ink-80 line-clamp-2">{children}</div>
    </div>
  )
}
