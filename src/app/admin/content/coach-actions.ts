'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'

// Writes go through the authenticated server client; `full_admin_write_coaches`
// RLS enforces full-admin-only, and /admin/content is middleware-gated to full
// admins (defense in depth).

const coachSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    role: z.string().trim().max(160).optional().default(''),
    section: z.enum(['board', 'practice']),
    practice_group: z.string().trim().max(60).optional().default(''),
    sort_order: z.coerce.number().int().min(0).max(999),
    active: z.boolean(),
  })
  .refine((v) => v.section !== 'practice' || v.practice_group.length > 0, {
    message: 'Pick a practice group for a practice-room coach.',
    path: ['practice_group'],
  })

export type CoachInput = z.input<typeof coachSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalize(values: CoachInput) {
  const parsed = coachSchema.parse(values)
  return {
    name: parsed.name,
    // Board members carry a title; practice coaches don't use the role field.
    role: parsed.section === 'board' ? parsed.role : '',
    section: parsed.section,
    practice_group: parsed.section === 'practice' ? parsed.practice_group : null,
    sort_order: parsed.sort_order,
    active: parsed.active,
  }
}

function revalidate() {
  revalidatePath('/coaches')
  revalidatePath('/admin/content')
}

export async function createCoach(values: CoachInput): Promise<ActionResult> {
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can edit the coach roster.' }
  const { error } = await supabase.from('coaches').insert(row)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

export async function updateCoach(id: string, values: CoachInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing coach id' }
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can edit the coach roster.' }
  const { error } = await supabase.from('coaches').update(row).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

export async function deleteCoach(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing coach id' }
  const supabase = await createServerSupabase()
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can edit the coach roster.' }
  const { error } = await supabase.from('coaches').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}
