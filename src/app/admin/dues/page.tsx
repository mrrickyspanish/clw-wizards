import Link from 'next/link'
import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { DemoGivingActions } from './DemoGivingActions'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { formatCents } from '@/lib/format/money'
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
import { DuesEditDialog } from './DuesEditDialog'
import { AdminSearch } from '../AdminSearch'
import { matchesSearch } from '@/lib/search'
import { churchFund } from '@/lib/demo-giving'

const STATUS_STYLES: Record<DuesPayment['status'], string> = {
  paid: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  partial: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  pending: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  overdue: 'border-red-500/40 bg-red-500/10 text-red-400',
  waived: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
}

function money(cents: number) {
  return formatCents(cents)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminDuesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const supabase = createAdminSupabase()

  const [{ data: dues, error }, { data: parents }, { data: athletes }] = await Promise.all([
    supabase.from('dues_payments').select('*'),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'parent'),
    supabase.from('athletes').select('id, first_name, last_name'),
  ])

  const parentById = new Map(
    ((parents ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]).map((p) => [p.id, p])
  )
  const athleteById = new Map(
    ((athletes ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name'>[]).map((a) => [a.id, a])
  )

  const allRows = (dues ?? []) as DuesPayment[]

  // One row per wrestler, alphabetical by the wrestler's last name, so a coach
  // can find a kid without knowing which parent's account they are on. Rows
  // with no wrestler (family-level charges) sort by the parent's name.
  const sortKey = (d: DuesPayment) => {
    const athlete = d.athlete_id ? athleteById.get(d.athlete_id) : undefined
    if (athlete) return `${athlete.last_name} ${athlete.first_name}`
    return parentById.get(d.parent_id)?.full_name ?? ''
  }
  const rows = allRows
    .filter((d) => {
      const athlete = d.athlete_id ? athleteById.get(d.athlete_id) : undefined
      const parent = parentById.get(d.parent_id)
      return matchesSearch(query, [athlete?.first_name, athlete?.last_name, parent?.full_name, parent?.email])
    })
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'en', { sensitivity: 'base' }))

  // The totals follow the search, so "Smith" shows what the Smiths owe.
  // Waived rows are intentionally excluded from billed/outstanding totals —
  // they're money the club chose not to collect, not money still owed.
  const billable = rows.filter((d) => d.status !== 'waived')
  const totalBilled = billable.reduce((sum, d) => sum + d.amount_cents, 0)
  const totalCollected = rows.reduce((sum, d) => sum + d.amount_paid_cents, 0)
  const totalOutstanding = billable.reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Dues</h1>
          {CHURCH_READ_ONLY ? (
            // Church demo (UX scrub, Nov 20; RJ approved): gifts received, not bills.
            <p className="text-base text-clw-gray">Gifts received this year, by giver and fund. Only the Giving Admin sees this page.</p>
          ) : (
            <p className="text-sm text-clw-gray">
              Review and update billed amounts, recorded payments, due dates, waivers, and payment plans. Sorted by
              wrestler last name.
            </p>
          )}
        </div>
        <AdminSearch initial={query} basePath="/admin/dues" placeholder={CHURCH_READ_ONLY ? 'Search giver or email…' : 'Search wrestler, parent, email…'} />
      </div>
      {CHURCH_READ_ONLY && (
        <div className="mb-6">
          <DemoGivingActions />
        </div>
      )}

      {query && (
        <p className="mb-3 text-base text-clw-gray">
          Totals for the {rows.length} {rows.length === 1 ? 'row' : 'rows'} matching “{query}”.{' '}
          <Link href="/admin/dues" className="text-clw-gold hover:underline">
            Show the whole club
          </Link>
        </p>
      )}

      {CHURCH_READ_ONLY ? (
        <ChurchGiving rows={rows} parentById={parentById} />
      ) : (
      <>
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
          <p className="text-clw-gray">{query ? `No dues match “${query}”.` : 'No dues records yet.'}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Athlete</TableHead>
                <TableHead className="text-clw-gray">Family</TableHead>
                <TableHead className="text-clw-gray">Season</TableHead>
                <TableHead className="text-clw-gray">Amount</TableHead>
                <TableHead className="text-clw-gray">Paid</TableHead>
                <TableHead className="text-clw-gray">Due</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-right text-clw-gray">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const parent = parentById.get(d.parent_id)
                const athlete = d.athlete_id ? athleteById.get(d.athlete_id) : undefined
                return (
                  <TableRow key={d.id} className="border-clw-gold/10">
                    <TableCell className="font-medium text-clw-white">
                      {athlete ? `${athlete.last_name}, ${athlete.first_name}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/families/${d.parent_id}`}
                        className="text-clw-gray hover:text-clw-gold"
                      >
                        {parent?.full_name ?? 'Unknown parent'}
                      </Link>
                      <span className="block text-sm text-clw-gray/70">{parent?.email ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-clw-gray">{d.season}</TableCell>
                    <TableCell className="text-clw-white">{money(d.amount_cents)}</TableCell>
                    <TableCell className="text-clw-gray">{money(d.amount_paid_cents)}</TableCell>
                    <TableCell className="text-clw-gray">{formatDate(d.due_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={STATUS_STYLES[d.status]}>
                          {d.status}
                        </Badge>
                        {d.payment_plan && (
                          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-300">
                            payment plan
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DuesEditDialog dues={d} triggerLabel="Edit" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      </>
      )}
    </div>
  )
}

// Church demo: gifts received only (no amounts owed, due dates or statuses).
function ChurchGiving({
  rows,
  parentById,
}: {
  rows: DuesPayment[]
  parentById: Map<string, Pick<Profile, "full_name" | "email">>
}) {
  const gifts = rows.filter((d) => d.amount_paid_cents > 0)
  const received = gifts.reduce((sum, d) => sum + d.amount_paid_cents, 0)
  const givers = new Set(gifts.map((d) => d.parent_id)).size
  const stat = (label: string, value: string) => (
    <Card className="border-clw-gold/10 bg-clw-black">
      <CardHeader>
        <CardTitle className="text-base font-medium text-clw-gray">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-display text-clw-white">{value}</p>
      </CardContent>
    </Card>
  )
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stat('Received this year', money(received))}
        {stat('Gifts', String(gifts.length))}
        {stat('Givers', String(givers))}
      </div>
      {gifts.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-base text-clw-gray">No gifts recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Giver</TableHead>
                <TableHead className="text-clw-gray">Fund</TableHead>
                <TableHead className="text-clw-gray">Gift</TableHead>
                <TableHead className="text-clw-gray">Date</TableHead>
                <TableHead className="text-right text-clw-gray">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.map((d) => {
                const giver = parentById.get(d.parent_id)
                return (
                  <TableRow key={d.id} className="border-clw-gold/10">
                    <TableCell className="text-base font-medium text-clw-white">
                      {giver?.full_name ?? 'Giver'}
                      <span className="block text-sm text-clw-gray">{giver?.email ?? 'No email'}</span>
                    </TableCell>
                    <TableCell className="text-base text-clw-gray">{churchFund(d.id)}</TableCell>
                    <TableCell className="text-base text-clw-white">{money(d.amount_paid_cents)}</TableCell>
                    <TableCell className="text-base text-clw-gray">{formatDate(d.due_date)}</TableCell>
                    <TableCell className="text-right">
                      <DuesEditDialog dues={d} triggerLabel="Edit" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

