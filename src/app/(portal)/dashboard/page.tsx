import Link from 'next/link'
import {
  CalendarDays,
  Users,
  Trophy,
  FolderOpen,
  MapPin,
  ChevronRight,
  Ticket,
  Upload,
  Mail,
  CheckCircle2,
  UserPlus,
  Plus,
} from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString, chicagoHour } from '@/lib/chicago-time'
import { WEEKDAYS, formatTime, nextPractice } from '@/lib/practice'
import { ORG } from '@/config/org.config'
import type { Tournament, TournamentRegistration, Practice, Athlete } from '@/types/database'

function greeting(): string {
  const h = chicagoHour()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstNameOf(name: string | null): string {
  return name?.split(' ')[0] ?? 'there'
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export default async function ParentDashboardPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''
  const today = chicagoDateString()

  const [
    { data: profile },
    { data: athletes },
    { data: dues },
    { data: regs },
    { count: docCount },
    { data: practices },
    { data: recentDocs },
    { data: paidDues },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
    supabase.from('athletes').select('id, first_name, last_name, weight_class, practice_group').eq('parent_id', userId),
    supabase
      .from('dues_payments')
      .select('amount_cents, amount_paid_cents')
      .eq('parent_id', userId)
      .in('status', ['pending', 'partial', 'overdue']),
    supabase
      .from('tournament_registrations')
      .select('tournament_id, status, registered_at')
      .eq('parent_id', userId)
      .in('status', ['registered', 'confirmed']),
    supabase.from('athlete_documents').select('id', { count: 'exact', head: true }).eq('parent_id', userId),
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('athlete_documents').select('uploaded_at, doc_type').eq('parent_id', userId),
    supabase.from('dues_payments').select('updated_at, season').eq('parent_id', userId).eq('status', 'paid'),
  ])

  const athleteRows = (athletes ?? []) as Pick<
    Athlete,
    'id' | 'first_name' | 'last_name' | 'weight_class' | 'practice_group'
  >[]
  const outstandingCents = (dues ?? []).reduce((sum, d) => sum + (d.amount_cents - d.amount_paid_cents), 0)

  // Next event (registered, future)
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

  // Practices for this family's groups
  const groups = new Set(athleteRows.map((a) => a.practice_group))
  const myPractices = ((practices ?? []) as Practice[])
    .filter((p) => groups.has(p.practice_group))
    .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
  const next = nextPractice(myPractices)

  // Recent activity from real timestamps
  type Activity = { label: string; date: string }
  const activity: Activity[] = [
    ...((regs ?? []) as { registered_at: string }[]).map((r) => ({
      label: 'Registered for an event',
      date: r.registered_at,
    })),
    ...((recentDocs ?? []) as { uploaded_at: string; doc_type: string }[]).map((d) => ({
      label: `Uploaded ${d.doc_type.replace(/_/g, ' ')}`,
      date: d.uploaded_at,
    })),
    ...((paidDues ?? []) as { updated_at: string; season: string }[]).map((d) => ({
      label: `Paid ${d.season} dues`,
      date: d.updated_at,
    })),
  ]
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  const noAthletes = athleteRows.length === 0
  const stats = [
    noAthletes
      ? { href: '/athletes/new', label: 'Add wrestler', value: '+', icon: UserPlus }
      : { href: '/athletes', label: 'Wrestlers', value: String(athleteRows.length), icon: Users },
    { href: '/tournaments', label: 'Events', value: String(upcoming.length), icon: Trophy },
    { href: '/documents', label: 'Documents', value: String(docCount ?? 0), icon: FolderOpen },
  ]

  const quickActions = [
    { href: '/tournaments', label: 'Register', icon: Ticket },
    { href: '/documents', label: 'Upload', icon: Upload },
    { href: `mailto:${ORG.contactEmail}`, label: 'Contact', icon: Mail },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="hidden font-display text-3xl text-clw-white md:block">
        {greeting()}, <span className="text-clw-gold-ink">{firstNameOf(profile?.full_name ?? null)}</span>
      </h1>

      {/* HERO: next practice (the "where do I go, when") */}
      <section className="card-depth rounded-2xl border border-clw-gold/15 bg-clw-black-3 p-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-clw-gold-ink">
          {next ? 'Next practice' : nextEvent ? 'Next event' : 'Your week'}
        </p>
        {next ? (
          <>
            <p className="mt-3 font-display text-3xl leading-tight text-clw-white">
              {next.label} · {formatTime(next.practice.start_time)}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-clw-gray">
              <MapPin className="h-4 w-4 shrink-0 text-clw-gold-ink" />
              {next.practice.location}
            </p>
            <p className="mt-1 text-sm text-clw-gray">{next.practice.practice_group} group</p>
          </>
        ) : nextEvent ? (
          <>
            <p className="mt-3 font-display text-3xl leading-tight text-clw-white">{nextEvent.name}</p>
            <p className="mt-2 text-clw-gray">
              {shortDate(nextEvent.date)} · {nextEvent.city}, {nextEvent.state}
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 font-display text-2xl leading-tight text-clw-white">Nothing scheduled yet</p>
            <p className="mt-2 text-sm text-clw-gray">
              Once your wrestlers are registered and a schedule is posted, your next practice and events show up here.
            </p>
          </>
        )}
      </section>

      {/* BALANCE: focal only when something is owed */}
      {outstandingCents > 0 && (
        <Link
          href="/dues"
          className="card-depth lift block rounded-2xl border border-red-500/30 bg-clw-black-3 p-6 active:scale-[0.99]"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-400">Balance due</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="font-display text-5xl leading-none text-clw-white">
              ${(outstandingCents / 100).toFixed(0)}
            </p>
            <span className="rounded-lg bg-clw-gold px-4 py-2 text-sm font-medium text-[#0D0D0D]">Pay now</span>
          </div>
        </Link>
      )}

      {/* SECONDARY STATS: calm, consistent chips */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="card-depth flex flex-col gap-3 rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-4 active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clw-gold/10 text-clw-gold-ink">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block font-display text-2xl leading-none text-clw-white">{s.value}</span>
                <span className="mt-1 block text-xs text-clw-gray">{s.label}</span>
              </span>
            </Link>
          )
        })}
      </div>

      {/* MY WRESTLERS */}
      <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-clw-white">My wrestlers</h2>
          {athleteRows.length > 0 && (
            <Link href="/athletes" className="text-sm text-clw-gold-ink">
              View all
            </Link>
          )}
        </div>
        {athleteRows.length ? (
          <ul className="space-y-2">
            {athleteRows.map((a) => (
              <li key={a.id}>
                <Link href="/athletes" className="flex items-center gap-3 rounded-xl bg-clw-black px-3 py-3 active:bg-clw-black-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-clw-gold/30 font-display text-clw-gold-ink">
                    {initials(a.first_name, a.last_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-clw-white">
                      {a.first_name} {a.last_name}
                    </span>
                    <span className="block truncate text-sm text-clw-gray">
                      {a.practice_group}
                      {a.weight_class ? ` · ${a.weight_class}` : ''}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-clw-gray" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <p className="text-sm text-clw-gray">Add your wrestler to register for practices, events, and dues.</p>
            <Link
              href="/athletes/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-clw-gold px-4 py-2 text-sm font-medium text-[#0D0D0D]"
            >
              <Plus className="h-4 w-4" /> Add wrestler
            </Link>
          </div>
        )}
      </section>

      {/* THIS WEEK */}
      {myPractices.length > 0 && (
        <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-clw-white">
            <CalendarDays className="h-4 w-4 text-clw-gold-ink" /> This week
          </h2>
          <ul className="space-y-2">
            {myPractices.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl bg-clw-black px-3 py-3">
                <span>
                  <span className="block font-medium text-clw-white">{WEEKDAYS[p.weekday]}</span>
                  <span className="block text-sm text-clw-gray">{p.location}</span>
                </span>
                <span className="text-sm text-clw-gold-ink">{formatTime(p.start_time)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.label}
              href={a.href}
              className="card-depth flex flex-col items-center gap-2 rounded-2xl border border-clw-gold/10 bg-clw-black-3 px-3 py-4 text-center active:scale-[0.98]"
            >
              <Icon className="h-5 w-5 text-clw-gold-ink" />
              <span className="text-sm text-clw-white">{a.label}</span>
            </Link>
          )
        })}
      </div>

      {/* RECENT ACTIVITY */}
      {activity.length > 0 && (
        <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
          <h2 className="mb-3 text-sm font-medium text-clw-white">Recent activity</h2>
          <ul className="space-y-3">
            {activity.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="flex-1 text-sm text-clw-white">{item.label}</span>
                <span className="text-xs text-clw-gray">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
