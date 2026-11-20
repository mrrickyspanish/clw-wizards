import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { cleanTrackWrestlingUrl, sortRoster } from '@/lib/tw-roster'
import { TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-status'
import { registrationPaymentState, type RegistrationPaymentState } from '@/lib/tournament-registration'
import { distinctRegisteredCount, spotsLine } from '@/lib/tournament-spots'
import type { Tournament, TournamentAdminDetails, TournamentCheckout, TournamentEntry, TournamentRegistration } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { paymentLabel, type CombinedRosterRow } from '../tournament-admin'
import { RosterPaste } from './RosterPaste'
import { RosterTools } from './RosterTools'
import { ClearPaymentAction, SitePaymentActions } from './SitePaymentActions'

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

const dollars = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`

const PAYMENT_STYLES: Record<RegistrationPaymentState, string> = {
  paid: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  due: 'border-red-500/40 bg-red-500/10 text-red-400',
  waived: 'border-clw-gray/40 text-clw-gray',
  free: 'border-clw-gray/40 text-clw-gray',
  withdrawn: 'border-clw-gray/40 text-clw-gray',
}

// Who's registered for one tournament, from the TrackWrestling Wrestler List an
// admin pasted (Tyler, Nov 13) and the families who registered on our site
// (Tyler, Nov 14: B4). /admin is admin-only (middleware); the entries, admin
// details and other families' registrations are admin-only (RLS).
export default async function TournamentRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
  if (!tournament) notFound()
  const t = tournament as Tournament

  // The new tables may not exist yet on a database that has not had the
  // November 20 migrations; a failed read there just means no rows.
  const [{ data: entryRows }, { data: athleteRows }, { data: regRows }, { data: detailsRow }, { data: checkoutRows }] = await Promise.all([
    supabase.from('tournament_entries').select('*').eq('tournament_id', id),
    supabase.from('athletes').select('id, parent_id, first_name, last_name, date_of_birth, active').order('last_name'),
    supabase.from('tournament_registrations').select('*').eq('tournament_id', id).in('status', ['registered', 'confirmed']),
    supabase.from('tournament_admin_details').select('club_registrations_url, spots_allotted').eq('tournament_id', id).maybeSingle(),
    supabase
      .from('tournament_checkouts')
      .select('payer_id, registration_ids, status')
      .eq('tournament_id', id)
      .in('status', ['paid', 'partially_refunded']),
  ])
  const entries = (entryRows ?? []) as TournamentEntry[]
  const registrations = (regRows ?? []) as TournamentRegistration[]
  const details = detailsRow as Pick<TournamentAdminDetails, 'club_registrations_url' | 'spots_allotted'> | null
  const checkouts = (checkoutRows ?? []) as Pick<TournamentCheckout, 'payer_id' | 'registration_ids' | 'status'>[]
  const athletes = athleteRows ?? []
  const byId = new Map(athletes.map((a) => [a.id, a]))
  // Who paid by card for each registration, from the checkout that covers it.
  const payerOf = new Map<string, string>()
  for (const c of checkouts) for (const rid of c.registration_ids ?? []) if (c.payer_id) payerOf.set(rid, c.payer_id)
  const parentIds = [...new Set(entries.map((e) => (e.athlete_id ? byId.get(e.athlete_id)?.parent_id : null)).filter(Boolean))] as string[]
  const importerIds = [...new Set(entries.map((e) => e.imported_by).filter(Boolean))] as string[]
  const siteParentIds = [...new Set([...registrations.map((r) => r.parent_id), ...payerOf.values()].filter(Boolean))]
  const peopleIds = [...new Set([...parentIds, ...importerIds, ...siteParentIds])]
  const { data: people } = peopleIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', peopleIds)
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
  const clubUrl = details?.club_registrations_url ? cleanTrackWrestlingUrl(details.club_registrations_url) : null

  // Families who registered on our site, with what they entered and where the payment stands.
  const siteRows = sortRoster(
    registrations.map((r) => {
      const a = byId.get(r.athlete_id)
      const fee = r.fee_cents ?? t.entry_fee_cents
      const state = registrationPaymentState({ feeCents: fee, paidCents: r.paid_cents, paymentMethod: r.payment_method, status: r.status })
      const parentId = (r.payment_method === 'card' ? payerOf.get(r.id) : undefined) ?? r.parent_id
      return {
        id: r.id,
        division: r.division,
        weight: r.weight,
        wrestler: a ? `${a.first_name} ${a.last_name}` : 'Wrestler no longer on the site',
        familyId: a?.parent_id ?? null,
        parent: nameOf.get(parentId) ?? null,
        state,
        label: paymentLabel(state, r.payment_method),
        fee: fee ?? 0,
        paidByCard: state === 'paid' && r.payment_method === 'card',
        // A cash, check or waived mark an admin can clear (never a card payment).
        manualMark: r.payment_method === 'cash' || r.payment_method === 'check' || r.payment_method === 'waived' ? r.payment_method : null,
        note: r.payment_note,
      }
    })
  )
  const due = siteRows.filter((r) => r.state === 'due').length
  const filled = distinctRegisteredCount(entries, registrations, t.entry_fee_cents)
  const allotted = details?.spots_allotted ?? null
  const spots = spotsLine(filled, allotted)
  const over = allotted !== null && filled > allotted
  const rosterRows: CombinedRosterRow[] = [
    ...rows.map((r) => ({
      source: 'trackwrestling' as const,
      division: r.division,
      weight: r.weight,
      wrestler: r.wrestler,
      externalName: r.externalName,
      paid: r.paid ? 'Yes' : 'No',
    })),
    ...siteRows.map((r) => ({ source: 'site' as const, division: r.division, weight: r.weight, wrestler: r.wrestler, externalName: null, paid: r.label })),
  ]
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
          {spots && <p className={`text-base font-medium ${over ? 'text-red-400' : 'text-clw-white'}`}>{spots}</p>}
        </div>
      </div>

      {clubUrl && (
        <div className="space-y-2 print:hidden">
          <a
            href={clubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-clw-gold px-4 py-2 text-center text-base font-semibold text-clw-gold transition-colors hover:bg-clw-gold hover:text-clw-black sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 shrink-0" /> Open club registrations on TrackWrestling
          </a>
          <p className="text-base text-clw-gray">Opens in a new tab. Copy the Wrestler List there and paste it below.</p>
        </div>
      )}

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
            <div className="flex flex-wrap gap-2">
              <Button asChild className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto">
                <Link href={`/admin/communications?audience=tournament_registrants&tournament=${t.id}`}>
                  <Mail className="mr-2 h-4 w-4 shrink-0" /> Message these families
                </Link>
              </Button>
              <RosterTools tournament={{ name: t.name, date: t.date }} rows={rosterRows} />
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

        </section>
      )}

      {siteRows.length > 0 && (
        <section className="space-y-4 print:hidden">
          <div className="space-y-2">
            <h2 className="text-2xl font-display text-clw-white">
              Registered on our site <span className="text-clw-gray">({siteRows.length})</span>
            </h2>
            <p className="text-base text-clw-gray">
              Families who signed up here{t.entry_fee_cents ? `, at ${dollars(t.entry_fee_cents)} per wrestler` : ''}.
              {due > 0 && ` ${due} still ${due === 1 ? 'owes' : 'owe'} the entry fee, so ${due === 1 ? 'that wrestler is' : 'they are'} not counted as registered yet.`}
            </p>
            {entries.length === 0 && <RosterTools tournament={{ name: t.name, date: t.date }} rows={rosterRows} />}
          </div>
          <ul className="divide-y divide-clw-gold/10 rounded-xl border border-clw-gold/10 bg-clw-black">
            {siteRows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="min-w-0 flex-1 basis-56">
                  {r.familyId ? (
                    <Link href={`/admin/families/${r.familyId}`} className="text-base font-medium text-clw-white hover:text-clw-gold">
                      {r.wrestler}
                    </Link>
                  ) : (
                    <span className="text-base font-medium text-clw-white">{r.wrestler}</span>
                  )}
                  <span className="block text-base text-clw-gray">
                    {r.division ?? 'No division given'} · {r.weight ? `${r.weight} lbs` : 'No weight given'}
                  </span>
                  {r.parent && (
                    <span className="block text-base text-clw-gray">
                      {r.paidByCard ? 'Paid by' : 'Parent:'} {r.parent}
                    </span>
                  )}
                  {r.note && <span className="block text-base text-clw-gray">Note: {r.note}</span>}
                </span>
                <Badge variant="outline" className={`whitespace-nowrap ${PAYMENT_STYLES[r.state]}`}>
                  {r.label}
                </Badge>
                {r.state === 'due' && <SitePaymentActions registrationId={r.id} wrestler={r.wrestler} amount={dollars(r.fee)} />}
                {r.manualMark && <ClearPaymentAction registrationId={r.id} wrestler={r.wrestler} mark={r.manualMark} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rosterRows.length > 0 && (
        /* Plain black-on-white copy for paper: the TrackWrestling list and our site's registrations. */
        <div className="hidden text-black print:block">
          <h1 className="text-2xl font-bold">{t.name}</h1>
          <p className="mb-4 text-base">
            {longDate(t.date)} · {t.location}, {t.city}, {t.state} · {rows.length} on the TrackWrestling list
            {lastPaste ? ` (as of ${clubTime(lastPaste.imported_at)})` : ''}, {siteRows.length} registered on our site
            {spots ? ` · ${spots}` : ''}
          </p>
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                {['Division', 'Weight', 'Wrestler', 'Paid', 'Source'].map((h) => (
                  <th key={h} className="border-b-2 border-black py-1 pr-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rosterRows.map((r, i) => (
                <tr key={`${r.source}-${i}`}>
                  <td className="border-b border-gray-300 py-1 pr-3">{r.division ?? ''}</td>
                  <td className="border-b border-gray-300 py-1 pr-3">{r.weight ?? ''}</td>
                  <td className="border-b border-gray-300 py-1 pr-3">{r.wrestler}</td>
                  <td className="border-b border-gray-300 py-1 pr-3">{r.paid}</td>
                  <td className="border-b border-gray-300 py-1 pr-3">{r.source === 'site' ? 'Our site' : 'TrackWrestling'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
