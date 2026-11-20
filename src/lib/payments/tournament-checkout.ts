import type Stripe from 'stripe'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import { MAX_WRESTLERS_PER_CHECKOUT, checkoutTotal, parseWeight } from '@/lib/tournament-registration'
import type { TournamentRegistration } from '@/types/database'

/**
 * Paying for in-house tournament entries on the club site (Tyler, Nov 14: B4).
 *
 * POST /api/checkout { flow: 'tournament', tournamentId, entries, returnPath? }
 * The body never carries an amount: the price is the tournament's
 * entry_fee_cents, read here, times the number of wrestlers. The club absorbs
 * Stripe's fee, the same as dues (decision D2, default A).
 *
 * Steps, all with the service role after the checks pass:
 *   1. lock fee_cents on each registration (record_tournament_payment refuses
 *      a registration without one);
 *   2. insert ONE tournament_checkouts row for this Stripe session;
 *   3. create the Stripe session with that row's id in its metadata;
 *   4. save the session id on the row.
 * The Stripe webhook records the payment against the row exactly once.
 */

export type TournamentCheckoutEntry = {
  athleteId: string
  weight: string | number
  division: string
  grade?: string | null
}

export type TournamentCheckoutBody = {
  flow: 'tournament'
  tournamentId: string
  entries: TournamentCheckoutEntry[]
  returnPath?: string
}

export type TournamentCheckoutResult =
  | { ok: true; url: string | null }
  | { ok: false; status: number; code: string; error: string }

/**
 * Stripe's shortest session lifetime is 30 minutes after the session is
 * created. One extra minute keeps the value valid when it reaches Stripe a
 * moment after it was computed here (a value under 30 minutes is refused).
 */
export const CHECKOUT_SESSION_MINUTES = 31

export function sessionExpiresAt(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000) + CHECKOUT_SESSION_MINUTES * 60
}

export const MAX_DIVISION_LENGTH = 60
export const MAX_GRADE_LENGTH = 20

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CleanEntry = { athleteId: string; weight: string; division: string; grade: string | null }

function refuse(status: number, code: string, error: string): TournamentCheckoutResult {
  return { ok: false, status, code, error }
}

/**
 * A paid entry stays paid: it cannot be paid again, and the family cannot
 * withdraw it in the portal (default A5). True once any money or an admin's
 * cash, check or waived mark is on the registration.
 */
export function entryIsLocked(
  registration: Pick<TournamentRegistration, 'paid_cents' | 'payment_method'> | null | undefined
): boolean {
  return Boolean(registration && ((registration.paid_cents ?? 0) > 0 || registration.payment_method != null))
}

/** Checks the request shape. Ids must be uuids, so nothing odd reaches a database filter. */
export function parseTournamentCheckout(
  body: unknown
): { ok: true; tournamentId: string; entries: CleanEntry[] } | { ok: false; status: number; code: string; error: string } {
  const b = (body ?? {}) as Partial<TournamentCheckoutBody>
  if (typeof b.tournamentId !== 'string' || !UUID.test(b.tournamentId) || !Array.isArray(b.entries)) {
    return { ok: false, status: 400, code: 'BAD-REQUEST', error: 'Invalid registration request.' }
  }
  if (b.entries.length === 0) {
    return { ok: false, status: 400, code: 'NO-WRESTLERS', error: 'Pick at least one wrestler.' }
  }
  if (b.entries.length > MAX_WRESTLERS_PER_CHECKOUT) {
    return {
      ok: false,
      status: 400,
      code: 'TOO-MANY-WRESTLERS',
      error: `Register at most ${MAX_WRESTLERS_PER_CHECKOUT} wrestlers at a time.`,
    }
  }
  const entries: CleanEntry[] = []
  const seen = new Set<string>()
  for (const raw of b.entries) {
    const e = (raw ?? {}) as Partial<TournamentCheckoutEntry>
    if (typeof e.athleteId !== 'string' || !UUID.test(e.athleteId)) {
      return { ok: false, status: 400, code: 'BAD-REQUEST', error: 'Invalid registration request.' }
    }
    const athleteId = e.athleteId.toLowerCase()
    if (seen.has(athleteId)) {
      return { ok: false, status: 400, code: 'DUPLICATE-WRESTLER', error: 'Each wrestler can be entered once.' }
    }
    seen.add(athleteId)
    const weight = parseWeight(typeof e.weight === 'number' || typeof e.weight === 'string' ? e.weight : null)
    if (!weight) {
      return { ok: false, status: 400, code: 'WEIGHT-INVALID', error: "Enter each wrestler's weight in pounds, from 30 to 300." }
    }
    const division = typeof e.division === 'string' ? e.division.trim() : ''
    if (!division || division.length > MAX_DIVISION_LENGTH) {
      return { ok: false, status: 400, code: 'DIVISION-INVALID', error: 'Enter a division for each wrestler (60 characters or less).' }
    }
    const grade = typeof e.grade === 'string' ? e.grade.trim() : ''
    if (grade.length > MAX_GRADE_LENGTH) {
      return { ok: false, status: 400, code: 'GRADE-INVALID', error: 'Keep the grade to 20 characters or less.' }
    }
    entries.push({ athleteId, weight, division, grade: grade || null })
  }
  return { ok: true, tournamentId: b.tournamentId.toLowerCase(), entries }
}

export async function checkoutTournament(params: {
  stripe: Stripe
  body: unknown
  successUrl: string
  cancelUrl: string
}): Promise<TournamentCheckoutResult> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return refuse(401, 'SIGNED-OUT', 'You must be signed in to register for a tournament.')

  const parsed = parseTournamentCheckout(params.body)
  if (!parsed.ok) return parsed
  const { tournamentId, entries } = parsed
  const athleteIds = entries.map((e) => e.athleteId)

  const admin = createAdminSupabase()
  const { data: tournament, error: tournamentError } = await admin
    .from('tournaments')
    .select('id, name, status, external_registration_url, entry_fee_cents')
    .eq('id', tournamentId)
    .maybeSingle()
  if (tournamentError) throw new Error(`Could not read tournament ${tournamentId}: ${tournamentError.message}`)
  if (!tournament) return refuse(404, 'TOURNAMENT-NOT-FOUND', 'Tournament not found.')
  if (tournament.status !== 'open') {
    return refuse(400, 'TOURNAMENT-NOT-OPEN', 'This tournament is not open for registration.')
  }
  if (tournament.external_registration_url) {
    return refuse(400, 'TOURNAMENT-EXTERNAL', 'This tournament registers through an outside site, not here.')
  }
  const fee = tournament.entry_fee_cents
  if (fee == null) {
    return refuse(400, 'TOURNAMENT-NO-FEE', 'This tournament does not take payment on the club site.')
  }
  const total = checkoutTotal(fee, entries.length)
  if (total == null) return refuse(400, 'FEE-OUT-OF-RANGE', 'This tournament cannot be paid online. Contact the club.')

  // Guardianship, the same rule as guards_athlete() and the dues checkout: the
  // wrestler's parent, a whole-family co-parent, or a co-parent whose link
  // lists this wrestler.
  const { data: athleteRows, error: athleteError } = await admin
    .from('athletes')
    .select('id, parent_id, first_name, last_name, active')
    .in('id', athleteIds)
  if (athleteError) throw new Error(`Could not read wrestlers: ${athleteError.message}`)
  const athletes = new Map((athleteRows ?? []).map((a) => [a.id, a]))
  if (athleteIds.some((id) => !athletes.has(id))) {
    return refuse(403, 'NOT-YOUR-WRESTLER', 'You can only register wrestlers on your family account.')
  }
  const otherOwners = [...new Set([...athletes.values()].map((a) => a.parent_id).filter((id) => id !== user.id))]
  if (otherOwners.length) {
    const { data: links, error: linkError } = await admin
      .from('family_guardians')
      .select('owner_id, athlete_ids')
      .eq('guardian_id', user.id)
      .in('owner_id', otherOwners)
    if (linkError) throw new Error(`Could not read family links: ${linkError.message}`)
    const covered = (athleteId: string, ownerId: string) =>
      (links ?? []).some((l) => l.owner_id === ownerId && (l.athlete_ids === null || l.athlete_ids.includes(athleteId)))
    for (const a of athletes.values()) {
      if (a.parent_id !== user.id && !covered(a.id, a.parent_id)) {
        return refuse(403, 'NOT-YOUR-WRESTLER', 'You can only register wrestlers on your family account.')
      }
    }
  }
  for (const id of athleteIds) {
    const a = athletes.get(id)!
    if (!a.active) {
      return refuse(400, 'WRESTLER-INACTIVE', `${a.first_name} ${a.last_name} is not active on the club roster. Contact the club.`)
    }
  }

  const { data: existingRows, error: existingError } = await admin
    .from('tournament_registrations')
    .select('id, athlete_id, status, paid_cents, payment_method')
    .eq('tournament_id', tournamentId)
    .in('athlete_id', athleteIds)
  if (existingError) throw new Error(`Could not read registrations: ${existingError.message}`)
  const existing = new Map((existingRows ?? []).map((r) => [r.athlete_id, r]))
  for (const id of athleteIds) {
    if (entryIsLocked(existing.get(id))) {
      const a = athletes.get(id)!
      return refuse(400, 'ALREADY-PAID', `${a.first_name} ${a.last_name} is already paid for this tournament.`)
    }
  }

  // 1. Register and lock the price. Payment columns other than fee_cents are
  //    left alone, so nothing here marks an entry paid. The payer becomes
  //    parent_id only on a new registration: an existing row keeps the
  //    parent_id it has, so paying never hands a co-parent lasting access to
  //    the row (the payer is kept on tournament_checkouts.payer_id).
  const details = (e: CleanEntry) => ({
    status: existing.get(e.athleteId)?.status === 'confirmed' ? ('confirmed' as const) : ('registered' as const),
    weight: e.weight,
    division: e.division,
    grade: e.grade,
    fee_cents: fee,
  })
  const savedIds = new Map<string, string>()
  for (const e of entries.filter((entry) => existing.has(entry.athleteId))) {
    const row = existing.get(e.athleteId)!
    const { error: updateError } = await admin.from('tournament_registrations').update(details(e)).eq('id', row.id)
    if (updateError) throw new Error(`Could not save registrations: ${updateError.message}`)
    savedIds.set(e.athleteId, row.id)
  }
  const fresh = entries.filter((entry) => !existing.has(entry.athleteId))
  if (fresh.length) {
    const { data: inserted, error: insertError } = await admin
      .from('tournament_registrations')
      .insert(fresh.map((e) => ({ tournament_id: tournamentId, athlete_id: e.athleteId, parent_id: user.id, ...details(e) })))
      .select('id, athlete_id')
    if (insertError) throw new Error(`Could not save registrations: ${insertError.message}`)
    for (const r of inserted ?? []) savedIds.set(r.athlete_id, r.id)
  }
  const registrationIds = athleteIds.map((id) => savedIds.get(id))
  if (registrationIds.some((id) => !id)) throw new Error('Saved registrations did not come back for every wrestler.')

  // 2. One checkout row for this one Stripe session.
  const { data: checkout, error: checkoutError } = await admin
    .from('tournament_checkouts')
    .insert({
      tournament_id: tournamentId,
      tournament_name: tournament.name,
      payer_id: user.id,
      registration_ids: registrationIds as string[],
      athlete_ids: athleteIds,
      amount_cents: total,
      status: 'pending',
    })
    .select('id')
    .single()
  if (checkoutError || !checkout) throw new Error(`Could not start the checkout record: ${checkoutError?.message ?? 'no row'}`)

  // 3. The Stripe session. Unit price and quantity come from the database.
  let session: Stripe.Checkout.Session
  try {
    session = await params.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: [
        {
          quantity: entries.length,
          price_data: {
            currency: 'usd',
            unit_amount: fee,
            product_data: { name: `${ORG.shortName} tournament entry: ${tournament.name}` },
          },
        },
      ],
      metadata: { flow: 'tournament', checkout_id: checkout.id },
      // Short-lived on purpose: it narrows the window for two tabs paying the
      // same wrestler, or an entry or tournament being removed mid-payment.
      expires_at: sessionExpiresAt(),
    })
  } catch (err) {
    // No session, so nothing can pay this row. The registrations stay, showing
    // payment due, so the family can try again.
    await admin.from('tournament_checkouts').delete().eq('id', checkout.id)
    throw err
  }

  // 4. Remember which session belongs to the row.
  const { error: saveError } = await admin
    .from('tournament_checkouts')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', checkout.id)
  if (saveError) {
    // Never hand out a session the record does not know about.
    await params.stripe.checkout.sessions.expire(session.id).catch(() => undefined)
    throw new Error(`Could not save the Stripe session on checkout ${checkout.id}: ${saveError.message}`)
  }

  return { ok: true, url: session.url }
}
