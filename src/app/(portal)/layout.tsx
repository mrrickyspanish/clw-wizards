import type { Metadata } from 'next'
import { LayoutDashboard, Users, FolderOpen, HandCoins, Trophy, User } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { ThemeScope } from '@/components/layout/ThemeScope'

const PORTAL_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/athletes', label: 'My Athletes', icon: <Users className="w-4 h-4" /> },
  { href: '/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
  { href: '/dues', label: 'Dues', icon: <HandCoins className="w-4 h-4" /> },
  { href: '/documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('full_name, role').eq('id', auth.user.id).single()
    : { data: null }

  return (
    <ThemeScope className="flex min-h-[100dvh] bg-clw-black-2">
      <DashboardNav
        title="Parent Portal"
        items={PORTAL_NAV}
        userName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar name={profile?.full_name ?? null} />
        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">{children}</main>
      </div>
      <MobileTabBar />
    </ThemeScope>
  )
}
