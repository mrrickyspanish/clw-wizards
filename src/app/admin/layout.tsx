import type { Metadata } from 'next'
import { ReadOnlyBanner } from '@/components/demo/ReadOnlyBanner'
import { churchAllows, churchMenuOrder, churchRoleFor } from '@/lib/demo-roles'
import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import {
  CalendarClock,
  ClipboardCheck,
  Eye,
  FileText,
  Files,
  HandCoins,
  Handshake,
  Inbox,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  MapIcon,
  Trophy,
  Users,
} from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { reviewQueue } from '@/lib/documents/review-queue'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { DashboardNav, type NavItem } from '@/components/layout/DashboardNav'
import { AdminMobileNav } from '@/components/layout/AdminMobileNav'

// `fullOnly` items are shown only to full admins; limited admins never see the
// website-content editor or the team manager (and middleware blocks the routes).
type AdminNavItem = NavItem & { fullOnly?: boolean; churchOnly?: boolean }

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/families', label: 'Families', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/registrations', label: 'Registrations', icon: <ClipboardCheck className="w-4 h-4" /> },
  { href: '/admin/review', label: 'To review', icon: <Inbox className="w-4 h-4" /> },
  { href: '/admin/tournaments', label: 'Tournaments', icon: CHURCH_READ_ONLY ? <MapIcon className="w-4 h-4" /> : <Trophy className="w-4 h-4" /> },
  { href: '/admin/practices', label: 'Practices & Events', icon: <CalendarClock className="w-4 h-4" /> },
  { href: '/admin/dues', label: 'Dues', icon: <HandCoins className="w-4 h-4" /> },
  { href: '/admin/sponsors', label: 'Sponsors', icon: <Handshake className="w-4 h-4" /> },
  { href: '/admin/content', label: 'Website content', icon: <FileText className="w-4 h-4" />, fullOnly: true },
  // Church demo only: the Pages mock (SBC, Nov 20). Role access is narrowed by demo-roles.
  { href: '/admin/pages', label: 'Pages', icon: <Files className="w-4 h-4" />, churchOnly: true },
  { href: '/admin/communications', label: 'Communications', icon: <Megaphone className="w-4 h-4" /> },
  { href: '/admin/team', label: 'Admin team', icon: <ShieldCheck className="w-4 h-4" />, fullOnly: true },
  // The parent pages as families see them (an empty family for an admin).
  { href: '/dashboard', label: 'Parent view', icon: <Eye className="w-4 h-4" />, fullOnly: true },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('full_name, role, admin_scope').eq('id', auth.user.id).single()
    : { data: null }

  const isFullAdmin = profile?.role === 'admin' && profile?.admin_scope === 'full'
  // Uploads waiting on To review, for the menu badge.
  const reviewCount = profile?.role === 'admin' ? (await reviewQueue(supabase)).length : 0
  // Church demo staff roles narrow the menu further (SBC, Nov 20).
  const churchRole = churchRoleFor(auth.user?.email)
  const filtered = ADMIN_NAV.filter(
    (item) =>
      (isFullAdmin || !item.fullOnly) && (!item.churchOnly || CHURCH_READ_ONLY) && (!churchRole || churchAllows(churchRole, item.href))
  )
  const navItems: NavItem[] = (churchRole ? churchMenuOrder(churchRole, filtered) : filtered).map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    count: item.href === '/admin/review' ? reviewCount : undefined,
  }))

  return (
    <div className="flex min-h-[100dvh] bg-clw-black-2 print:bg-white">
      <DashboardNav
        title={churchRole ? churchRole.label : 'Admin'}
        items={navItems}
        userName={profile?.full_name ?? null}
        role={churchRole ? churchRole.label : (profile?.role ?? null)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav
          userName={profile?.full_name ?? null}
          role={churchRole ? churchRole.label : (profile?.role ?? null)}
          staffLabel={churchRole ? 'Staff' : undefined}
          isFullAdmin={isFullAdmin}
          reviewCount={reviewCount}
          allowedHrefs={churchRole ? navItems.map((item) => item.href) : undefined}
        />
        <ReadOnlyBanner roleLabel={churchRole?.label} />
        <main className="min-w-0 flex-1 p-4 md:p-8 print:p-0">{children}</main>
      </div>
    </div>
  )
}
