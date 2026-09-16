'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/stores/ui.store'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-6 h-6',
}

function HomeIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10h13V10M9.5 20v-6h5v6" />
    </svg>
  )
}

function FoodIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

function TrainIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />
    </svg>
  )
}

function CheckInIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M5 19V13M12 19V8M19 19V4" />
    </svg>
  )
}

const navItems = [
  { icon: HomeIcon, label: 'Home', href: '/dashboard' },
  { icon: FoodIcon, label: 'Food', href: '/food' },
  { icon: TrainIcon, label: 'Train', href: '/train' },
  { icon: CheckInIcon, label: 'Check-in', href: '/check-in' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/chat/session') || pathname.startsWith('/train/session')) return null

  const renderItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center gap-[5px] ${isActive ? 'text-accent' : 'text-ink-50'}`}
      >
        <Icon />
        <span className={`text-[10.5px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[100] bg-cream border-t border-ink-10">
      <div
        className="max-w-md mx-auto grid grid-cols-5 items-end px-2 pt-[10px]"
        style={{ paddingBottom: 'calc(22px + var(--safe-bottom))' }}
      >
        {renderItem(navItems[0])}
        {renderItem(navItems[1])}
        <div className="flex flex-col items-center">
          <button
            type="button"
            aria-label="Talk to Geo"
            onClick={() => useUIStore.getState().openSheet('geo-companion')}
            className="w-[52px] h-[52px] -mt-6 rounded-full bg-ink text-accent text-[19px] font-bold flex items-center justify-center shadow-[var(--shadow-raised)]"
          >
            G
          </button>
          <span className="mt-[6px] text-[10.5px] font-semibold text-ink-60">Geo</span>
        </div>
        {renderItem(navItems[2])}
        {renderItem(navItems[3])}
      </div>
    </nav>
  )
}
