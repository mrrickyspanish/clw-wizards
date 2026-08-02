'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { registrationSchema } from '@/lib/registration-schema'
import { sendRegistrationConfirmation } from './confirmation-email'
import type { Disclosure } from '@/types/database'

export type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateRegistrationSurfaces() {
  revalidatePath('/registration')
  revalidatePath('/dashboard')
  revalidatePath('/dues')
  revalidatePath('/admin/registrations')
}

/**
 * The whole annual registration, in the order the database needs it:
 * contact and wrestler details first, then signatures, then the enrollment
 * itself.
 *
 * The RPC is last on purpose. It refuses to create an enrollment while any
 * required disclosure is unsigned, so the acceptance rows must already exist
 * when it runs -- and if the RPC then rejects the submission for some other
 * reason (season closed, missing card), the family keeps their typed details
 * and signatures instead of having to re-enter everything.
 */
export async function submitRegistration(values: unknown): Promise<ActionResult> {
  const parsed = registrationSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form for missing details.' }

  const {
    seasonRegistrationId,
    athleteId,
    phone,
    street_address,
    city,
    state,
    postal_code,
    referral_source,
    grade,
    school,
    weight_lbs,
    shirt_size,
    years_experience,
    season_commitments,
    guardians,
    acceptances,
  } = parsed.data

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }
  const userId = auth.user.id

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ phone, street_address, city, state: state || null, postal_code: postal_code || null })
    .eq('id', userId)
  if (profileError) return { ok: false, error: profileError.message }

  // shirt_size and weight_class stay on the athlete as the latest known values,
  // so admin roster views and next season's form can prefill from them. The
  // enrollment row remains the record of what was true for this season.
  const { error: athleteError } = await supabase
    .from('athletes')
    .update({
      referral_source: referral_source || null,
      shirt_size,
      weight_class: String(weight_lbs),
    })
    .eq('id', athleteId)
  if (athleteError) return { ok: false, error: athleteError.message }

  const { error: guardianError } = await supabase.from('athlete_guardians').upsert(
    guardians.map((guardian) => ({
      athlete_id: athleteId,
      ordinal: guardian.ordinal,
      name: guardian.name,
      relationship: guardian.relationship || null,
      phone: guardian.phone || null,
      email: guardian.email || null,
      coach_interest: guardian.coach_interest || null,
    })),
    { onConflict: 'athlete_id,ordinal' }
  )
  if (guardianError) return { ok: false, error: guardianError.message }

  // A guardian who removes the second contact should not leave a stale one
  // behind on the record.
  if (guardians.length === 1) {
    await supabase.from('athlete_guardians').delete().eq('athlete_id', athleteId).eq('ordinal', 2)
  }

  if (acceptances.length) {
    const headerList = await headers()
    // DO NOTHING on conflict, not DO UPDATE: a family that resubmits after
    // changes_requested keeps the signature they already gave for this season,
    // and families hold only INSERT on this table -- an upsert that tried to
    // update would be refused by RLS.
    const { error: acceptanceError } = await supabase.from('disclosure_acceptances').upsert(
      acceptances.map((acceptance) => ({
        disclosure_id: acceptance.disclosureId,
        season_registration_id: seasonRegistrationId,
        athlete_id: athleteId,
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
        typed_signature: acceptance.signature,
        // Best-effort provenance. Behind a proxy the forwarded-for header is
        // the only view of the real client, and it may legitimately be absent.
        ip_address: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        user_agent: headerList.get('user-agent'),
      })),
      { onConflict: 'disclosure_id,season_registration_id,athlete_id', ignoreDuplicates: true }
    )
    if (acceptanceError) return { ok: false, error: acceptanceError.message }
  }

  // The season answers travel with the RPC rather than a direct table write:
  // season_enrollments is admin-write-only under RLS, so a parent's UPDATE
  // would silently match zero rows.
  const { error } = await supabase.rpc('submit_season_enrollment', {
    _season_registration_id: seasonRegistrationId,
    _athlete_id: athleteId,
    _grade: grade,
    _school: school,
    _weight_lbs: weight_lbs,
    _shirt_size: shirt_size,
    _years_experience: years_experience,
    _season_commitments: season_commitments,
  })
  if (error) return { ok: false, error: error.message }

  // The Google Form emailed families a copy of their answers; families expect
  // that receipt. A delivery failure must not fail a registration that the
  // database has already accepted, so this is deliberately not awaited into the
  // result.
  try {
    await sendRegistrationConfirmation({ seasonRegistrationId, athleteId, userId })
  } catch {
    // Logged inside the sender; the registration itself stands.
  }

  revalidateRegistrationSurfaces()
  return { ok: true }
}

const withdrawSchema = z.object({ enrollmentId: z.string().uuid() })

export async function withdrawSeasonEnrollment(values: z.input<typeof withdrawSchema>): Promise<ActionResult> {
  const parsed = withdrawSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid registration.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('withdraw_season_enrollment', { _enrollment_id: parsed.data.enrollmentId })
  if (error) return { ok: false, error: error.message }

  revalidateRegistrationSurfaces()
  return { ok: true }
}

/** The agreements a family must sign for the current season, newest text first. */
export async function getActiveDisclosures(): Promise<Disclosure[]> {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('disclosures').select('*').eq('active', true).order('title')
  return (data ?? []) as Disclosure[]
}
