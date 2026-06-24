import { LayoutDashboard, Users, FolderOpen, HandCoins, Trophy } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'

const PORTAL_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/athletes', label: 'My Athletes', icon: <Users className="w-4 h-4" /> },
  { href: '/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
  { href: '/dues', label: 'Dues', icon: <HandCoins className="w-4 h-4" /> },
  { href: '/documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" /> },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('full_name, role').eq('id', auth.user.id).single()
    : { data: null }

  return (
    <div className="flex min-h-screen bg-clw-black-2">
      <DashboardNav
        title="Parent Portal"
        items={PORTAL_NAV}
        userName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
