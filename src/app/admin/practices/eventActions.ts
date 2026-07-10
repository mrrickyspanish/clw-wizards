'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

// One-off dated club events (banquet, parent night, fundraiser…). Writes go
// through the authenticated server client; `admin_write_club_events` RLS
// enforces admin-only, and /admin is middleware-gated (defense in depth).

const eventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  event_type: z.enum(['event', 'banquet', 'parent_night', 'fundraiser', 'meeting', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required'),
  start_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable().or(z.literal('')),
  end_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable().or(z.literal('')),
  location: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  practice_group: z.string().trim().optional().nullable(),
  active: z.boolean(),
})

export type EventInput = z.input<typeof eventSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalize(values: EventInput) {
  const parsed = eventSchema.parse(values)
  return {
    title: parsed.title,
    event_type: parsed.event_type,
    date: parsed.date,
    start_time: parsed.start_time || null,
    end_time: parsed.end_time || null,
    location: parsed.location || null,
    notes: parsed.notes || null,
    practice_group: parsed.practice_group || null,
    active: parsed.active,
  }
}

export async function createEvent(values: EventInput): Promise<ActionResult> {
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('club_events').insert(row)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}

export async function updateEvent(id: string, values: EventInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing event id' }
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('club_events').update(row).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing event id' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('club_events').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}
