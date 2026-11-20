import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-status'
import { distinctRegisteredCount, spotsLine } from '@/lib/tournament-spots'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Tournament, TournamentAdminDetails, TournamentEntry, TournamentRegistration, TournamentSession } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TournamentDialog } from './TournamentDialog'
import { DeleteTournamentButton } from './DeleteTournamentButton'

const STATUS_STYLES: Record<Tournament['status'], string> = {
  open: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  not_open: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  closed: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-400',
}

function formatDate(value: string) {
  // DATE columns are 'YYYY-MM-DD'; anchor to midnight local so the day doesn't
  // shift across timezones.
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function groupBy<T extends { tournament_id: string }>(rows: T[] | null | undefined) {
  const map = new Map<string, T[]>()
  for (const r of rows ?? []) map.set(r.tournament_id, [...(map.get(r.tournament_id) ?? []), r])
  return map
}

type EntryRow = Pick<TournamentEntry, 'tournament_id' | 'athlete_id'>
type RegistrationRow = Pick<
  TournamentRegistration,
  'tournament_id' | 'athlete_id' | 'status' | 'fee_cents' | 'paid_cents' | 'payment_method'
>
type SessionRow = Pick<TournamentSession, 'tournament_id' | 'start_time' | 'divisions' | 'sort_order'>
type DetailsRow = Pick<TournamentAdminDetails, 'tournament_id' | 'club_registrations_url' | 'spots_allotted'>

export default async function AdminTournamentsPage() {
  const supabase = await createServerSupabase()
  // The new tables may not exist yet on a database that has not had the
  // November 20 migrations; a failed read there just means no rows.
  const [{ data: tournaments, error }, { data: entryRows }, { data: regRows }, { data: sessionRows }, { data: detailRows }] =
    await Promise.all([
      supabase.from('tournaments').select('*').order('date', { ascending: false }),
      supabase.from('tournament_entries').select('tournament_id, athlete_id'),
      supabase
        .from('tournament_registrations')
        .select('tournament_id, athlete_id, status, fee_cents, paid_cents, payment_method'),
      supabase.from('tournament_sessions').select('tournament_id, start_time, divisions, sort_order').order('sort_order'),
      supabase.from('tournament_admin_details').select('tournament_id, club_registrations_url, spots_allotted'),
    ])
  // Wizards on each tournament: the pasted TrackWrestling list plus paid (or
  // free or waived) registrations on our site, each wrestler counted once.
  const entriesBy = groupBy(entryRows as EntryRow[] | null)
  const regsBy = groupBy(regRows as RegistrationRow[] | null)
  const sessionsBy = groupBy(sessionRows as SessionRow[] | null)
  const detailsBy = new Map(((detailRows ?? []) as DetailsRow[]).map((d) => [d.tournament_id, d]))
  const wizards = (t: Tournament) => {
    const entries = entriesBy.get(t.id) ?? []
    const regs = (regsBy.get(t.id) ?? []).filter((r) => r.status !== 'withdrawn')
    const filled = distinctRegisteredCount(entries, regs, t.entry_fee_cents)
    const allotted = detailsBy.get(t.id)?.spots_allotted ?? null
    const spots = spotsLine(filled, allotted)
    if (spots) return { label: spots, over: allotted !== null && filled > allotted }
    return { label: filled || entries.length || regs.length ? `${filled} registered` : 'Add list', over: false }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Tournaments</h1>
          <p className="text-base text-clw-gray">
            Manage the club tournament schedule. Tap a tournament to see who&apos;s registered.
          </p>
        </div>
        <TournamentDialog />
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load tournaments: {error.message}
        </p>
      )}

      {!error && (!tournaments || tournaments.length === 0) && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No tournaments yet. Add the first one to get started.</p>
        </div>
      )}

      {tournaments && tournaments.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Name</TableHead>
                <TableHead className="text-clw-gray">Date</TableHead>
                <TableHead className="text-clw-gray">Location</TableHead>
                <TableHead className="text-clw-gray">Groups</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-clw-gray">Wizards</TableHead>
                <TableHead className="text-clw-gray">Reg.</TableHead>
                <TableHead className="w-[88px] text-right text-clw-gray">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id} className="border-clw-gold/10">
                  <TableCell className="font-medium text-clw-white">
                    <Link href={`/admin/tournaments/${t.id}`} className="hover:text-clw-gold hover:underline">
                      {t.name}
                    </Link>
                    {t.competition_level && (
                      <span className="block text-sm font-normal text-clw-gold/80">{t.competition_level}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-clw-gray">{formatDate(t.date)}</TableCell>
                  <TableCell className="text-clw-gray">
                    {t.location}
                    <span className="block text-sm text-clw-gray/70">
                      {t.city}, {t.state}
                    </span>
                  </TableCell>
                  <TableCell className="text-clw-gray">
                    {t.practice_groups.length === 0 ? 'All' : t.practice_groups.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`whitespace-nowrap ${STATUS_STYLES[t.status]}`}>
                      {TOURNAMENT_STATUS_LABELS[t.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const w = wizards(t)
                      return (
                        <Link
                          href={`/admin/tournaments/${t.id}`}
                          className={`whitespace-nowrap hover:underline ${w.over ? 'text-red-400' : 'text-clw-gold'}`}
                        >
                          {w.label}
                        </Link>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {t.external_registration_url ? (
                      <a
                        href={t.external_registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-clw-gold hover:underline"
                      >
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-clw-gray/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <TournamentDialog
                        tournament={t}
                        sessions={sessionsBy.get(t.id) ?? []}
                        adminDetails={detailsBy.get(t.id) ?? null}
                      />
                      <DeleteTournamentButton id={t.id} name={t.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
