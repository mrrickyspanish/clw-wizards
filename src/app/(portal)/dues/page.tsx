import { createServerSupabase } from '@/lib/supabase/server'
import type { DuesPayment, Athlete } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PayButton } from './PayButton'

const STATUS_STYLES: Record<DuesPayment['status'], string> = {
  paid: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink',
  partial: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  pending: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  overdue: 'border-red-500/40 bg-red-500/10 text-red-400',
  waived: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
}

const PAYABLE: DuesPayment['status'][] = ['pending', 'partial', 'overdue']

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DuesPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  const [{ data: dues, error }, { data: athletes }] = await Promise.all([
    supabase.from('dues_payments').select('*').eq('parent_id', userId).order('created_at', { ascending: false }),
    supabase.from('athletes').select('id, first_name, last_name').eq('parent_id', userId),
  ])

  const athleteById = new Map(
    ((athletes ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name'>[]).map((a) => [a.id, a])
  )

  const rows = (dues ?? []) as DuesPayment[]
  const outstandingCents = rows
    .filter((d) => PAYABLE.includes(d.status))
    .reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-clw-gold-ink">Dues</h1>
        <p className="text-sm text-clw-gray">Your club dues and payment history.</p>
      </div>

      {checkout === 'success' && (
        <Alert className="border-clw-gold/40 bg-clw-gold/10">
          <AlertDescription className="text-clw-gold-ink">
            Payment received, thank you! Your balance updates in a moment once the payment is confirmed.
          </AlertDescription>
        </Alert>
      )}
      {checkout === 'cancelled' && (
        <Alert>
          <AlertDescription className="text-clw-gray">Checkout cancelled. No payment was made.</AlertDescription>
        </Alert>
      )}

      <Card className="border-clw-gold/10 bg-clw-black-3 sm:max-w-xs">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-clw-gray">Outstanding balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display text-clw-white">{money(outstandingCents)}</p>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load dues: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black-3 p-10 text-center">
          <p className="text-clw-gray">No dues on file yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((d) => {
          const athlete = d.athlete_id ? athleteById.get(d.athlete_id) : undefined
          const remaining = d.amount_cents - d.amount_paid_cents
          const payable = PAYABLE.includes(d.status) && remaining > 0
          const dueDate = formatDate(d.due_date)
          return (
            <Card key={d.id} className="border-clw-gold/10 bg-clw-black-3">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-clw-white">{d.season} dues</span>
                    <Badge variant="outline" className={STATUS_STYLES[d.status]}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-clw-gray">
                    {athlete ? `${athlete.first_name} ${athlete.last_name} · ` : ''}
                    {money(d.amount_cents)}
                    {d.amount_paid_cents > 0 && ` · ${money(d.amount_paid_cents)} paid`}
                    {dueDate && ` · due ${dueDate}`}
                  </p>
                </div>
                {payable ? (
                  <PayButton duesId={d.id} label={`Pay ${money(remaining)}`} />
                ) : (
                  <span className="text-sm text-clw-gray/70">
                    {d.status === 'paid' ? 'Paid in full' : d.status === 'waived' ? 'Waived' : '—'}
                  </span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
