'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Trophy, Wallet, User } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/athletes', label: 'Athletes', icon: Users },
  { href: '/tournaments', label: 'Events', icon: Trophy },
  { href: '/dues', label: 'Dues', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-clw-gold/10 bg-clw-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="flex">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] transition-colors ${
                  active ? 'text-clw-gold-ink' : 'text-clw-gray'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-clw-gold/15' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
