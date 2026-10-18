import Link from 'next/link'
import { ChevronRight, Inbox, Users, UserSquare2, Trophy, Wallet } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { reportEnvironmentReadiness } from '@/lib/alerts'
import { formatCents } from '@/lib/format/money'
import { reviewQueue } from '@/lib/documents/review-queue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminOverviewPage() {
  reportEnvironmentReadiness()
  const supabase = createAdminSupabase()

  const [{ count: familyCount }, { count: athleteCount }, { count: openTournaments }, { data: outstanding }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent').eq('is_active', true),
      supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('dues_payments').select('amount_cents, amount_paid_cents').in('status', ['pending', 'partial', 'overdue']),
    ])

  const outstandingCents = (outstanding ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)
  const toReview = (await reviewQueue(supabase)).length

  const stats = [
    { label: 'Active families', value: String(familyCount ?? 0), href: '/admin/families', icon: Users },
    { label: 'Active wrestlers', value: String(athleteCount ?? 0), href: '/admin/families', icon: UserSquare2 },
    { label: 'Open tournaments', value: String(openTournaments ?? 0), href: '/admin/tournaments', icon: Trophy },
    {
      label: 'Outstanding dues',
      value: formatCents(outstandingCents),
      href: '/admin/dues',
      icon: Wallet,
    },
  ]

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-clw-gold">Overview</h1>
      {toReview > 0 && (
        <Link
          href="/admin/review"
          className="mb-6 flex min-h-14 items-center gap-3 rounded-lg border border-clw-gold/30 bg-clw-gold/10 px-4 py-3 text-clw-white transition-colors hover:border-clw-gold/60"
        >
          <Inbox className="h-5 w-5 shrink-0 text-clw-gold" />
          <span className="text-base">
            <span className="font-semibold">{toReview}</span> {toReview === 1 ? 'upload' : 'uploads'} to review
            <span className="text-clw-gray"> (USA cards and birth certificates)</span>
          </span>
          <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-clw-gold" />
        </Link>
      )}
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
