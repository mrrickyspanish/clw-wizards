import { ExternalLink } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, Athlete, TournamentRegistration } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterControls, type RegistrationState } from './RegisterControls'

const STATUS_STYLES: Record<Tournament['status'], string> = {
  open: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink',
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

export default async function TournamentsPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  // Only today-and-upcoming tournaments are actionable on a registration page;
  // past events would just clutter the top of an ascending (soonest-first) list.
  const today = chicagoDateString()

  const [{ data: tournaments, error }, { data: athletes }, { data: registrations }] = await Promise.all([
    supabase.from('tournaments').select('*').gte('date', today).order('date', { ascending: true }),
    supabase.from('athletes').select('id, first_name, last_name, active').eq('parent_id', userId),
    supabase.from('tournament_registrations').select('id, tournament_id, athlete_id, status').eq('parent_id', userId),
  ])

  const tournamentRows = (tournaments ?? []) as Tournament[]
  const athleteRows = ((athletes ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name' | 'active'>[]).filter(
    (a) => a.active
  )
  const athleteOptions = athleteRows.map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}` }))

  // Index registrations by tournament, then by athlete, for quick lookup in the
  // per-tournament controls.
  const regsByTournament = new Map<string, Record<string, RegistrationState>>()
  for (const r of (registrations ?? []) as Pick<
    TournamentRegistration,
    'id' | 'tournament_id' | 'athlete_id' | 'status'
  >[]) {
    const byAthlete = regsByTournament.get(r.tournament_id) ?? {}
    byAthlete[r.athlete_id] = { id: r.id, status: r.status }
    regsByTournament.set(r.tournament_id, byAthlete)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-clw-gold-ink">Tournaments</h1>
        <p className="text-sm text-clw-gray">Browse the schedule and register your wrestlers.</p>
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
                <div>
                  <CardTitle className="text-clw-white">{t.name}</CardTitle>
                  <p className="mt-1 text-sm text-clw-gray">
                    {formatDate(t.date)} · {t.location}, {t.city}, {t.state}
                  </p>
                  {(t.weigh_in_date || t.weigh_in_time || t.start_time) && (
                    <p className="mt-1 text-xs text-clw-gray/70">
                      {t.weigh_in_date && `Weigh-in ${formatDate(t.weigh_in_date)}`}
                      {t.weigh_in_time && ` at ${t.weigh_in_time}`}
                      {t.start_time && ` · Starts ${t.start_time}`}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={STATUS_STYLES[t.status]}>
                  {t.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {t.notes && <p className="text-sm text-clw-gray">{t.notes}</p>}

              {t.external_registration_url ? (
                <Button asChild variant="outline" size="sm">
                  <a href={t.external_registration_url} target="_blank" rel="noopener noreferrer">
                    Register on {t.external_platform ?? 'external site'} <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ) : t.status === 'open' ? (
                <RegisterControls
                  tournamentId={t.id}
                  athletes={athleteOptions}
                  registrations={regsByTournament.get(t.id) ?? {}}
                />
              ) : (
                <p className="text-sm text-clw-gray">Registration is {t.status}.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
