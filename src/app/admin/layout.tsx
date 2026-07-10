import type { Metadata } from 'next'
import { LayoutDashboard, Users, Trophy, Megaphone, HandCoins, Handshake, CalendarClock } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'
import { AdminMobileNav } from '@/components/layout/AdminMobileNav'

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/families', label: 'Families', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
  { href: '/admin/practices', label: 'Practices & Events', icon: <CalendarClock className="w-4 h-4" /> },
  { href: '/admin/dues', label: 'Dues', icon: <HandCoins className="w-4 h-4" /> },
  { href: '/admin/sponsors', label: 'Sponsors', icon: <Handshake className="w-4 h-4" /> },
  { href: '/admin/communications', label: 'Communications', icon: <Megaphone className="w-4 h-4" /> },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('full_name, role').eq('id', auth.user.id).single()
    : { data: null }

  return (
    <div className="flex min-h-[100dvh] bg-clw-black-2">
      <DashboardNav title="Admin" items={ADMIN_NAV} userName={profile?.full_name ?? null} role={profile?.role ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav userName={profile?.full_name ?? null} role={profile?.role ?? null} />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
