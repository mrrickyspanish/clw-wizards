'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { resolveFamilyOwnerIds } from '@/lib/family'
import { createServerSupabase } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

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
  // to TrackWrestling/Flo, so there's nothing for us to record.
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('status, external_registration_url')
    .eq('id', tournamentId)
    .single()
  if (tErr || !tournament) return { ok: false, error: 'Tournament not found' }
  if (tournament.status !== 'open') return { ok: false, error: 'This tournament is not open for registration.' }
  if (tournament.external_registration_url) {
    return { ok: false, error: 'This tournament registers through an external site.' }
  }

  // An owner or explicit co-guardian can register the family's wrestlers. Keep
  // parent_id anchored to the actual family owner rather than the account that
  // happened to submit the form.
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, user.id)
  const { data: familyAthletes } = await supabase
    .from('athletes')
    .select('id, parent_id')
    .in('parent_id', familyOwnerIds)
    .in('id', athleteIds)
  const athleteOwnerById = new Map((familyAthletes ?? []).map((athlete) => [athlete.id, athlete.parent_id]))
  if (athleteIds.some((id) => !athleteOwnerById.has(id))) {
    return { ok: false, error: 'One or more athletes are not on your family roster.' }
  }

  // Upsert on the unique (tournament_id, athlete_id) so re-registering an
  // athlete is idempotent rather than a duplicate-key error.
  const { error } = await supabase.from('tournament_registrations').upsert(
    athleteIds.map((athleteId) => ({
      tournament_id: tournamentId,
      athlete_id: athleteId,
      parent_id: athleteOwnerById.get(athleteId)!,
      status: 'registered',
    })),
    { onConflict: 'tournament_id,athlete_id' }
  )
  if (error) return { ok: false, error: error.message }

  revalidatePath('/tournaments')
  revalidatePath('/dashboard')
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

  // Admins can read registrations outside their own family, so do not rely on
  // record visibility as authorization. Resolve the registration's athlete and
  // explicitly prove that athlete belongs to a family the caller guards.
  const { data: registration } = await supabase
    .from('tournament_registrations')
    .select('id, athlete_id')
    .eq('id', parsed.data.registrationId)
    .maybeSingle()
  if (!registration) return { ok: false, error: 'Registration not found.' }

  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, user.id)
  const { data: athlete } = await supabase
    .from('athletes')
    .select('parent_id')
    .eq('id', registration.athlete_id)
    .in('parent_id', familyOwnerIds)
    .maybeSingle()
  if (!athlete) return { ok: false, error: 'Registration not found.' }

  const { error } = await supabase
    .from('tournament_registrations')
    .update({ status: 'withdrawn' })
    .eq('id', registration.id)
    .eq('athlete_id', registration.athlete_id)
    .eq('parent_id', athlete.parent_id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/tournaments')
  revalidatePath('/dashboard')
  return { ok: true }
}
