import { createServerSupabase } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactPrefsForm } from './ContactPrefsForm'

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()

  const [{ data: athletes }, { data: dues }, { data: profile }] = await Promise.all([
    supabase.from('athletes').select('id, first_name, last_name, practice_group').eq('parent_id', auth.user?.id ?? ''),
    supabase
      .from('dues_payments')
      .select('amount_cents, amount_paid_cents')
      .eq('parent_id', auth.user?.id ?? '')
      .in('status', ['pending', 'partial', 'overdue']),
    supabase.from('profiles').select('phone, sms_opt_in').eq('id', auth.user?.id ?? '').single(),
  ])

  const outstandingCents = (dues ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-clw-gold">Welcome back</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">My Athletes</CardTitle>
          </CardHeader>
          <CardContent>
            {athletes?.length ? (
              <ul className="space-y-1 text-clw-white">
                {athletes.map((a) => (
                  <li key={a.id}>
                    {a.first_name} {a.last_name} — {a.practice_group}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-clw-gray text-sm">No athletes on file yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Dues Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">${(outstandingCents / 100).toFixed(2)}</p>
            <p className="text-xs text-clw-gray mt-1">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-clw-gold/10 bg-clw-black sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-clw-gray">Contact & SMS preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactPrefsForm initialPhone={profile?.phone ?? null} initialSmsOptIn={profile?.sms_opt_in ?? false} />
        </CardContent>
      </Card>
    </div>
  )
}
