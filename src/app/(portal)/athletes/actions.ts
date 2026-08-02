'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { athleteSchema } from '@/lib/registration-schema'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Parents insert their own athletes via the RLS-enforced client
// (parents_own_athletes USING parent_id = auth.uid()).
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
