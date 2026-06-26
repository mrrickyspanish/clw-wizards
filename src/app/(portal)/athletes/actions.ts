'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Parents insert their own athletes via the RLS-enforced client
// (parents_own_athletes USING parent_id = auth.uid()).
const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weight_class: z.string().trim().optional().nullable(),
  usa_wrestling_card_number: z.string().trim().optional().nullable(),
  shirt_size: z.string().trim().optional().nullable(),
})

export type AddAthleteInput = z.input<typeof athleteSchema>

export async function addAthlete(values: AddAthleteInput): Promise<ActionResult> {
  const parsed = athleteSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const a = parsed.data
  const { error } = await supabase.from('athletes').insert({
    parent_id: user.id,
    first_name: a.first_name,
    last_name: a.last_name,
    date_of_birth: a.date_of_birth,
    practice_group: a.practice_group,
    weight_class: a.weight_class || null,
    usa_wrestling_card_number: a.usa_wrestling_card_number || null,
    shirt_size: a.shirt_size || null,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/athletes')
  revalidatePath('/dashboard')
  revalidatePath('/documents')
  return { ok: true }
}
