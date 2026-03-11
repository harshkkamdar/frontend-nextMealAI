'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { Home, MessageCircle, Calendar, ClipboardList, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/plans', label: 'Plans', icon: Calendar, comingSoon: true },
  { href: '/logs', label: 'Logs', icon: ClipboardList, comingSoon: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg md:relative md:shadow-none">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          if (item.comingSoon) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => toast.info('Coming soon!')}
                className="flex-1 flex flex-col items-center justify-center py-3 min-h-[60px] gap-0.5 opacity-50"
              >
                <Icon size={22} className="text-nav-inactive" />
                <span className="text-xs text-nav-inactive">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[60px] gap-0.5 transition-colors ${
                isActive ? 'text-nav-active' : 'text-nav-inactive'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-brand' : 'text-nav-inactive'} />
              <span className={`text-xs font-medium ${isActive ? 'text-brand' : 'text-nav-inactive'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
