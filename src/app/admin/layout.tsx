import type { Metadata } from 'next'
import {
  CalendarClock,
  ClipboardCheck,
  FileText,
  HandCoins,
  Handshake,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'

import { getSessionRole } from '@/lib/auth/session'
import { createServerSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'
import { AdminMobileNav } from '@/components/layout/AdminMobileNav'

// `fullOnly` items are shown only to full admins; limited admins never see the
// website-content editor or the team manager (and middleware blocks the routes).
type AdminNavItem = NavItem & { fullOnly?: boolean }

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/families', label: 'Families', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/registrations', label: 'Registrations', icon: <ClipboardCheck className="w-4 h-4" /> },
  { href: '/admin/tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
  { href: '/admin/practices', label: 'Practices & Events', icon: <CalendarClock className="w-4 h-4" /> },
  { href: '/admin/dues', label: 'Dues', icon: <HandCoins className="w-4 h-4" /> },
  { href: '/admin/sponsors', label: 'Sponsors', icon: <Handshake className="w-4 h-4" /> },
  { href: '/admin/content', label: 'Website content', icon: <FileText className="w-4 h-4" />, fullOnly: true },
  { href: '/admin/communications', label: 'Communications', icon: <Megaphone className="w-4 h-4" /> },
  { href: '/admin/team', label: 'Admin team', icon: <ShieldCheck className="w-4 h-4" />, fullOnly: true },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { role, adminScope, fullName, canAccessParentPortal } = await getSessionRole(supabase)

  const isFullAdmin = role === 'admin' && adminScope === 'full'
  const navItems: NavItem[] = ADMIN_NAV.filter((item) => isFullAdmin || !item.fullOnly).map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
  }))

  if (canAccessParentPortal) {
    navItems.push({ href: '/dashboard', label: 'Parent Portal', icon: <UsersRound className="w-4 h-4" /> })
  }

  return (
    <div className="flex min-h-[100dvh] bg-clw-black-2">
      <DashboardNav title="Admin" items={navItems} userName={fullName} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav
          userName={fullName}
          role={role}
          isFullAdmin={isFullAdmin}
          canAccessParentPortal={canAccessParentPortal}
        />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
