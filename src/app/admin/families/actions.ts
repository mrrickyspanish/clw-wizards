'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Admin can read every athlete via RLS, but the write policies only let a
// parent mutate their *own* athletes. Admin management therefore goes through
// the service-role client — gated by this explicit admin check first, since
// that client bypasses RLS.
async function assertAdmin(): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required' }
  return { ok: true }
}

const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weight_class: z.string().trim().optional().nullable(),
  usa_wrestling_card_number: z.string().trim().optional().nullable(),
  shirt_size: z.string().trim().optional().nullable(),
  active: z.boolean(),
})

export type AthleteInput = z.input<typeof athleteSchema>

export async function updateAthlete(id: string, values: AthleteInput): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!id) return { ok: false, error: 'Missing athlete id' }

  let parsed
  try {
    parsed = athleteSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const supabase = createAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      date_of_birth: parsed.date_of_birth,
      practice_group: parsed.practice_group,
      weight_class: parsed.weight_class || null,
      usa_wrestling_card_number: parsed.usa_wrestling_card_number || null,
      shirt_size: parsed.shirt_size || null,
      active: parsed.active,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/families')
  return { ok: true }
}

export async function setFamilyActive(parentId: string, isActive: boolean): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!parentId) return { ok: false, error: 'Missing family id' }

  const supabase = createAdminSupabase()
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', parentId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/families')
  return { ok: true }
}
