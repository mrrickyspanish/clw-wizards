import { LayoutDashboard, Users, Trophy } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'

const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Overview', icon: LayoutDashboard },
  { href: '/staff/athletes', label: 'Athletes', icon: Users },
  { href: '/staff/tournaments', label: 'Tournaments', icon: Trophy },
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
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
