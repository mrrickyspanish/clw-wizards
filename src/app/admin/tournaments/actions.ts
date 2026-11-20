'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import { earliestStart, normalizeSessions, type NormalizedTournamentSession } from '@/lib/tournament-sessions'
import { registrationPaymentState } from '@/lib/tournament-registration'
import { MAX_STREET_ADDRESS_LENGTH, parseClubLink, parseEntryFee, parseSpots } from './tournament-admin'

// Writes go through the authenticated server client; the `admin_write_tournaments`
// RLS policy enforces that only an admin can insert/update/delete. /admin is also
// middleware-gated to admins, and every action re-checks the admin role first
// (same check as roster-actions.ts), so this is defense in depth.
//
// Admin-only fields (the TrackWrestling club registrations link and the number
// of spots) go to tournament_admin_details, never to tournaments: anyone,
// including visitors who are not signed in, can read every tournaments column.

const tournamentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required'),
  location: z.string().trim().min(1, 'Location is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required').max(2),
  status: z.enum(['open', 'not_open', 'closed', 'cancelled']),
  // Up to five sessions, each a 'HH:MM' start time and free-text divisions (B2).
  sessions: z
    .array(z.object({ start_time: z.string().optional().nullable(), divisions: z.string().optional().nullable() }))
    .max(20)
    .default([]),
  street_address: z
    .string()
    .trim()
    .max(MAX_STREET_ADDRESS_LENGTH, `Street address must be ${MAX_STREET_ADDRESS_LENGTH} characters or less`)
    .optional()
    .nullable(),
  weigh_in_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal('')),
  weigh_in_time: z.string().trim().optional().nullable(),
  weigh_in_location: z.string().trim().optional().nullable(),
  external_platform: z.enum(['trackwrestling', 'flowrestling', 'internal', 'other']).optional().nullable(),
  external_registration_url: z.string().trim().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  practice_groups: z.array(z.enum(ORG.practiceGroups as unknown as [string, ...string[]])).default([]),
  competition_level: z.string().trim().optional().nullable(),
  image_url: z.string().trim().url('Flyer image must be a valid URL').optional().nullable().or(z.literal('')),
  notes: z.string().trim().optional().nullable(),
  // "Cost per wrestler" as typed, in dollars (B4). Blank: no in-house payment.
  entry_fee: z.string().optional().nullable(),
  // Admin only (B5, B6). Saved to tournament_admin_details.
  club_registrations_url: z.string().optional().nullable(),
  spots_allotted: z.string().optional().nullable(),
})

export type TournamentInput = z.input<typeof tournamentSchema>
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; id?: string }

const ADMIN_ONLY = 'Admin access required.'

async function adminClient() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, is_active, full_name').eq('id', user.id).single()
  return profile?.role === 'admin' && profile.is_active ? { supabase, userId: user.id, name: profile.full_name ?? null } : null
}

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

type NormalizedForm =
  | {
      ok: true
      tournament: ReturnType<typeof tournamentPayload>
      sessions: NormalizedTournamentSession[]
      details: { club_registrations_url: string | null; spots_allotted: number | null }
    }
  | { ok: false; error: string }

function tournamentPayload(parsed: z.output<typeof tournamentSchema>, sessions: NormalizedTournamentSession[], entryFeeCents: number | null) {
  return {
    name: parsed.name,
    date: parsed.date,
    location: parsed.location,
    city: parsed.city,
    state: parsed.state.toUpperCase(),
    status: parsed.status,
    // Always the earliest session start, so the homepage, ticker, reminders
    // and calendar keep reading one start time. No sessions: no start time.
    start_time: earliestStart(sessions),
    street_address: parsed.street_address || null,
    entry_fee_cents: entryFeeCents,
    weigh_in_date: parsed.weigh_in_date || null,
    weigh_in_time: parsed.weigh_in_time || null,
    weigh_in_location: parsed.weigh_in_location || null,
    external_platform: parsed.external_platform || null,
    external_registration_url: parsed.external_registration_url || null,
    practice_groups: parsed.practice_groups,
    competition_level: parsed.competition_level || null,
    image_url: parsed.image_url || null,
    notes: parsed.notes || null,
  }
}

// Splits the form into the public tournaments row, the sessions and the
// admin-only details. The club link and spots are never in the tournaments row.
function normalize(values: TournamentInput): NormalizedForm {
  const result = tournamentSchema.safeParse(values)
  if (!result.success) return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid input' }
  const parsed = result.data

  const sessions = normalizeSessions(parsed.sessions)
  if (!sessions.ok) return sessions
  const fee = parseEntryFee(parsed.entry_fee)
  if (!fee.ok) return fee
  const link = parseClubLink(parsed.club_registrations_url)
  if (!link.ok) return link
  const spots = parseSpots(parsed.spots_allotted)
  if (!spots.ok) return spots

  return {
    ok: true,
    tournament: tournamentPayload(parsed, sessions.sessions, fee.cents),
    sessions: sessions.sessions,
    details: { club_registrations_url: link.url, spots_allotted: spots.spots },
  }
}

// Sessions and admin details are saved after the tournament row. Returns what
// did not save, or null when everything did.
async function saveSessionsAndDetails(
  supabase: Supabase,
  userId: string,
  tournamentId: string,
  form: Extract<NormalizedForm, { ok: true }>,
  isNew: boolean
): Promise<string | null> {
  const problems: string[] = []

  if (!isNew || form.sessions.length > 0) {
    const { error } = await supabase.rpc('replace_tournament_sessions', {
      p_tournament: tournamentId,
      p_sessions: form.sessions.map((s) => ({ start_time: s.start_time, divisions: s.divisions })),
    })
    if (error) problems.push(`The sessions did not save (${error.message}).`)
  }

  const { club_registrations_url, spots_allotted } = form.details
  if (club_registrations_url !== null || spots_allotted !== null) {
    const { error } = await supabase
      .from('tournament_admin_details')
      .upsert({ tournament_id: tournamentId, club_registrations_url, spots_allotted, updated_by: userId }, { onConflict: 'tournament_id' })
    if (error) problems.push(`The club link and spots did not save (${error.message}).`)
  } else if (!isNew) {
    const { error } = await supabase.from('tournament_admin_details').delete().eq('tournament_id', tournamentId)
    if (error) problems.push(`The club link and spots did not clear (${error.message}).`)
  }

  return problems.length ? `The tournament saved, but: ${problems.join(' ')} Save again to retry.` : null
}

export async function createTournament(values: TournamentInput): Promise<ActionResult> {
  const admin = await adminClient()
  if (!admin) return { ok: false, error: ADMIN_ONLY }
  const form = normalize(values)
  if (!form.ok) return form

  const { supabase, userId } = admin
  const { data, error } = await supabase.from('tournaments').insert(form.tournament).select('id').single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not save the tournament.' }

  const problem = await saveSessionsAndDetails(supabase, userId, data.id, form, true)
  revalidatePath('/admin/tournaments')
  // The id lets the dialog save the rest again as an edit, not a second tournament.
  return problem ? { ok: false, error: problem, id: data.id } : { ok: true, id: data.id }
}

export async function updateTournament(id: string, values: TournamentInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing tournament id' }
  const admin = await adminClient()
  if (!admin) return { ok: false, error: ADMIN_ONLY }
  const form = normalize(values)
  if (!form.ok) return form

  const { supabase, userId } = admin
  const { error } = await supabase.from('tournaments').update(form.tournament).eq('id', id)
  if (error) return { ok: false, error: error.message }

  const problem = await saveSessionsAndDetails(supabase, userId, id, form, false)
  revalidatePath('/admin/tournaments')
  revalidatePath(`/admin/tournaments/${id}`)
  return problem ? { ok: false, error: problem, id } : { ok: true, id }
}

export async function deleteTournament(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing tournament id' }
  const admin = await adminClient()
  if (!admin) return { ok: false, error: ADMIN_ONLY }
  const { supabase } = admin

  // Paid entries keep the tournament, so a payment is never left pointing at nothing.
  const { data: paid, error: paidError } = await supabase
    .from('tournament_registrations')
    .select('id')
    .eq('tournament_id', id)
    .gt('paid_cents', 0)
    .limit(1)
  if (paidError) return { ok: false, error: 'Could not check this tournament for paid entries. Try again.' }
  if ((paid ?? []).length > 0) {
    return {
      ok: false,
      error:
        'Families have paid for this tournament, so it cannot be deleted. Set its status to Cancelled instead, and refund anyone who should get their money back.',
    }
  }

  // A family may be paying right now (an open checkout, see CHECKOUT_OPEN_MS)
  // or has paid by card. Deleting would leave that money pointing at nothing,
  // so keep the tournament.
  const { data: checkouts, error: checkoutError } = await supabase
    .from('tournament_checkouts')
    .select('id, status, created_at')
    .eq('tournament_id', id)
    .in('status', ['pending', 'paid', 'partially_refunded'])
  if (checkoutError) return { ok: false, error: 'Could not check this tournament for card payments. Try again.' }
  const openSince = Date.now() - CHECKOUT_OPEN_MS
  const live = (checkouts ?? []).some((c) => c.status !== 'pending' || Date.parse(c.created_at) >= openSince)
  if (live) {
    return {
      ok: false,
      error: 'A family is paying for this tournament right now, or has paid. Set its status to Cancelled instead.',
    }
  }

  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/tournaments')
  return { ok: true }
}

// How long a pending card checkout blocks a delete. Tournament checkout
// sessions expire after 31 minutes (CLW-ENG-004); one hour leaves margin for
// a late webhook. Paid and partially refunded checkouts always block.
const CHECKOUT_OPEN_MS = 60 * 60 * 1000

// "Mark paid (cash or check)" and "Waive fee" on the roster page (B4). The
// admin's own client writes the payment columns; the database trigger lets an
// admin through and keeps everyone else out.
const manualSchema = z.object({ registrationId: z.string().uuid(), method: z.enum(['cash', 'check', 'waived']) })

async function recordManualPayment(registrationId: string, method: 'cash' | 'check' | 'waived'): Promise<ActionResult> {
  const admin = await adminClient()
  if (!admin) return { ok: false, error: ADMIN_ONLY }
  const parsed = manualSchema.safeParse({ registrationId, method })
  if (!parsed.success) return { ok: false, error: 'Registration not found.' }
  const { supabase } = admin

  const { data: reg } = await supabase
    .from('tournament_registrations')
    .select('id, tournament_id, status, fee_cents, paid_cents, payment_method')
    .eq('id', parsed.data.registrationId)
    .maybeSingle()
  if (!reg) return { ok: false, error: 'Registration not found.' }
  const { data: tournament } = await supabase.from('tournaments').select('entry_fee_cents').eq('id', reg.tournament_id).maybeSingle()

  const fee = reg.fee_cents ?? tournament?.entry_fee_cents ?? null
  const state = registrationPaymentState({ feeCents: fee, paidCents: reg.paid_cents, paymentMethod: reg.payment_method, status: reg.status })
  if (state === 'withdrawn') return { ok: false, error: 'This wrestler was withdrawn.' }
  if (state === 'paid') return { ok: false, error: 'This entry is already paid.' }
  if (state === 'waived') return { ok: false, error: 'This entry is already waived.' }
  if (state === 'free' || fee === null) return { ok: false, error: 'This tournament has no cost, so there is nothing to collect.' }

  const now = new Date().toISOString()
  const values =
    parsed.data.method === 'waived'
      ? { fee_cents: fee, payment_method: 'waived' as const, paid_at: now }
      : { fee_cents: fee, paid_cents: fee, payment_method: parsed.data.method, paid_at: now }
  // Only if nothing changed since it was read (a card payment landing at the same moment).
  let update = supabase.from('tournament_registrations').update(values).eq('id', reg.id).eq('paid_cents', reg.paid_cents)
  update = reg.payment_method === null ? update.is('payment_method', null) : update.eq('payment_method', reg.payment_method)
  const { data: changed, error } = await update.select('id')
  if (error) return { ok: false, error: 'Could not save that. Try again.' }
  if (!changed || changed.length === 0) return { ok: false, error: 'This entry changed while you were looking. Refresh the page and try again.' }

  revalidatePath(`/admin/tournaments/${reg.tournament_id}`)
  revalidatePath('/admin/tournaments')
  return { ok: true }
}

export async function markRegistrationPaid(registrationId: string, method: 'cash' | 'check'): Promise<ActionResult> {
  if (method !== 'cash' && method !== 'check') return { ok: false, error: 'Choose cash or check.' }
  return recordManualPayment(registrationId, method)
}

export async function waiveRegistrationFee(registrationId: string): Promise<ActionResult> {
  return recordManualPayment(registrationId, 'waived')
}

// "Clear payment": undoes a cash, check or waived mark made by mistake. Never
// a card payment (those change only through a refund in Stripe, which the
// webhook records), and never while a card payment also covers the entry,
// because that card money would then be hidden. There is no audit table, so
// the note on the registration records who cleared it and when.
export async function clearManualPayment(registrationId: string): Promise<ActionResult> {
  const admin = await adminClient()
  if (!admin) return { ok: false, error: ADMIN_ONLY }
  if (!z.string().uuid().safeParse(registrationId).success) return { ok: false, error: 'Registration not found.' }
  const { supabase, name } = admin

  const { data: reg } = await supabase
    .from('tournament_registrations')
    .select('id, tournament_id, paid_cents, payment_method, payment_note')
    .eq('id', registrationId)
    .maybeSingle()
  if (!reg) return { ok: false, error: 'Registration not found.' }
  const mark = reg.payment_method
  if (mark === 'card') return { ok: false, error: 'Card payments change only through a refund in Stripe.' }
  if (mark !== 'cash' && mark !== 'check' && mark !== 'waived') {
    return { ok: false, error: 'There is no cash, check or waived mark to clear.' }
  }

  const { data: covering, error: coverError } = await supabase
    .from('tournament_checkouts')
    .select('id')
    .contains('registration_ids', [reg.id])
    .in('status', ['paid', 'partially_refunded'])
  if (coverError) return { ok: false, error: 'Could not check for card payments on this entry. Try again.' }
  if ((covering ?? []).length > 0) {
    return { ok: false, error: 'A card payment also covers this entry. Refund one of them in Stripe or keep the mark.' }
  }

  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  const trace = `Cleared ${mark} mark by ${name || 'an admin'} on ${day}.`
  const note = (reg.payment_note ? `${trace} ${reg.payment_note}` : trace).slice(0, 200)
  // Only if nothing changed since it was read; fee_cents stays locked.
  const { data: changed, error } = await supabase
    .from('tournament_registrations')
    .update({ paid_cents: 0, paid_at: null, payment_method: null, payment_note: note })
    .eq('id', reg.id)
    .eq('paid_cents', reg.paid_cents)
    .eq('payment_method', mark)
    .select('id')
  if (error) return { ok: false, error: 'Could not save that. Try again.' }
  if (!changed || changed.length === 0) return { ok: false, error: 'This entry changed while you were looking. Refresh the page and try again.' }

  revalidatePath(`/admin/tournaments/${reg.tournament_id}`)
  revalidatePath('/admin/tournaments')
  return { ok: true }
}
