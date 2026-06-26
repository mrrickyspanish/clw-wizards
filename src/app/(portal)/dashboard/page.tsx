import Link from 'next/link'
import { CalendarDays, Users, Wallet, Trophy, FolderOpen, ArrowRight, ChevronRight } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, TournamentRegistration } from '@/types/database'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

type Tile = {
  href: string
  label: string
  value: string
  icon: typeof Users
  tint: string
}

function StatTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon
  return (
    <Link
      href={tile.href}
      className="lift flex flex-col gap-3 rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-4 active:scale-[0.98]"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tile.tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-3xl leading-none text-clw-white">{tile.value}</span>
        <span className="mt-1 block text-sm text-clw-gray">{tile.label}</span>
      </span>
    </Link>
  )
}

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''
  const today = chicagoDateString()

  const [{ data: athletes }, { data: dues }, { data: regs }, { count: docCount }] = await Promise.all([
    supabase.from('athletes').select('id, first_name, last_name, practice_group').eq('parent_id', userId),
    supabase
      .from('dues_payments')
      .select('amount_cents, amount_paid_cents')
      .eq('parent_id', userId)
      .in('status', ['pending', 'partial', 'overdue']),
    supabase
      .from('tournament_registrations')
      .select('tournament_id, status')
      .eq('parent_id', userId)
      .in('status', ['registered', 'confirmed']),
    supabase.from('athlete_documents').select('id', { count: 'exact', head: true }).eq('parent_id', userId),
  ])

  const outstandingCents = (dues ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)
  const athleteRows = athletes ?? []

  const registeredIds = [
    ...new Set(((regs ?? []) as Pick<TournamentRegistration, 'tournament_id'>[]).map((r) => r.tournament_id)),
  ]
  let upcoming: Pick<Tournament, 'id' | 'name' | 'date' | 'city' | 'state'>[] = []
  if (registeredIds.length) {
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, date, city, state')
      .in('id', registeredIds)
      .gte('date', today)
      .order('date', { ascending: true })
    upcoming = data ?? []
  }
  const nextEvent = upcoming[0] ?? null

  const tiles: Tile[] = [
    {
      href: '/athletes',
      label: 'Wrestlers',
      value: String(athleteRows.length),
      icon: Users,
      tint: 'bg-clw-gold/15 text-clw-gold',
    },
    {
      href: '/dues',
      label: 'Dues balance',
      value: `$${(outstandingCents / 100).toFixed(0)}`,
      icon: Wallet,
      tint: outstandingCents > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400',
    },
    {
      href: '/tournaments',
      label: 'Registered events',
      value: String(upcoming.length),
      icon: Trophy,
      tint: 'bg-sky-500/15 text-sky-400',
    },
    {
      href: '/documents',
      label: 'Docs on file',
      value: String(docCount ?? 0),
      icon: FolderOpen,
      tint: 'bg-violet-500/15 text-violet-400',
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Redundant with the mobile top bar; shown on desktop only. */}
      <h1 className="hidden font-display text-3xl text-clw-gold md:block">Welcome back</h1>

      {/* Hero: next event */}
      <Link
        href="/tournaments"
        className="lift block rounded-2xl border border-clw-gold/20 bg-gradient-to-br from-clw-black-2 to-clw-black p-5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-2 text-clw-gold">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wide">Next up</span>
        </div>
        {nextEvent ? (
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-clw-white">{nextEvent.name}</p>
              <p className="mt-1 text-sm text-clw-gray">
                {formatDate(nextEvent.date)} · {nextEvent.city}, {nextEvent.state}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-clw-gold" />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-clw-gray">No upcoming registrations.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-clw-gold">
              Browse <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        )}
      </Link>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <StatTile key={tile.href} tile={tile} />
        ))}
      </div>

      {/* My wrestlers */}
      <div className="rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium text-clw-gray">
            <Users className="h-4 w-4 text-clw-gold" /> My wrestlers
          </h2>
          <Link href="/athletes" className="text-sm text-clw-gold">
            View all
          </Link>
        </div>
        {athleteRows.length ? (
          <ul className="space-y-2">
            {athleteRows.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl bg-clw-black px-4 py-3">
                <span className="font-medium text-clw-white">
                  {a.first_name} {a.last_name}
                </span>
                <span className="rounded-full border border-clw-gold/30 px-2.5 py-0.5 text-xs text-clw-gold">
                  {a.practice_group}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-clw-gray">No wrestlers on file yet.</p>
        )}
      </div>
    </div>
  )
}
