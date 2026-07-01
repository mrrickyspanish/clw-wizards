import type { Metadata } from 'next'
import { LayoutDashboard, Users, Trophy } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'

const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/staff/athletes', label: 'Athletes', icon: <Users className="w-4 h-4" /> },
  { href: '/staff/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('full_name, role').eq('id', auth.user.id).single()
    : { data: null }

  return (
    <div className="flex min-h-screen bg-clw-black-2">
      <DashboardNav title="Staff" items={STAFF_NAV} userName={profile?.full_name ?? null} role={profile?.role ?? null} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
