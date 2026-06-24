import { LayoutDashboard, Users, Trophy, Megaphone, HandCoins, Handshake } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/families', label: 'Families', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
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
    <div className="flex min-h-screen bg-clw-black-2">
      <DashboardNav title="Admin" items={ADMIN_NAV} userName={profile?.full_name ?? null} role={profile?.role ?? null} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
