'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

const submitSchema = z.object({
  seasonRegistrationId: z.string().uuid(),
  athleteId: z.string().uuid(),
})

export async function submitSeasonEnrollment(values: z.input<typeof submitSchema>): Promise<ActionResult> {
  const parsed = submitSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid registration.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('submit_season_enrollment', {
    _season_registration_id: parsed.data.seasonRegistrationId,
    _athlete_id: parsed.data.athleteId,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/registration')
  revalidatePath('/dashboard')
  revalidatePath('/dues')
  revalidatePath('/admin/registrations')
  return { ok: true }
}

const withdrawSchema = z.object({ enrollmentId: z.string().uuid() })

export async function withdrawSeasonEnrollment(values: z.input<typeof withdrawSchema>): Promise<ActionResult> {
  const parsed = withdrawSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid registration.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('withdraw_season_enrollment', { _enrollment_id: parsed.data.enrollmentId })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/registration')
  revalidatePath('/dashboard')
  revalidatePath('/admin/registrations')
  return { ok: true }
}
