'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'

// Writes go through the authenticated server client; the `admin_write_tournaments`
// RLS policy enforces that only an admin can insert/update/delete. /admin is also
// middleware-gated to admins, so this is defense in depth.

const tournamentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required'),
  location: z.string().trim().min(1, 'Location is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required').max(2),
  status: z.enum(['open', 'closed', 'cancelled']),
  start_time: z.string().trim().optional().nullable(),
  weigh_in_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal('')),
  weigh_in_time: z.string().trim().optional().nullable(),
  external_platform: z.enum(['trackwrestling', 'flowrestling', 'internal', 'other']).optional().nullable(),
  external_registration_url: z.string().trim().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  practice_groups: z.array(z.enum(ORG.practiceGroups as unknown as [string, ...string[]])).default([]),
  notes: z.string().trim().optional().nullable(),
})

export type TournamentInput = z.input<typeof tournamentSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalize(values: TournamentInput) {
  const parsed = tournamentSchema.parse(values)
  return {
    name: parsed.name,
    date: parsed.date,
    location: parsed.location,
    city: parsed.city,
    state: parsed.state.toUpperCase(),
    status: parsed.status,
    start_time: parsed.start_time || null,
    weigh_in_date: parsed.weigh_in_date || null,
    weigh_in_time: parsed.weigh_in_time || null,
    external_platform: parsed.external_platform || null,
    external_registration_url: parsed.external_registration_url || null,
    practice_groups: parsed.practice_groups,
    notes: parsed.notes || null,
  }
}

export async function createTournament(values: TournamentInput): Promise<ActionResult> {
  let payload
  try {
    payload = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('tournaments').insert(payload)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/tournaments')
  return { ok: true }
}

export async function updateTournament(id: string, values: TournamentInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing tournament id' }

  let payload
  try {
    payload = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('tournaments').update(payload).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/tournaments')
  return { ok: true }
}

export async function deleteTournament(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing tournament id' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/tournaments')
  return { ok: true }
}
