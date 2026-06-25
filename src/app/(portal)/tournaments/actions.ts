'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Writes go through the authenticated server client. The `parents_own_registrations`
// RLS policy (parent_id = auth.uid()) means a parent can only ever create or
// change registrations they own — no admin client needed.

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

  // Confirm every athlete actually belongs to this parent before inserting.
  // RLS would reject a foreign athlete anyway, but this gives a clean error.
  const { data: ownAthletes } = await supabase
    .from('athletes')
    .select('id')
    .eq('parent_id', user.id)
    .in('id', athleteIds)
  const ownedIds = new Set((ownAthletes ?? []).map((a) => a.id))
  if (athleteIds.some((id) => !ownedIds.has(id))) {
    return { ok: false, error: 'One or more athletes are not on your roster.' }
  }

  // upsert on the unique (tournament_id, athlete_id) so re-registering an
  // athlete is idempotent rather than a duplicate-key error.
  const { error } = await supabase.from('tournament_registrations').upsert(
    athleteIds.map((athleteId) => ({
      tournament_id: tournamentId,
      athlete_id: athleteId,
      parent_id: user.id,
      status: 'registered',
    })),
    { onConflict: 'tournament_id,athlete_id' }
  )
  if (error) return { ok: false, error: error.message }

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

  // RLS scopes this to the parent's own registrations; the parent_id filter is
  // belt-and-suspenders.
  const { error } = await supabase
    .from('tournament_registrations')
    .update({ status: 'withdrawn' })
    .eq('id', parsed.data.registrationId)
    .eq('parent_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/tournaments')
  return { ok: true }
}
