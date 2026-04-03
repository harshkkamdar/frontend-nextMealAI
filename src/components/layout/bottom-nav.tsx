'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, BookOpen, Dumbbell, MoreHorizontal } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { GeoAvatar } from '@/components/shared/geo-avatar'

const navItems = [
  { icon: House, label: 'Home', href: '/dashboard' },
  { icon: BookOpen, label: 'Diary', href: '/diary' },
  { type: 'geo' as const },
  { icon: Dumbbell, label: 'Activity', href: '/activity' },
  { icon: MoreHorizontal, label: 'More', href: '/settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  // Hide on active chat and workout follow screens
  if (pathname.match(/^\/chat\/.+/) || pathname.match(/^\/activity\/workout\/.+/)) return null

  const handleGeoTap = () => {
    useUIStore.getState().openSheet('geo-companion')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/92 backdrop-blur-xl border-t border-border">
      <div className="max-w-md mx-auto flex items-end justify-around px-2 pt-2 pb-2">
        {navItems.map((item) => {
          if ('type' in item && item.type === 'geo') {
            return (
              <button
                key="geo"
                onClick={handleGeoTap}
                className="-mt-6 flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                aria-label="Talk to Geo"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-accent-light shadow-lg shadow-accent/20 flex items-center justify-center ring-2 ring-background">
                    <GeoAvatar state="default" size={46} />
                  </div>
                </div>
                <span className="text-[10px] leading-tight text-accent font-medium mt-0.5">
                  Geo
                </span>
              </button>
            )
          }

          const navItem = item as { icon: typeof House; label: string; href: string }
          const Icon = navItem.icon
          const isActive = pathname === navItem.href || pathname.startsWith(navItem.href + '/')

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="flex flex-col items-center gap-0.5 min-w-[48px] py-1"
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? 'text-accent font-medium' : 'text-text-tertiary'
                }`}
              >
                {navItem.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
