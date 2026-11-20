import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDatePlusDays, chicagoDateString } from '@/lib/chicago-time'
import { mapsUrl } from '@/lib/maps'
import type { FamilyTournamentRosterRow } from '@/types/database'

export const metadata: Metadata = { title: 'Tournament rosters' }

// Tournament rosters for families (Tyler, Nov 14 video: B7). Everything on
// this page comes from family_tournament_roster(), which returns only the
// signed-in person's own wrestlers (and, for a co-parent, the wrestlers their
// link covers). The page never reads the roster tables itself.

type RosterWrestler = {
  id: string
  name: string
  onSite: boolean
  onTrackWrestling: boolean
  // From the family's own club-site registration only, never from TrackWrestling (A7).
  division: string | null
  weight: string | null
  payment: FamilyTournamentRosterRow['registration_state']
}

type RosterTournament = {
  id: string
  name: string
  date: string
  venue: string
  place: string
  mapLink: string | null
  // The club cancelled it: the card stays (families may have paid) with a Cancelled chip.
  cancelled: boolean
  wrestlers: RosterWrestler[]
}

const clean = (value: string | null | undefined) => (value ?? '').trim()

// One card per tournament, one line per wrestler. A wrestler registered on the
// club site and also matched from a TrackWrestling paste shows once, with both.
function groupRoster(rows: FamilyTournamentRosterRow[]): RosterTournament[] {
  const tournaments = new Map<string, RosterTournament>()
  const wrestlersByKey = new Map<string, RosterWrestler>()
  for (const row of rows) {
    let t = tournaments.get(row.tournament_id)
    if (!t) {
      t = {
        id: row.tournament_id,
        name: row.tournament_name,
        date: row.date,
        venue: clean(row.location),
        place: [clean(row.city), clean(row.state)].filter(Boolean).join(', '),
        mapLink: mapsUrl({ venue: row.location, street: row.street_address, city: row.city, state: row.state }),
        cancelled: false,
        wrestlers: [],
      }
      tournaments.set(row.tournament_id, t)
    }
    if (row.tournament_status === 'cancelled') t.cancelled = true
    const key = `${row.tournament_id}|${row.athlete_id}`
    let w = wrestlersByKey.get(key)
    if (!w) {
      w = {
        id: row.athlete_id,
        name: `${clean(row.athlete_first_name)} ${clean(row.athlete_last_name)}`.trim(),
        onSite: false,
        onTrackWrestling: false,
        division: null,
        weight: null,
        payment: null,
      }
      wrestlersByKey.set(key, w)
      t.wrestlers.push(w)
    }
    if (row.source === 'site') {
      w.onSite = true
      w.division = clean(row.division) || null
      w.weight = clean(row.weight) || null
      w.payment = row.registration_state
    } else {
      w.onTrackWrestling = true
    }
  }
  return [...tournaments.values()]
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// The function is added by a migration; until it is applied, the page reads as empty (A12).
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883', '42P01'])

export default async function TournamentRostersPage() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('family_tournament_roster')
  const failed = Boolean(error && !MISSING_FUNCTION_CODES.has(error.code ?? ''))
  const rows = error ? [] : ((data ?? []) as FamilyTournamentRosterRow[])

  const today = chicagoDateString()
  const recentFrom = chicagoDatePlusDays(-30)
  const all = groupRoster(rows)
  const upcoming = all.filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  const recent = all
    .filter((t) => t.date < today && t.date >= recentFrom)
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Tournament rosters</h1>
        <p className="mt-1 text-base text-clw-gray">
          The tournaments your wrestlers are signed up for, whether you registered here or on TrackWrestling.
        </p>
      </div>

      {failed ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-base text-red-400">
          We couldn&apos;t load your tournament rosters just now. Please refresh the page or try again later.
        </p>
      ) : upcoming.length === 0 && recent.length === 0 ? (
        <section className="rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-6 md:p-8">
          <h2 className="font-display text-2xl text-clw-white">No tournaments yet</h2>
          <p className="mt-2 max-w-xl text-base text-clw-gray">
            Your wrestlers aren&apos;t on any tournament rosters right now. When you register for a tournament, or the
            club adds your wrestler from a TrackWrestling roster, it shows up here.
          </p>
          <Link
            href="/tournaments"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-clw-gold px-5 py-2.5 text-base font-medium text-[#0D0D0D]"
          >
            See tournaments
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <h2 id="upcoming-heading" className="font-display text-2xl text-clw-white">
              Upcoming
            </h2>
            {upcoming.length ? (
              upcoming.map((t) => <TournamentCard key={t.id} tournament={t} />)
            ) : (
              <p className="text-base text-clw-gray">
                Nothing coming up yet.{' '}
                <Link href="/tournaments" className="text-clw-gold-ink underline-offset-4 hover:underline">
                  See tournaments
                </Link>
              </p>
            )}
          </section>

          {recent.length > 0 && (
            <section aria-labelledby="recent-heading" className="space-y-4">
              <div>
                <h2 id="recent-heading" className="font-display text-2xl text-clw-white">
                  Recent
                </h2>
                <p className="mt-1 text-base text-clw-gray">The last 30 days.</p>
              </div>
              {recent.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

const PAYMENT_LABELS: Partial<Record<NonNullable<RosterWrestler['payment']>, { text: string; className: string }>> = {
  due: { text: 'Payment due', className: 'border-amber-500/50 bg-amber-500/15 text-clw-white' },
  paid: { text: 'Paid', className: 'border-emerald-500/40 bg-emerald-500/10 text-clw-white' },
  waived: { text: 'Fee waived', className: 'border-clw-gray/40 bg-clw-gray/10 text-clw-white' },
}

function TournamentCard({ tournament: t }: { tournament: RosterTournament }) {
  const where = [t.venue, t.place].filter(Boolean).join(', ')
  return (
    <article className="rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-base font-medium text-clw-gold-ink">{formatDate(t.date)}</p>
        {t.cancelled && (
          <span className="rounded-sm border border-red-500/50 bg-red-500/15 px-2 text-base font-medium text-clw-white">
            Cancelled
          </span>
        )}
      </div>
      <h3 className="mt-1 break-words font-display text-2xl leading-tight text-clw-white">{t.name}</h3>
      {where &&
        (t.mapLink ? (
          <a
            href={t.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 max-w-full items-start gap-1.5 py-2 text-base text-clw-gold-ink underline-offset-4 hover:underline"
          >
            <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{where}</span>
          </a>
        ) : (
          <p className="mt-2 flex items-start gap-1.5 text-base text-clw-gray">
            <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{where}</span>
          </p>
        ))}

      <ul className="mt-4 space-y-2">
        {t.wrestlers.map((w) => {
          const payment = w.payment ? PAYMENT_LABELS[w.payment] : undefined
          const details = w.onSite
            ? [w.division && `Division: ${w.division}`, w.weight && `Weight: ${w.weight}`].filter(Boolean).join(' · ')
            : ''
          return (
            <li key={w.id} className="rounded-xl bg-clw-black px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="break-words text-base font-medium text-clw-white">{w.name}</span>
                {payment && (
                  <span className={`rounded-sm border px-2 text-base font-medium ${payment.className}`}>{payment.text}</span>
                )}
              </div>
              {w.onSite && <p className="mt-1 text-base text-clw-gray">Registered on the club site</p>}
              {w.onTrackWrestling && <p className="mt-1 text-base text-clw-gray">Registered on TrackWrestling</p>}
              {details && <p className="mt-1 text-base text-clw-white">{details}</p>}
            </li>
          )
        })}
      </ul>
    </article>
  )
}
