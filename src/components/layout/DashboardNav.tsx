'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { ORG } from '@/config/org.config'

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
        <p className="text-lg font-display text-clw-gold">{ORG.shortName}</p>
        <p className="text-xs text-clw-gray">{title}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-clw-gold/10 text-clw-gold' : 'text-clw-white/70 hover:bg-clw-gold/5 hover:text-clw-white'
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
            <p className="text-xs text-clw-gray capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-clw-white/60 hover:text-clw-gold transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
