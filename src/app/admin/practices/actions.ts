'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'

// Writes go through the authenticated server client; `admin_write_practices`
// RLS enforces admin-only, and /admin is middleware-gated (defense in depth).

const practiceSchema = z.object({
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{1,2}:\d{2}$/, 'Start time is required'),
  end_time: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z.string().trim().min(1, 'Location is required'),
  notes: z.string().trim().optional().nullable(),
  active: z.boolean(),
})

export type PracticeInput = z.input<typeof practiceSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalize(values: PracticeInput) {
  const parsed = practiceSchema.parse(values)
  return {
    practice_group: parsed.practice_group,
    weekday: parsed.weekday,
    start_time: parsed.start_time,
    end_time: parsed.end_time || null,
    location: parsed.location,
    notes: parsed.notes || null,
    active: parsed.active,
  }
}

export async function createPractice(values: PracticeInput): Promise<ActionResult> {
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('practices').insert(row)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}

// Schedule the same weekly practice on several days at once — one recurring row
// per selected weekday (e.g. a group that trains Mondays and Fridays).
const practicesCreateSchema = practiceSchema
  .omit({ weekday: true })
  .extend({
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, 'Pick at least one day of the week'),
  })

export type PracticesCreateInput = z.input<typeof practicesCreateSchema>

export async function createPractices(values: PracticesCreateInput): Promise<ActionResult> {
  let parsed
  try {
    parsed = practicesCreateSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const uniqueWeekdays = [...new Set(parsed.weekdays)]
  const rows = uniqueWeekdays.map((weekday) => ({
    practice_group: parsed.practice_group,
    weekday,
    start_time: parsed.start_time,
    end_time: parsed.end_time || null,
    location: parsed.location,
    notes: parsed.notes || null,
    active: parsed.active,
  }))

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('practices').insert(rows)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}

export async function updatePractice(id: string, values: PracticeInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing practice id' }
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('practices').update(row).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}

export async function deletePractice(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing practice id' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('practices').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/practices')
  return { ok: true }
}
