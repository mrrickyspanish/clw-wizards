'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { athleteSchema } from '@/lib/registration-schema'
import { resolveFamilyOwnerIds } from '@/lib/family'
import { sameChildKey } from '@/lib/child-key'

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

  // One wrestler, one record. A co-guardian sees the family's wrestlers but
  // adds to their own account, so a check of their own account alone let them
  // add a child the family already has -- a copy with no registration or dues,
  // and a second Register button that could charge the family twice.
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, user.id)
  const { data: roster } = await supabase
    .from('athletes')
    .select('first_name, last_name')
    .in('parent_id', familyOwnerIds)
  const wanted = sameChildKey(a.first_name, a.last_name)
  const existing = (roster ?? []).find((r) => sameChildKey(r.first_name, r.last_name) === wanted)
  if (existing) {
    return {
      ok: false,
      error: `${existing.first_name} ${existing.last_name} is already on your family's roster. Contact the club if something about them needs fixing.`,
    }
  }

  const { error } = await supabase.from('athletes').insert({
    parent_id: user.id,
    first_name: a.first_name,
    last_name: a.last_name,
    date_of_birth: a.date_of_birth,
    practice_group: a.practice_group,
    division: a.division,
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
