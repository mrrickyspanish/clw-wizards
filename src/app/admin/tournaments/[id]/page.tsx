import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { cleanTrackWrestlingUrl, sortRoster } from '@/lib/tw-roster'
import { TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-status'
import type { Tournament, TournamentEntry } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RosterPaste } from './RosterPaste'
import { RosterTools } from './RosterTools'

export const dynamic = 'force-dynamic'

const clubTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const longDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

// Who's registered for one tournament, from the TrackWrestling Wrestler List an
// admin pasted (Tyler, Nov 13). /admin is admin-only (middleware), and the
// entries table is admin-only (RLS).
export default async function TournamentRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
  if (!tournament) notFound()
  const t = tournament as Tournament

  const [{ data: entryRows }, { data: athleteRows }] = await Promise.all([
    supabase.from('tournament_entries').select('*').eq('tournament_id', id),
    supabase.from('athletes').select('id, parent_id, first_name, last_name, date_of_birth, active').order('last_name'),
  ])
  const entries = (entryRows ?? []) as TournamentEntry[]
  const athletes = athleteRows ?? []
  const byId = new Map(athletes.map((a) => [a.id, a]))
  const parentIds = [...new Set(entries.map((e) => (e.athlete_id ? byId.get(e.athlete_id)?.parent_id : null)).filter(Boolean))] as string[]
  const importerIds = [...new Set(entries.map((e) => e.imported_by).filter(Boolean))] as string[]
  const { data: people } = parentIds.length || importerIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', [...parentIds, ...importerIds])
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name]))

  const rows = sortRoster(
    entries.map((e) => {
      const a = e.athlete_id ? byId.get(e.athlete_id) : undefined
      return {
        id: e.id,
        division: e.division,
        weight: e.weight,
        externalName: e.external_name,
        wrestler: a ? `${a.first_name} ${a.last_name}` : e.external_name,
        matched: Boolean(a),
        familyId: a?.parent_id ?? null,
        family: a ? (nameOf.get(a.parent_id) ?? null) : null,
        paid: e.paid,
      }
    })
  )
  const groups = rows.reduce<{ division: string; rows: typeof rows }[]>((acc, r) => {
    const division = r.division ?? 'No division listed'
    const last = acc.at(-1)
    if (last && last.division === division) last.rows.push(r)
    else acc.push({ division, rows: [r] })
    return acc
  }, [])
  const lastPaste = entries.reduce<TournamentEntry | null>((latest, e) => (!latest || e.imported_at > latest.imported_at ? e : latest), null)
  const unmatched = rows.filter((r) => !r.matched).length
  const unpaid = rows.filter((r) => !r.paid).length
  const twUrl = t.external_registration_url ? cleanTrackWrestlingUrl(t.external_registration_url) : null
  const wrestlers = athletes
    .filter((a) => a.active)
    .map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}`, birthYear: a.date_of_birth ? Number(a.date_of_birth.slice(0, 4)) : null }))

  return (
    <div className="space-y-6">
      <div className="space-y-3 print:hidden">
        <Link href="/admin/tournaments" className="inline-flex min-h-11 items-center gap-2 text-base text-clw-gray hover:text-clw-gold">
          <ArrowLeft className="h-4 w-4" /> Tournaments
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-display text-clw-gold md:text-3xl">{t.name}</h1>
          <p className="text-base text-clw-gray">
            {longDate(t.date)} · {t.location}, {t.city}, {t.state}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Badge variant="outline" className="whitespace-nowrap border-clw-gold/30 text-clw-gold">
              {TOURNAMENT_STATUS_LABELS[t.status]}
            </Badge>
            {twUrl && (
              <a
                href={twUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-base text-clw-gold hover:underline"
              >
                Open on TrackWrestling <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <RosterPaste tournamentId={t.id} wrestlers={wrestlers} hasRoster={entries.length > 0} />

      {entries.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-2 print:hidden">
            <h2 className="text-2xl font-display text-clw-white">
              Who&apos;s registered <span className="text-clw-gray">({rows.length})</span>
            </h2>
            <p className="text-base text-clw-gray">
              From TrackWrestling{lastPaste ? `, pasted ${clubTime(lastPaste.imported_at)}` : ''}
              {lastPaste?.imported_by && nameOf.get(lastPaste.imported_by) ? ` by ${nameOf.get(lastPaste.imported_by)}` : ''}.
              {unpaid > 0 && ` ${unpaid} not paid on TrackWrestling yet.`}
              {unmatched > 0 && ` ${unmatched} not matched to anyone on our site, so they won't get the reminders.`}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href={`/admin/communications?audience=tournament_registrants&tournament=${t.id}`}>
                  <Mail className="mr-2 h-4 w-4" /> Message these families
                </Link>
              </Button>
              <RosterTools
                tournament={{ name: t.name, date: t.date }}
                rows={rows.map((r) => ({ division: r.division, weight: r.weight, wrestler: r.wrestler, externalName: r.externalName, paid: r.paid }))}
              />
            </div>
          </div>

          <div className="space-y-5 print:hidden">
            {groups.map((g) => (
              <div key={g.division} className="space-y-2">
                <h3 className="font-cond text-sm uppercase tracking-[0.16em] text-clw-gold">
                  {g.division} <span className="text-clw-gray">· {g.rows.length}</span>
                </h3>
                <ul className="divide-y divide-clw-gold/10 rounded-xl border border-clw-gold/10 bg-clw-black">
                  {g.rows.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
                      <span className="w-16 shrink-0 text-base text-clw-gray">{r.weight ? `${r.weight} lbs` : '—'}</span>
                      <span className="min-w-0 flex-1">
                        {r.familyId ? (
                          <Link href={`/admin/families/${r.familyId}`} className="text-base font-medium text-clw-white hover:text-clw-gold">
                            {r.wrestler}
                          </Link>
                        ) : (
                          <span className="text-base font-medium text-clw-white">{r.wrestler}</span>
                        )}
                        {r.matched && r.externalName !== r.wrestler && (
                          <span className="block text-sm text-clw-gray">On TrackWrestling: {r.externalName}</span>
                        )}
                        {!r.matched && <span className="block text-sm text-clw-gold">Not matched to our site</span>}
                      </span>
                      {!r.paid && (
                        <Badge variant="outline" className="whitespace-nowrap border-clw-gray/40 text-clw-gray">
                          Not paid
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Plain black-on-white copy for paper. */}
          <div className="hidden text-black print:block">
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <p className="mb-4 text-base">
              {longDate(t.date)} · {t.location}, {t.city}, {t.state} · {rows.length} Wizards registered
              {lastPaste ? ` (TrackWrestling list as of ${clubTime(lastPaste.imported_at)})` : ''}
            </p>
            <table className="w-full border-collapse text-base">
              <thead>
                <tr>
                  {['Division', 'Weight', 'Wrestler', 'Paid'].map((h) => (
                    <th key={h} className="border-b-2 border-black py-1 pr-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="border-b border-gray-300 py-1 pr-3">{r.division ?? ''}</td>
                    <td className="border-b border-gray-300 py-1 pr-3">{r.weight ?? ''}</td>
                    <td className="border-b border-gray-300 py-1 pr-3">{r.wrestler}</td>
                    <td className="border-b border-gray-300 py-1 pr-3">{r.paid ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
