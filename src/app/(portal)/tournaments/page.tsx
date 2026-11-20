import Link from 'next/link'
import { Clock, ExternalLink, MapPin, Scale, Users } from 'lucide-react'

import { registerButtonLabel, registrationLine, TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-status'
import { createServerSupabase } from '@/lib/supabase/server'
import { resolveFamilyOwnerIds } from '@/lib/family'
import { chicagoDateString } from '@/lib/chicago-time'
import { formatTime } from '@/lib/practice'
import { mapsUrl } from '@/lib/maps'
import { sessionLine } from '@/lib/tournament-sessions'
import { groupTournamentSessions } from '@/lib/club-calendar'
import type { Tournament, Athlete, TournamentRegistration, TournamentSession } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterControls, RegisterAndPayForm, type EntryAthlete, type RegistrationState } from './RegisterControls'
import { TournamentFlier } from '@/components/events/TournamentFlier'

const STATUS_STYLES: Record<Tournament['status'], string> = {
  open: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink',
  not_open: 'border-sky-500/40 bg-sky-500/10 text-clw-white',
  closed: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-400',
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type SessionRow = Pick<TournamentSession, 'id' | 'tournament_id' | 'start_time' | 'divisions' | 'sort_order'>
type RegistrationRow = Pick<
  TournamentRegistration,
  | 'id'
  | 'tournament_id'
  | 'athlete_id'
  | 'status'
  | 'fee_cents'
  | 'paid_cents'
  | 'payment_method'
  | 'weight'
  | 'division'
  | 'grade'
>

/** Where the tournament is, as two lines: the venue, then the street and town. */
function venueLines(t: Pick<Tournament, 'location' | 'street_address' | 'city' | 'state'>) {
  const name = (t.location ?? '').trim()
  const street = (t.street_address ?? '').trim()
  const place = [t.city, t.state].filter(Boolean).join(', ')
  return {
    first: name || street || place,
    second: name ? [street, place].filter(Boolean).join(', ') : street ? place : '',
  }
}

/** Venue (tap to map) and session times for one tournament card. */
function TournamentDetails({ tournament: t, sessions }: { tournament: Tournament; sessions: SessionRow[] }) {
  const venue = venueLines(t)
  const mapLink = mapsUrl({ venue: t.location, street: t.street_address, city: t.city, state: t.state })
  if (!venue.first && sessions.length === 0 && !t.start_time) return null
  return (
    <div className="space-y-1 text-base text-clw-gray">
      {/* Tap to map (B3): Google Maps opens the app on a phone. */}
      {venue.first && mapLink ? (
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 w-fit max-w-full items-center gap-2 underline decoration-clw-gold/40 underline-offset-4 hover:decoration-clw-gold"
        >
          <MapPin className="h-4 w-4 shrink-0 text-clw-gold-ink" />
          <span className="min-w-0 break-words">
            <span className="block text-clw-white">{venue.first}</span>
            {venue.second && <span className="block">{venue.second}</span>}
            <span className="sr-only"> (opens a map in a new tab)</span>
          </span>
        </a>
      ) : venue.first ? (
        <p className="flex items-start gap-2">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-clw-gold-ink" /> {venue.first}
        </p>
      ) : null}
      {/* Sessions (B2): each start time with the divisions it covers. */}
      {sessions.length > 0 ? (
        <ul className="space-y-1" aria-label="Sessions">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-clw-gold-ink" />
              <span className="min-w-0 break-words">{sessionLine(s)}</span>
            </li>
          ))}
        </ul>
      ) : t.start_time ? (
        <p className="flex items-start gap-2">
          <Clock className="mt-1 h-4 w-4 shrink-0 text-clw-gold-ink" /> Starts {formatTime(t.start_time)}
        </p>
      ) : null}
    </div>
  )
}

export default async function TournamentsPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  // Only today-and-upcoming tournaments are actionable on a registration page;
  // past events would just clutter the top of an ascending (soonest-first) list.
  const today = chicagoDateString()

  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, userId)
  const [{ data: tournaments, error }, { data: athletes }] = await Promise.all([
    supabase.from('tournaments').select('*').gte('date', today).order('date', { ascending: true }),
    supabase
      .from('athletes')
      .select('id, first_name, last_name, active, date_of_birth, age_division')
      .in('parent_id', familyOwnerIds),
  ])

  const allAthletes = (athletes ?? []) as Pick<
    Athlete,
    'id' | 'first_name' | 'last_name' | 'active' | 'date_of_birth' | 'age_division'
  >[]
  const athleteIds = allAthletes.map((a) => a.id)

  // Registrations resolve by the family's wrestlers, so a co-guardian sees the
  // whole family's sign-ups (RLS: treg_guardian_all) — not just their own.
  // The payment columns and entry details feed Register and pay (B4).
  const { data: registrations } = athleteIds.length
    ? await supabase
        .from('tournament_registrations')
        .select('id, tournament_id, athlete_id, status, fee_cents, paid_cents, payment_method, weight, division, grade')
        .in('athlete_id', athleteIds)
    : { data: [] as RegistrationRow[] }

  const tournamentRows = (tournaments ?? []) as Tournament[]
  // Sessions (B2). Before their migration runs this read fails, and each card
  // shows the single start time as before.
  const tournamentIds = tournamentRows.map((t) => t.id)
  const { data: sessionData } = tournamentIds.length
    ? await supabase
        .from('tournament_sessions')
        .select('id, tournament_id, start_time, divisions, sort_order')
        .in('tournament_id', tournamentIds)
    : { data: [] as SessionRow[] }
  const sessionsByTournament = groupTournamentSessions((sessionData ?? []) as SessionRow[])
  const athleteRows = allAthletes.filter((a) => a.active)
  const athleteOptions = athleteRows.map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}` }))

  // Register and pay (B4) starts each wrestler's grade from their latest
  // season enrollment that has one (RLS: family_read_season_enrollments).
  // Read only when a tournament takes payment here.
  const takesPayment = (t: Tournament) => t.status === 'open' && !t.external_registration_url && t.entry_fee_cents != null
  const { data: enrollmentData } =
    athleteIds.length && tournamentRows.some(takesPayment)
      ? await supabase
          .from('season_enrollments')
          .select('athlete_id, grade, submitted_at')
          .in('athlete_id', athleteIds)
          .order('submitted_at', { ascending: false })
      : { data: [] as { athlete_id: string; grade: string | null; submitted_at: string }[] }
  const gradeByAthlete = new Map<string, string>()
  for (const e of (enrollmentData ?? []) as { athlete_id: string; grade: string | null }[]) {
    const grade = e.grade?.trim()
    if (grade && !gradeByAthlete.has(e.athlete_id)) gradeByAthlete.set(e.athlete_id, grade)
  }
  const entryAthletes: EntryAthlete[] = athleteRows.map((a) => ({
    id: a.id,
    name: `${a.first_name} ${a.last_name}`,
    dateOfBirth: a.date_of_birth ?? null,
    ageDivision: a.age_division ?? null,
    grade: gradeByAthlete.get(a.id) ?? null,
  }))

  // Index registrations by tournament, then by athlete, for quick lookup in the
  // per-tournament controls.
  const regsByTournament = new Map<string, Record<string, RegistrationState>>()
  for (const r of (registrations ?? []) as RegistrationRow[]) {
    const byAthlete = regsByTournament.get(r.tournament_id) ?? {}
    byAthlete[r.athlete_id] = {
      id: r.id,
      status: r.status,
      feeCents: r.fee_cents ?? null,
      paidCents: r.paid_cents ?? 0,
      paymentMethod: r.payment_method ?? null,
      weight: r.weight ?? null,
      division: r.division ?? null,
      grade: r.grade ?? null,
    }
    regsByTournament.set(r.tournament_id, byAthlete)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-clw-gold-ink">Tournaments</h1>
          <p className="text-base text-clw-gray">Browse the schedule and register your wrestlers.</p>
        </div>
        <Button asChild variant="outline" className="text-base">
          <Link href="/tournament-rosters">
            <Users className="mr-1.5 h-4 w-4" /> Tournament rosters
          </Link>
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load tournaments: {error.message}
        </p>
      )}

      {!error && tournamentRows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black-3 p-10 text-center">
          <p className="text-clw-gray">No upcoming tournaments scheduled.</p>
        </div>
      )}

      <div className="space-y-4">
        {tournamentRows.map((t) => (
          <Card key={t.id} className="border-clw-gold/10 bg-clw-black-3">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-clw-white">{t.name}</CardTitle>
                  <p className="mt-1 text-base text-clw-gray">{formatDate(t.date)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant="outline" className={`whitespace-nowrap ${STATUS_STYLES[t.status]}`}>
                    {TOURNAMENT_STATUS_LABELS[t.status]}
                  </Badge>
                  {t.competition_level && (
                    <Badge variant="outline" className="border-clw-gray/40 text-clw-white">
                      {t.competition_level}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TournamentDetails tournament={t} sessions={sessionsByTournament.get(t.id) ?? []} />

              {/* Weigh-in shows as its own linked calendar entry for families —
                  personal to the portal, never on the public marketing page. */}
              {(t.weigh_in_date || t.weigh_in_time) && (
                <div className="flex items-start gap-3 rounded-xl border border-clw-gold/15 bg-clw-black px-4 py-3">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0 text-clw-gold-ink" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-clw-white">Weigh-ins for {t.name}</p>
                    <p className="mt-0.5 text-clw-gray">
                      {formatDate(t.weigh_in_date || t.date)}
                      {t.weigh_in_time && ` · ${formatTime(t.weigh_in_time)}`}
                      {` · ${t.weigh_in_location || t.location}`}
                    </p>
                  </div>
                </div>
              )}

              {t.notes && <p className="text-base text-clw-gray">{t.notes}</p>}

              <TournamentFlier url={t.image_url} name={t.name} />

              {/* Register only while open, same as Events (Oct 30: not open yet, closed and cancelled show the line). */}
              {t.status === 'open' && t.external_registration_url ? (
                <Button asChild variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal text-left">
                  <a href={t.external_registration_url} target="_blank" rel="noopener noreferrer">
                    {registerButtonLabel(t.external_platform, t.external_registration_url)} <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ) : takesPayment(t) && t.entry_fee_cents != null ? (
                // A cost is set: pick wrestlers, enter weights, pay through Stripe (B4).
                <RegisterAndPayForm
                  tournamentId={t.id}
                  feeCents={t.entry_fee_cents}
                  athletes={entryAthletes}
                  registrations={regsByTournament.get(t.id) ?? {}}
                  showReturnFallback={tournamentRows.find(takesPayment)?.id === t.id}
                />
              ) : t.status === 'open' ? (
                <RegisterControls
                  tournamentId={t.id}
                  athletes={athleteOptions}
                  registrations={regsByTournament.get(t.id) ?? {}}
                />
              ) : (
                <p className="text-base text-clw-gray">{registrationLine(t.status)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
