import { createAdminSupabase } from '@/lib/supabase/admin'
import type { DuesPayment, Profile, Athlete } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_STYLES: Record<DuesPayment['status'], string> = {
  paid: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  partial: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  pending: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  overdue: 'border-red-500/40 bg-red-500/10 text-red-400',
  waived: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminDuesPage() {
  const supabase = createAdminSupabase()

  const [{ data: dues, error }, { data: parents }, { data: athletes }] = await Promise.all([
    supabase
      .from('dues_payments')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'parent'),
    supabase.from('athletes').select('id, first_name, last_name'),
  ])

  const parentById = new Map(
    ((parents ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]).map((p) => [p.id, p])
  )
  const athleteById = new Map(
    ((athletes ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name'>[]).map((a) => [a.id, a])
  )

  const rows = (dues ?? []) as DuesPayment[]

  // Waived rows are intentionally excluded from billed/outstanding totals —
  // they're money the club chose not to collect, not money still owed.
  const billable = rows.filter((d) => d.status !== 'waived')
  const totalBilled = billable.reduce((sum, d) => sum + d.amount_cents, 0)
  const totalCollected = rows.reduce((sum, d) => sum + d.amount_paid_cents, 0)
  const totalOutstanding = billable.reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Dues</h1>
        <p className="text-sm text-clw-gray">Every dues record across the club. Waivers and payment plans are a follow-up build.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{money(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{money(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Total billed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{money(totalBilled)}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load dues: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No dues records yet.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Family</TableHead>
                <TableHead className="text-clw-gray">Athlete</TableHead>
                <TableHead className="text-clw-gray">Season</TableHead>
                <TableHead className="text-clw-gray">Amount</TableHead>
                <TableHead className="text-clw-gray">Paid</TableHead>
                <TableHead className="text-clw-gray">Due</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const parent = parentById.get(d.parent_id)
                const athlete = d.athlete_id ? athleteById.get(d.athlete_id) : undefined
                return (
                  <TableRow key={d.id} className="border-clw-gold/10">
                    <TableCell>
                      <span className="font-medium text-clw-white">{parent?.full_name ?? 'Unknown parent'}</span>
                      <span className="block text-xs text-clw-gray/70">{parent?.email ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-clw-gray">
                      {athlete ? `${athlete.first_name} ${athlete.last_name}` : '—'}
                    </TableCell>
                    <TableCell className="text-clw-gray">{d.season}</TableCell>
                    <TableCell className="text-clw-white">{money(d.amount_cents)}</TableCell>
                    <TableCell className="text-clw-gray">{money(d.amount_paid_cents)}</TableCell>
                    <TableCell className="text-clw-gray">{formatDate(d.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[d.status]}>
                        {d.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
