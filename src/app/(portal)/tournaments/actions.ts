'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { entryIsLocked } from '@/lib/payments/tournament-checkout'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Writes go through the authenticated server client, so the database's own
// rules apply on top of the checks here: a registration may be written only by
// someone who guards the wrestler (treg_guardian_all plus the restrictive
// treg_guarded_* policies, migration 20261120000005), and a paid row cannot be
// deleted by a parent. Paid tournaments register through POST /api/checkout.

// Same words as the page shows next to a paid entry (default A5).
const PAID_ENTRY_REFUSAL = 'Paid entries are withdrawn by the club. Contact the club to change this.'
const NOT_YOURS = 'One or more athletes are not on your roster.'

type Db = Awaited<ReturnType<typeof createServerSupabase>>

/**
 * The wrestlers in `athleteIds` the signed-in user guards, the same rule as
 * guards_athlete() in the database: the wrestler's parent, a whole-family
 * co-parent, or a co-parent whose link lists the wrestler (locked or not:
 * tournament entries only add, 20261002000002). Returns null on a read error.
 */
async function guardedAthleteIds(supabase: Db, userId: string, athleteIds: string[]): Promise<Set<string> | null> {
  const { data: athletes, error } = await supabase.from('athletes').select('id, parent_id').in('id', athleteIds)
  if (error) return null
  const rows = athletes ?? []
  const guarded = new Set(rows.filter((a) => a.parent_id === userId).map((a) => a.id))
  if (rows.some((a) => a.parent_id !== userId)) {
    const { data: links, error: linkError } = await supabase
      .from('family_guardians')
      .select('owner_id, athlete_ids')
      .eq('guardian_id', userId)
    if (linkError) return null
    for (const a of rows) {
      if (
        a.parent_id !== userId &&
        (links ?? []).some((l) => l.owner_id === a.parent_id && (l.athlete_ids === null || l.athlete_ids.includes(a.id)))
      ) {
        guarded.add(a.id)
      }
    }
  }
  return guarded
}

/** A refusal from row-level security (or a missing grant), in plain words. */
function isPermissionDenied(error: { code?: string; message?: string }) {
  return error.code === '42501' || /row-level security|permission denied/i.test(error.message ?? '')
}

const registerSchema = z.object({
  tournamentId: z.string().uuid(),
  athleteIds: z.array(z.string().uuid()).min(1, 'Pick at least one athlete'),
})

export async function registerAthletes(values: z.input<typeof registerSchema>): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { tournamentId, athleteIds } = parsed.data

  // Only open tournaments accept registrations, and only tournaments that
  // register through our system (no external URL) — the rest send parents off
  // to TrackWrestling/Flo, so there's nothing for us to record. A tournament
  // with a cost registers through checkout, so the entry is paid.
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('status, external_registration_url, entry_fee_cents')
    .eq('id', tournamentId)
    .single()
  if (tErr || !tournament) return { ok: false, error: 'Tournament not found' }
  if (tournament.status !== 'open') return { ok: false, error: 'This tournament is not open for registration.' }
  if (tournament.external_registration_url) {
    return { ok: false, error: 'This tournament registers through an external site.' }
  }
  if (tournament.entry_fee_cents != null) {
    return { ok: false, error: 'This tournament takes payment. Use Register and pay on the tournament card.' }
  }

  // Every wrestler must be one this user guards: their own, or one a
  // co-parent link covers. The database refuses the rest anyway; this gives
  // a clean message.
  const guarded = await guardedAthleteIds(supabase, user.id, athleteIds)
  if (!guarded) return { ok: false, error: 'Could not check your wrestlers. Please try again.' }
  if (athleteIds.some((id) => !guarded.has(id))) return { ok: false, error: NOT_YOURS }

  // The signed-in user becomes parent_id only on a new registration, the same
  // rule as Register and pay (src/lib/payments/tournament-checkout.ts): an
  // existing row (say, withdrawn and now signed up again by a co-parent) keeps
  // the parent_id it has and only goes back to registered. A confirmed row is
  // left as it is.
  const { data: existingRows, error: existingError } = await supabase
    .from('tournament_registrations')
    .select('id, athlete_id, status')
    .eq('tournament_id', tournamentId)
    .in('athlete_id', athleteIds)
  if (existingError) return { ok: false, error: 'Could not check your registrations. Please try again.' }
  const existing = new Map((existingRows ?? []).map((r) => [r.athlete_id, r]))
  const notSaved = 'The registration was not saved. Refresh the page and try again, or contact the club.'

  const reopen = [...existing.values()].filter((r) => r.status !== 'registered' && r.status !== 'confirmed').map((r) => r.id)
  if (reopen.length) {
    const { data: reopened, error } = await supabase
      .from('tournament_registrations')
      .update({ status: 'registered' as const })
      .in('id', reopen)
      .select('id')
    if (error) return { ok: false, error: isPermissionDenied(error) ? NOT_YOURS : error.message }
    if ((reopened ?? []).length < reopen.length) return { ok: false, error: notSaved }
  }

  const fresh = athleteIds.filter((athleteId) => !existing.has(athleteId))
  if (fresh.length) {
    // ignoreDuplicates: a row someone else created a moment ago is never
    // overwritten (it comes back short, and the family is asked to refresh).
    const { data: saved, error } = await supabase
      .from('tournament_registrations')
      .upsert(
        fresh.map((athleteId) => ({
          tournament_id: tournamentId,
          athlete_id: athleteId,
          parent_id: user.id,
          status: 'registered' as const,
        })),
        { onConflict: 'tournament_id,athlete_id', ignoreDuplicates: true }
      )
      .select('id')
    if (error) return { ok: false, error: isPermissionDenied(error) ? NOT_YOURS : error.message }
    if ((saved ?? []).length < fresh.length) return { ok: false, error: notSaved }
  }

  revalidatePath('/tournaments')
  return { ok: true }
}

const withdrawSchema = z.object({ registrationId: z.string().uuid() })

export async function withdrawRegistration(values: z.input<typeof withdrawSchema>): Promise<ActionResult> {
  const parsed = withdrawSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { data: registration, error: readError } = await supabase
    .from('tournament_registrations')
    .select('id, athlete_id, status, paid_cents, payment_method')
    .eq('id', parsed.data.registrationId)
    .maybeSingle()
  if (readError) return { ok: false, error: 'Could not load this registration. Please try again.' }
  if (!registration) return { ok: false, error: 'Registration not found.' }

  // The wrestler's parent or a linked co-parent, not only whoever made the row
  // (a co-parent used to see Withdraw and have it silently do nothing).
  const guarded = await guardedAthleteIds(supabase, user.id, [registration.athlete_id])
  if (!guarded) return { ok: false, error: 'Could not check your wrestlers. Please try again.' }
  if (!guarded.has(registration.athlete_id)) return { ok: false, error: NOT_YOURS }

  // Default A5: no self-service refunds, so a paid entry stays.
  if (entryIsLocked(registration)) return { ok: false, error: PAID_ENTRY_REFUSAL }

  // The payment filters make this safe against a payment landing between the
  // read above and this update: a row that became paid matches nothing. A row
  // the database will not let this user change also matches nothing (0 rows,
  // no error), so the count is checked.
  const { data: updated, error } = await supabase
    .from('tournament_registrations')
    .update({ status: 'withdrawn' })
    .eq('id', registration.id)
    .eq('paid_cents', 0)
    .is('payment_method', null)
    .select('id')
  if (error) {
    return { ok: false, error: isPermissionDenied(error) ? NOT_YOURS : error.message }
  }
  if ((updated ?? []).length === 0) {
    return { ok: false, error: 'This entry could not be withdrawn. Refresh the page, or contact the club if it keeps happening.' }
  }

  revalidatePath('/tournaments')
  return { ok: true }
}
