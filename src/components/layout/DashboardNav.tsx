'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { ORG } from '@/config/org.config'
import { ThemeToggle } from './ThemeToggle'

export interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

interface DashboardNavProps {
  title: string
  items: NavItem[]
  userName: string | null
  role: string | null
}

export function DashboardNav({ title, items, userName, role }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-64 flex-col bg-clw-black border-r border-clw-gold/10">
      <div className="p-6 border-b border-clw-gold/10">
        <p className="text-lg font-display text-clw-gold-ink">{ORG.shortName}</p>
        <p className="text-sm text-clw-gray">{title}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          // Only the closest match is current: "/admin" (Overview) contains every
          // admin page, so a plain prefix check lit it up everywhere.
          const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
          const closest = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]
          const isActive = closest?.href === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-clw-gold/10 text-clw-gold-ink' : 'text-clw-white/70 hover:bg-clw-gold/5 hover:text-clw-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-clw-gold/10">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-clw-white truncate">{userName ?? 'User'}</p>
            <p className="text-sm text-clw-gray capitalize">{role}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-clw-white/60 transition-colors hover:text-clw-gold-ink"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
