import { createAdminSupabase } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminOverviewPage() {
  const supabase = createAdminSupabase()

  const [{ count: familyCount }, { count: openTournaments }, { count: outstandingDues }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent').eq('is_active', true),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase
      .from('dues_payments')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'partial', 'overdue']),
  ])

  const stats = [
    { label: 'Active families', value: familyCount ?? 0 },
    { label: 'Open tournaments', value: openTournaments ?? 0 },
    { label: 'Outstanding dues', value: outstandingDues ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-display text-clw-gold mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-clw-gold/10 bg-clw-black">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-clw-gray">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display text-clw-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
