'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Plus, CalendarDays, MoreHorizontal } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  { type: 'fab' as const },
  { icon: CalendarDays, label: 'Plans', href: '/plans' },
  { icon: MoreHorizontal, label: 'More', href: '/settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  // Hide on active chat view (e.g. /chat/abc123)
  if (pathname.match(/^\/chat\/.+/)) return null

  const handleFabClick = () => {
    useUIStore.getState().openSheet('quick-log')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-xl border-t border-border">
      <div className="max-w-md mx-auto flex items-end justify-around px-2 pt-2 pb-2">
        {navItems.map((item, index) => {
          if ('type' in item && item.type === 'fab') {
            return (
              <button
                key="fab"
                onClick={handleFabClick}
                className="-mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg shadow-accent/30 active:scale-95 transition-transform"
                aria-label="Quick log"
              >
                <Plus className="w-6 h-6" />
              </button>
            )
          }

          const navItem = item as { icon: typeof Home; label: string; href: string }
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
