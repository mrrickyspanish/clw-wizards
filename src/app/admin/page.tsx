import Link from 'next/link'
import { Users, UserSquare2, Trophy, Wallet } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminOverviewPage() {
  const supabase = createAdminSupabase()

  const [{ count: familyCount }, { count: athleteCount }, { count: openTournaments }, { data: outstanding }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent').eq('is_active', true),
      supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('dues_payments').select('amount_cents, amount_paid_cents').in('status', ['pending', 'partial', 'overdue']),
    ])

  const outstandingCents = (outstanding ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  const stats = [
    { label: 'Active families', value: String(familyCount ?? 0), href: '/admin/families', icon: Users },
    { label: 'Active wrestlers', value: String(athleteCount ?? 0), href: '/admin/families', icon: UserSquare2 },
    { label: 'Open tournaments', value: String(openTournaments ?? 0), href: '/admin/tournaments', icon: Trophy },
    {
      label: 'Outstanding dues',
      value: `$${(outstandingCents / 100).toFixed(2)}`,
      href: '/admin/dues',
      icon: Wallet,
    },
  ]

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-clw-gold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="lift h-full border-clw-gold/10 bg-clw-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-clw-gray">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-clw-gold" />
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl text-clw-white">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
