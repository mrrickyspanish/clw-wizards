import Link from 'next/link'
import { CalendarDays, Users, Wallet, ArrowRight } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, TournamentRegistration } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContactPrefsForm } from './ContactPrefsForm'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''
  const today = chicagoDateString()

  const [{ data: athletes }, { data: dues }, { data: profile }, { data: regs }] = await Promise.all([
    supabase.from('athletes').select('id, first_name, last_name, practice_group').eq('parent_id', userId),
    supabase
      .from('dues_payments')
      .select('amount_cents, amount_paid_cents')
      .eq('parent_id', userId)
      .in('status', ['pending', 'partial', 'overdue']),
    supabase.from('profiles').select('phone, sms_opt_in').eq('id', userId).single(),
    supabase
      .from('tournament_registrations')
      .select('tournament_id, status')
      .eq('parent_id', userId)
      .in('status', ['registered', 'confirmed']),
  ])

  const outstandingCents = (dues ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  // Next upcoming tournament this family is registered for (today forward).
  const registeredIds = [
    ...new Set(((regs ?? []) as Pick<TournamentRegistration, 'tournament_id'>[]).map((r) => r.tournament_id)),
  ]
  let nextEvent: Pick<Tournament, 'id' | 'name' | 'date' | 'city' | 'state'> | null = null
  if (registeredIds.length) {
    const { data: upcoming } = await supabase
      .from('tournaments')
      .select('id, name, date, city, state')
      .in('id', registeredIds)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
    nextEvent = (upcoming ?? [])[0] ?? null
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-clw-gold">Welcome back</h1>

      {/* Top row: the two things a parent comes here to check — what's next, what's owed. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lift border-l-4 border-l-clw-gold border-clw-gold/10 bg-clw-black">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CalendarDays className="h-4 w-4 text-clw-gold" />
            <CardTitle className="text-sm font-medium text-clw-gray">Next up</CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <>
                <p className="text-lg font-medium text-clw-white">{nextEvent.name}</p>
                <p className="mt-1 text-sm text-clw-gray">
                  {formatDate(nextEvent.date)} · {nextEvent.city}, {nextEvent.state}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-clw-gray">No upcoming registrations.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/tournaments">
                    Browse <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`lift border-l-4 border-clw-gold/10 bg-clw-black ${
            outstandingCents > 0 ? 'border-l-red-500' : 'border-l-clw-gold'
          }`}
        >
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Wallet className="h-4 w-4 text-clw-gold" />
            <CardTitle className="text-sm font-medium text-clw-gray">Dues balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-3xl font-display text-clw-white">${(outstandingCents / 100).toFixed(2)}</p>
                <p className="mt-1 text-xs text-clw-gray">Outstanding balance</p>
              </div>
              {outstandingCents > 0 && (
                <Button asChild size="sm">
                  <Link href="/dues">Pay now</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="lift border-clw-gold/10 bg-clw-black">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Users className="h-4 w-4 text-clw-gold" />
          <CardTitle className="text-sm font-medium text-clw-gray">My wrestlers</CardTitle>
        </CardHeader>
        <CardContent>
          {athletes?.length ? (
            <ul className="space-y-1 text-clw-white">
              {athletes.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>
                    {a.first_name} {a.last_name}
                  </span>
                  <span className="text-sm text-clw-gray">{a.practice_group}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-clw-gray">No athletes on file yet.</p>
          )}
        </CardContent>
      </Card>

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
